const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { body, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');

// Validations
const providerValidation = [
  body('name').trim().notEmpty().withMessage('Nombre del proveedor es requerido'),
  body('phone').trim().notEmpty().withMessage('Teléfono es requerido'),
  body('contact_name').trim().notEmpty().withMessage('Nombre del contacto es requerido'),
  body('contact_phone').trim().notEmpty().withMessage('Teléfono del contacto es requerido'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido'),
];

// GET /api/admin/providers - Get all providers (ADMIN)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { active, search } = req.query;

    let query = 'SELECT * FROM providers WHERE 1=1';
    const params = [];

    if (active !== undefined) {
      query += ' AND active = ?';
      params.push(active === 'true');
    }

    if (search) {
      query += ' AND (name LIKE ? OR contact_name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY name ASC';

    const [providers] = await db.query(query, params);
    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ message: 'Error al cargar proveedores' });
  }
});

// GET /api/admin/providers/:id - Get provider by ID (ADMIN)
router.get('/admin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const [providers] = await db.query(
      'SELECT * FROM providers WHERE id = ?',
      [req.params.id]
    );

    if (providers.length === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    res.json(providers[0]);
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ message: 'Error al cargar proveedor' });
  }
});

// POST /api/admin/providers - Create provider (ADMIN)
router.post('/admin', auth, providerValidation, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, contact_name, contact_phone, email, address, active } = req.body;

    const [result] = await db.query(
      `INSERT INTO providers (name, phone, contact_name, contact_phone, email, address, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, phone, contact_name, contact_phone, email || null, address || null, active !== false]
    );

    const [newProvider] = await db.query(
      'SELECT * FROM providers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Proveedor creado exitosamente',
      provider: newProvider[0]
    });
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).json({ message: 'Error al crear proveedor' });
  }
});

// PUT /api/admin/providers/:id - Update provider (ADMIN)
router.put('/admin/:id', auth, providerValidation, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, contact_name, contact_phone, email, address, active } = req.body;

    const [result] = await db.query(
      `UPDATE providers
       SET name = ?, phone = ?, contact_name = ?, contact_phone = ?,
           email = ?, address = ?, active = ?
       WHERE id = ?`,
      [name, phone, contact_name, contact_phone, email || null, address || null, active !== false, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    const [updatedProvider] = await db.query(
      'SELECT * FROM providers WHERE id = ?',
      [req.params.id]
    );

    res.json({
      message: 'Proveedor actualizado exitosamente',
      provider: updatedProvider[0]
    });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({ message: 'Error al actualizar proveedor' });
  }
});

// DELETE /api/admin/providers/:id - Delete provider (ADMIN)
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    // Check if provider is being used (we can add this validation later if needed)

    const [result] = await db.query(
      'DELETE FROM providers WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    res.json({ message: 'Proveedor eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({ message: 'Error al eliminar proveedor' });
  }
});

module.exports = router;
