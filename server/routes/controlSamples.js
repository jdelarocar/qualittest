const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { body, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');

// Validations
const controlSampleValidation = [
  body('program_id').isInt().withMessage('Programa es requerido'),
  body('name').trim().notEmpty().withMessage('Nombre es requerido'),
];

// GET /api/admin/control-samples - Get all control samples (ADMIN)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { program_id, active, search } = req.query;

    let query = `
      SELECT
        cs.*,
        p.name as program_name,
        u.full_name as created_by_name
      FROM control_samples cs
      LEFT JOIN programs p ON cs.program_id = p.id
      LEFT JOIN users u ON cs.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (program_id) {
      query += ' AND cs.program_id = ?';
      params.push(program_id);
    }

    if (active !== undefined) {
      query += ' AND cs.active = ?';
      params.push(active === 'true');
    }

    if (search) {
      query += ' AND (cs.name LIKE ? OR cs.lot_number LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY cs.created_at DESC';

    const [samples] = await db.query(query, params);
    res.json(samples);
  } catch (error) {
    console.error('Error fetching control samples:', error);
    res.status(500).json({ message: 'Error al cargar muestras control' });
  }
});

// GET /api/admin/control-samples/:id - Get control sample with values (ADMIN)
router.get('/admin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const [samples] = await db.query(
      `SELECT
        cs.*,
        p.name as program_name
      FROM control_samples cs
      LEFT JOIN programs p ON cs.program_id = p.id
      WHERE cs.id = ?`,
      [req.params.id]
    );

    if (samples.length === 0) {
      return res.status(404).json({ message: 'Muestra control no encontrada' });
    }

    // Get values for this control sample
    const [values] = await db.query(
      `SELECT
        csv.*,
        a.name as analyte_name,
        pr.name as principle_name
      FROM control_sample_values csv
      LEFT JOIN analytes a ON csv.analyte_id = a.id
      LEFT JOIN principles pr ON csv.principle_id = pr.id
      WHERE csv.control_sample_id = ?
      ORDER BY a.name`,
      [req.params.id]
    );

    res.json({
      ...samples[0],
      values
    });
  } catch (error) {
    console.error('Error fetching control sample:', error);
    res.status(500).json({ message: 'Error al cargar muestra control' });
  }
});

// POST /api/admin/control-samples - Create control sample with values (ADMIN)
router.post('/admin', auth, controlSampleValidation, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { program_id, name, lot_number, expiration_date, description, active, values } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert control sample
      const [result] = await connection.query(
        `INSERT INTO control_samples (program_id, name, lot_number, expiration_date, description, active, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [program_id, name, lot_number || null, expiration_date || null, description || null, active !== false, req.user.id]
      );

      const sampleId = result.insertId;

      // Insert values if provided
      if (values && values.length > 0) {
        const valueRows = values.map(v => [
          sampleId,
          v.analyte_id,
          v.principle_id || null,
          v.data_type || 'numeric',
          v.reference_value || null,
          v.upper_limit || null,
          v.lower_limit || null,
          v.unit || null
        ]);

        await connection.query(
          `INSERT INTO control_sample_values
           (control_sample_id, analyte_id, principle_id, data_type, reference_value, upper_limit, lower_limit, unit)
           VALUES ?`,
          [valueRows]
        );
      }

      await connection.commit();

      // Fetch the complete sample with values
      const [newSample] = await db.query(
        `SELECT cs.*, p.name as program_name
         FROM control_samples cs
         LEFT JOIN programs p ON cs.program_id = p.id
         WHERE cs.id = ?`,
        [sampleId]
      );

      res.status(201).json({
        message: 'Muestra control creada exitosamente',
        sample: newSample[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating control sample:', error);
    res.status(500).json({ message: 'Error al crear muestra control' });
  }
});

// PUT /api/admin/control-samples/:id - Update control sample (ADMIN)
router.put('/admin/:id', auth, controlSampleValidation, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { program_id, name, lot_number, expiration_date, description, active, values } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update control sample
      const [result] = await connection.query(
        `UPDATE control_samples
         SET program_id = ?, name = ?, lot_number = ?, expiration_date = ?, description = ?, active = ?
         WHERE id = ?`,
        [program_id, name, lot_number || null, expiration_date || null, description || null, active !== false, req.params.id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: 'Muestra control no encontrada' });
      }

      // Update values if provided
      if (values !== undefined) {
        // Delete existing values
        await connection.query('DELETE FROM control_sample_values WHERE control_sample_id = ?', [req.params.id]);

        // Insert new values
        if (values.length > 0) {
          const valueRows = values.map(v => [
            req.params.id,
            v.analyte_id,
            v.principle_id || null,
            v.data_type || 'numeric',
            v.reference_value || null,
            v.upper_limit || null,
            v.lower_limit || null,
            v.unit || null
          ]);

          await connection.query(
            `INSERT INTO control_sample_values
             (control_sample_id, analyte_id, principle_id, data_type, reference_value, upper_limit, lower_limit, unit)
             VALUES ?`,
            [valueRows]
          );
        }
      }

      await connection.commit();

      const [updatedSample] = await db.query(
        `SELECT cs.*, p.name as program_name
         FROM control_samples cs
         LEFT JOIN programs p ON cs.program_id = p.id
         WHERE cs.id = ?`,
        [req.params.id]
      );

      res.json({
        message: 'Muestra control actualizada exitosamente',
        sample: updatedSample[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating control sample:', error);
    res.status(500).json({ message: 'Error al actualizar muestra control' });
  }
});

// DELETE /api/admin/control-samples/:id - Delete control sample (ADMIN)
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    // Check if sample is being used in shipments
    const [shipments] = await db.query(
      'SELECT COUNT(*) as count FROM shipments WHERE control_sample_id = ?',
      [req.params.id]
    );

    if (shipments[0].count > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar la muestra control porque está siendo usada en envíos'
      });
    }

    const [result] = await db.query(
      'DELETE FROM control_samples WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Muestra control no encontrada' });
    }

    res.json({ message: 'Muestra control eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting control sample:', error);
    res.status(500).json({ message: 'Error al eliminar muestra control' });
  }
});

module.exports = router;
