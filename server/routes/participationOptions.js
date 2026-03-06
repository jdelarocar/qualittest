const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Validations
const optionValidation = [
  body('name').trim().notEmpty().withMessage('Nombre es requerido'),
  body('price').isFloat({ min: 0 }).withMessage('Precio debe ser mayor o igual a 0'),
  body('type').isIn(['open', 'closed']).withMessage('Tipo debe ser "open" o "closed"'),
  body('program_ids').isArray({ min: 1 }).withMessage('Debe seleccionar al menos un programa'),
];

// GET /api/participation-options - Get all participation options (PUBLIC for registration form)
router.get('/', async (req, res) => {
  try {
    const [options] = await db.query(
      `SELECT
        po.*,
        GROUP_CONCAT(p.name SEPARATOR ', ') as programs
      FROM participation_options po
      LEFT JOIN participation_option_programs pop ON po.id = pop.participation_option_id
      LEFT JOIN programs p ON pop.program_id = p.id
      WHERE po.active = TRUE
      GROUP BY po.id
      ORDER BY po.price ASC`
    );

    res.json(options);
  } catch (error) {
    console.error('Error fetching participation options:', error);
    res.status(500).json({ message: 'Error al cargar opciones de participación' });
  }
});

// GET /api/admin/participation-options - Get all options with details (ADMIN)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const [options] = await db.query(
      `SELECT
        po.*,
        GROUP_CONCAT(p.id) as program_ids,
        GROUP_CONCAT(p.name SEPARATOR ', ') as programs,
        COUNT(DISTINCT l.id) as laboratories_count
      FROM participation_options po
      LEFT JOIN participation_option_programs pop ON po.id = pop.participation_option_id
      LEFT JOIN programs p ON pop.program_id = p.id
      LEFT JOIN laboratories l ON po.id = l.participation_option_id AND l.status = 'active'
      GROUP BY po.id
      ORDER BY po.created_at DESC`
    );

    res.json(options);
  } catch (error) {
    console.error('Error fetching participation options:', error);
    res.status(500).json({ message: 'Error al cargar opciones de participación' });
  }
});

// GET /api/admin/participation-options/:id - Get single option (ADMIN)
router.get('/admin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const [options] = await db.query(
      `SELECT po.* FROM participation_options po WHERE po.id = ?`,
      [req.params.id]
    );

    if (options.length === 0) {
      return res.status(404).json({ message: 'Opción no encontrada' });
    }

    // Get associated programs
    const [programs] = await db.query(
      `SELECT p.id, p.name FROM programs p
       INNER JOIN participation_option_programs pop ON p.id = pop.program_id
       WHERE pop.participation_option_id = ?`,
      [req.params.id]
    );

    const option = options[0];
    option.programs = programs;
    option.program_ids = programs.map(p => p.id);

    res.json(option);
  } catch (error) {
    console.error('Error fetching option:', error);
    res.status(500).json({ message: 'Error al cargar opción' });
  }
});

// POST /api/admin/participation-options - Create new option (ADMIN)
router.post('/admin', auth, optionValidation, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, price, type, description, program_ids, active = true } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert option
      const [result] = await connection.query(
        `INSERT INTO participation_options (name, price, type, description, active)
         VALUES (?, ?, ?, ?, ?)`,
        [name, price, type, description || null, active]
      );

      const optionId = result.insertId;

      // Insert program associations
      if (program_ids && program_ids.length > 0) {
        const values = program_ids.map(programId => [optionId, programId]);
        await connection.query(
          'INSERT INTO participation_option_programs (participation_option_id, program_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      connection.release();

      res.status(201).json({
        message: 'Opción de participación creada exitosamente',
        optionId
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Error creating participation option:', error);
    res.status(500).json({ message: 'Error al crear opción de participación' });
  }
});

// PUT /api/admin/participation-options/:id - Update option (ADMIN)
router.put('/admin/:id', auth, optionValidation, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, price, type, description, program_ids, active } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update option
      await connection.query(
        `UPDATE participation_options
         SET name = ?, price = ?, type = ?, description = ?, active = ?
         WHERE id = ?`,
        [name, price, type, description || null, active, req.params.id]
      );

      // Delete old program associations
      await connection.query(
        'DELETE FROM participation_option_programs WHERE participation_option_id = ?',
        [req.params.id]
      );

      // Insert new program associations
      if (program_ids && program_ids.length > 0) {
        const values = program_ids.map(programId => [req.params.id, programId]);
        await connection.query(
          'INSERT INTO participation_option_programs (participation_option_id, program_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      connection.release();

      res.json({ message: 'Opción de participación actualizada exitosamente' });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Error updating participation option:', error);
    res.status(500).json({ message: 'Error al actualizar opción de participación' });
  }
});

// DELETE /api/admin/participation-options/:id - Delete option (ADMIN)
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    // Check if option is being used by any active laboratory
    const [labs] = await db.query(
      'SELECT COUNT(*) as count FROM laboratories WHERE participation_option_id = ? AND status = ?',
      [req.params.id, 'active']
    );

    if (labs[0].count > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar esta opción porque está siendo usada por laboratorios activos'
      });
    }

    await db.query('DELETE FROM participation_options WHERE id = ?', [req.params.id]);

    res.json({ message: 'Opción de participación eliminada exitosamente' });

  } catch (error) {
    console.error('Error deleting participation option:', error);
    res.status(500).json({ message: 'Error al eliminar opción de participación' });
  }
});

module.exports = router;
