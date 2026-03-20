const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get shipments for laboratory
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { programId, status } = req.query;

    let query = `
      SELECT s.*, p.name as program_name, p.code as program_code
      FROM shipments s
      JOIN programs p ON s.program_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (programId) {
      query += ' AND s.program_id = ?';
      params.push(programId);
    }

    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    query += ' ORDER BY s.year DESC, s.month DESC, s.start_date DESC';

    const [shipments] = await db.query(query, params);
    res.json(shipments);
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

// Get shipment by ID with results status
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const laboratoryId = req.user.laboratory_id;

    const [shipments] = await db.query(
      `SELECT s.*, p.name as program_name, p.code as program_code
       FROM shipments s
       JOIN programs p ON s.program_id = p.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (shipments.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const shipment = shipments[0];

    // Check if laboratory has submitted results
    const [results] = await db.query(
      'SELECT COUNT(*) as count FROM results WHERE shipment_id = ? AND laboratory_id = ?',
      [req.params.id, laboratoryId]
    );

    shipment.has_results = results[0].count > 0;

    res.json(shipment);
  } catch (error) {
    console.error('Get shipment error:', error);
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
});

// POST /api/admin/shipments - Create new shipment (ADMIN)
router.post('/admin', authMiddleware, [
  body('program_id').isInt().withMessage('Programa es requerido'),
  body('control_sample_id').isInt().withMessage('Muestra control es requerida'),
  body('description').trim().notEmpty().withMessage('Descripción es requerida'),
  body('shipment_date').isISO8601().withMessage('Fecha de envío inválida'),
  body('max_reception_date').isISO8601().withMessage('Fecha máxima de recepción inválida'),
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { program_id, control_sample_id, description, shipment_date, max_reception_date } = req.body;

    // Extract year and month from shipment_date
    const date = new Date(shipment_date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const [result] = await db.query(
      `INSERT INTO shipments
       (program_id, control_sample_id, description, year, month, start_date, max_reception_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [program_id, control_sample_id, description, year, month, shipment_date, max_reception_date]
    );

    const [newShipment] = await db.query(
      `SELECT s.*, p.name as program_name, cs.name as control_sample_name
       FROM shipments s
       JOIN programs p ON s.program_id = p.id
       LEFT JOIN control_samples cs ON s.control_sample_id = cs.id
       WHERE s.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Envío creado exitosamente',
      shipment: newShipment[0]
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ message: 'Error al crear envío' });
  }
});

// PUT /api/admin/shipments/:id/generate-report - Generate report for shipment (ADMIN)
router.put('/admin/:id/generate-report', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const [result] = await db.query(
      `UPDATE shipments
       SET report_generated = TRUE, report_generated_at = NOW(), report_generated_by = ?
       WHERE id = ?`,
      [req.user.id, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Envío no encontrado' });
    }

    res.json({ message: 'Reporte generado exitosamente' });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error al generar reporte' });
  }
});

// PUT /api/admin/shipments/:id/regenerate-report - Regenerate report for shipment (ADMIN)
router.put('/admin/:id/regenerate-report', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const [result] = await db.query(
      `UPDATE shipments
       SET report_generated_at = NOW(), report_generated_by = ?
       WHERE id = ? AND report_generated = TRUE`,
      [req.user.id, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Envío no encontrado o no tiene reporte generado' });
    }

    res.json({ message: 'Reporte regenerado exitosamente' });
  } catch (error) {
    console.error('Error regenerating report:', error);
    res.status(500).json({ message: 'Error al regenerar reporte' });
  }
});

module.exports = router;
