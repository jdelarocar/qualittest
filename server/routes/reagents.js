const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { body, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');

// Validations
const reagentValidation = [
  body('name').trim().notEmpty().withMessage('Nombre es requerido'),
];

// GET /api/admin/reagents - Get all reagents with relations (ADMIN)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { active, search } = req.query;

    let query = `
      SELECT
        r.*,
        b.name as brand_name,
        p.name as provider_name,
        a.name as analyte_name
      FROM reagents r
      LEFT JOIN brands b ON r.brand_id = b.id
      LEFT JOIN providers p ON r.provider_id = p.id
      LEFT JOIN analytes a ON r.analyte_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (active !== undefined) {
      query += ' AND r.active = ?';
      params.push(active === 'true');
    }

    if (search) {
      query += ' AND (r.name LIKE ? OR b.name LIKE ? OR p.name LIKE ? OR a.name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY r.name ASC';

    const [reagents] = await db.query(query, params);
    res.json(reagents);
  } catch (error) {
    console.error('Error fetching reagents:', error);
    res.status(500).json({ message: 'Error al cargar reactivos' });
  }
});

// GET /api/admin/reagents/:id - Get reagent by ID (ADMIN)
router.get('/admin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const [reagents] = await db.query(
      `SELECT
        r.*,
        b.name as brand_name,
        p.name as provider_name,
        a.name as analyte_name
      FROM reagents r
      LEFT JOIN brands b ON r.brand_id = b.id
      LEFT JOIN providers p ON r.provider_id = p.id
      LEFT JOIN analytes a ON r.analyte_id = a.id
      WHERE r.id = ?`,
      [req.params.id]
    );

    if (reagents.length === 0) {
      return res.status(404).json({ message: 'Reactivo no encontrado' });
    }

    res.json(reagents[0]);
  } catch (error) {
    console.error('Error fetching reagent:', error);
    res.status(500).json({ message: 'Error al cargar reactivo' });
  }
});

// POST /api/admin/reagents - Create reagent (ADMIN)
router.post('/admin', auth, reagentValidation, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, brand_id, provider_id, analyte_id, description, active } = req.body;

    const [result] = await db.query(
      `INSERT INTO reagents (name, brand_id, provider_id, analyte_id, description, active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, brand_id || null, provider_id || null, analyte_id || null, description || null, active !== false]
    );

    const [newReagent] = await db.query(
      `SELECT
        r.*,
        b.name as brand_name,
        p.name as provider_name,
        a.name as analyte_name
      FROM reagents r
      LEFT JOIN brands b ON r.brand_id = b.id
      LEFT JOIN providers p ON r.provider_id = p.id
      LEFT JOIN analytes a ON r.analyte_id = a.id
      WHERE r.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Reactivo creado exitosamente',
      reagent: newReagent[0]
    });
  } catch (error) {
    console.error('Error creating reagent:', error);
    res.status(500).json({ message: 'Error al crear reactivo' });
  }
});

// PUT /api/admin/reagents/:id - Update reagent (ADMIN)
router.put('/admin/:id', auth, reagentValidation, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, brand_id, provider_id, analyte_id, description, active } = req.body;

    const [result] = await db.query(
      `UPDATE reagents
       SET name = ?, brand_id = ?, provider_id = ?, analyte_id = ?, description = ?, active = ?
       WHERE id = ?`,
      [name, brand_id || null, provider_id || null, analyte_id || null, description || null, active !== false, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Reactivo no encontrado' });
    }

    const [updatedReagent] = await db.query(
      `SELECT
        r.*,
        b.name as brand_name,
        p.name as provider_name,
        a.name as analyte_name
      FROM reagents r
      LEFT JOIN brands b ON r.brand_id = b.id
      LEFT JOIN providers p ON r.provider_id = p.id
      LEFT JOIN analytes a ON r.analyte_id = a.id
      WHERE r.id = ?`,
      [req.params.id]
    );

    res.json({
      message: 'Reactivo actualizado exitosamente',
      reagent: updatedReagent[0]
    });
  } catch (error) {
    console.error('Error updating reagent:', error);
    res.status(500).json({ message: 'Error al actualizar reactivo' });
  }
});

// DELETE /api/admin/reagents/:id - Delete reagent (ADMIN)
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const [result] = await db.query(
      'DELETE FROM reagents WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Reactivo no encontrado' });
    }

    res.json({ message: 'Reactivo eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting reagent:', error);
    res.status(500).json({ message: 'Error al eliminar reactivo' });
  }
});

module.exports = router;
