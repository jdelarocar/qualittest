const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { getUserPermissions, clearPermissionsCache } = require('../middleware/permissions');

/**
 * GET /api/permissions/my-permissions
 * Obtener permisos del usuario actual
 */
router.get('/my-permissions', authMiddleware, getUserPermissions);

/**
 * GET /api/permissions/modules
 * Listar todos los módulos y permisos disponibles (admin only)
 */
router.get('/modules', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    const [permissions] = await db.query(`
      SELECT
        id,
        name,
        description,
        module
      FROM permissions
      ORDER BY module, name
    `);

    // Agrupar por módulo
    const modules = {};
    permissions.forEach(p => {
      if (!modules[p.module]) {
        modules[p.module] = [];
      }
      modules[p.module].push({
        id: p.id,
        name: p.name,
        description: p.description
      });
    });

    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Error al obtener módulos' });
  }
});

/**
 * GET /api/permissions/roles/:role
 * Obtener permisos configurados para un rol específico (admin only)
 */
router.get('/roles/:role', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    const { role } = req.params;

    if (!['admin', 'laboratory', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const [rolePermissions] = await db.query(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.module,
        rp.can_view,
        rp.can_create,
        rp.can_edit,
        rp.can_delete
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role = ?
      ORDER BY p.module, p.name
    `, [role]);

    res.json(rolePermissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ message: 'Error al obtener permisos del rol' });
  }
});

/**
 * PUT /api/permissions/roles/:role
 * Actualizar permisos de un rol (admin only)
 * Body: { permissions: [{ permission_id, can_view, can_create, can_edit, can_delete }] }
 */
router.put('/roles/:role', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { role } = req.params;
    const { permissions } = req.body;

    if (!['admin', 'laboratory', 'viewer'].includes(role)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Rol inválido' });
    }

    if (!Array.isArray(permissions)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Formato de permisos inválido' });
    }

    // No permitir modificar permisos de admin
    if (role === 'admin') {
      await connection.rollback();
      return res.status(403).json({ message: 'No se pueden modificar permisos del rol admin' });
    }

    // Actualizar cada permiso
    for (const perm of permissions) {
      const { permission_id, can_view, can_create, can_edit, can_delete } = perm;

      // Verificar si ya existe el permiso para este rol
      const [existing] = await connection.query(
        'SELECT id FROM role_permissions WHERE role = ? AND permission_id = ?',
        [role, permission_id]
      );

      if (existing.length > 0) {
        // Actualizar
        await connection.query(
          `UPDATE role_permissions
           SET can_view = ?, can_create = ?, can_edit = ?, can_delete = ?, updated_at = NOW()
           WHERE role = ? AND permission_id = ?`,
          [can_view || false, can_create || false, can_edit || false, can_delete || false,
           role, permission_id]
        );
      } else {
        // Insertar
        await connection.query(
          `INSERT INTO role_permissions
           (role, permission_id, can_view, can_create, can_edit, can_delete)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [role, permission_id, can_view || false, can_create || false,
           can_edit || false, can_delete || false]
        );
      }
    }

    await connection.commit();

    // Limpiar cache de permisos
    clearPermissionsCache();

    res.json({ message: 'Permisos actualizados exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating role permissions:', error);
    res.status(500).json({ message: 'Error al actualizar permisos' });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/permissions/available-roles
 * Obtener lista de roles disponibles
 */
router.get('/available-roles', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    const roles = [
      { value: 'admin', label: 'Administrador', description: 'Acceso total al sistema' },
      { value: 'laboratory', label: 'Laboratorio', description: 'Acceso para laboratorios participantes' },
      { value: 'viewer', label: 'Visualizador', description: 'Solo lectura de estadísticas' }
    ];

    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Error al obtener roles' });
  }
});

module.exports = router;
