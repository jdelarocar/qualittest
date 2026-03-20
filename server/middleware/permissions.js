const db = require('../config/database');

/**
 * Cache de permisos en memoria para evitar consultas repetidas
 * Estructura: { "role:module": { can_view, can_create, can_edit, can_delete } }
 */
const permissionsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let lastCacheUpdate = Date.now();

/**
 * Limpia el cache de permisos
 */
const clearPermissionsCache = () => {
  permissionsCache.clear();
  lastCacheUpdate = Date.now();
};

/**
 * Obtiene los permisos de un rol para un módulo específico
 */
const getPermissions = async (role, module) => {
  // Verificar si el cache está vigente
  if (Date.now() - lastCacheUpdate > CACHE_TTL) {
    clearPermissionsCache();
  }

  const cacheKey = `${role}:${module}`;

  // Verificar cache
  if (permissionsCache.has(cacheKey)) {
    return permissionsCache.get(cacheKey);
  }

  // Consultar base de datos
  try {
    const [rows] = await db.query(`
      SELECT rp.can_view, rp.can_create, rp.can_edit, rp.can_delete
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role = ? AND p.module = ?
    `, [role, module]);

    const permissions = rows.length > 0 ? rows[0] : {
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false
    };

    // Guardar en cache
    permissionsCache.set(cacheKey, permissions);

    return permissions;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return {
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false
    };
  }
};

/**
 * Middleware para verificar permisos de acceso a un módulo
 * @param {string} module - Nombre del módulo a verificar
 * @param {string} action - Acción requerida: 'view', 'create', 'edit', 'delete'
 */
const checkPermission = (module, action = 'view') => {
  return async (req, res, next) => {
    try {
      // El usuario debe estar autenticado
      if (!req.user || !req.user.role) {
        return res.status(401).json({ message: 'No autorizado' });
      }

      const { role } = req.user;

      // Admin siempre tiene acceso total
      if (role === 'admin') {
        return next();
      }

      // Obtener permisos del rol para el módulo
      const permissions = await getPermissions(role, module);

      // Verificar la acción específica
      const actionField = `can_${action}`;

      if (!permissions[actionField]) {
        return res.status(403).json({
          message: `No tiene permisos para ${action === 'view' ? 'ver' : action === 'create' ? 'crear' : action === 'edit' ? 'editar' : 'eliminar'} este recurso`,
          module,
          action,
          required_permission: actionField
        });
      }

      // Adjuntar permisos al request para uso posterior
      req.permissions = permissions;

      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      res.status(500).json({ message: 'Error al verificar permisos' });
    }
  };
};

/**
 * Obtiene todos los permisos de un usuario (para enviar al frontend)
 */
const getUserPermissions = async (req, res) => {
  try {
    const { role } = req.user;

    // Si es admin, retornar acceso total a todos los módulos
    if (role === 'admin') {
      const [modules] = await db.query('SELECT DISTINCT module FROM permissions');
      const permissions = {};

      modules.forEach(m => {
        permissions[m.module] = {
          can_view: true,
          can_create: true,
          can_edit: true,
          can_delete: true
        };
      });

      return res.json({ role, permissions });
    }

    // Para otros roles, obtener sus permisos específicos
    const [rows] = await db.query(`
      SELECT
        p.module,
        rp.can_view,
        rp.can_create,
        rp.can_edit,
        rp.can_delete
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role = ?
    `, [role]);

    const permissions = {};
    rows.forEach(row => {
      permissions[row.module] = {
        can_view: Boolean(row.can_view),
        can_create: Boolean(row.can_create),
        can_edit: Boolean(row.can_edit),
        can_delete: Boolean(row.can_delete)
      };
    });

    res.json({ role, permissions });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ message: 'Error al obtener permisos' });
  }
};

module.exports = {
  checkPermission,
  getUserPermissions,
  getPermissions,
  clearPermissionsCache
};
