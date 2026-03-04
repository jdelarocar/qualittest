const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

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

module.exports = router;
