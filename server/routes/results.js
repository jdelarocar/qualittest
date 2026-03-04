const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get results for a shipment (laboratory's own results)
router.get('/shipment/:shipmentId', authMiddleware, async (req, res) => {
  try {
    const laboratoryId = req.user.laboratory_id;

    const [results] = await db.query(
      `SELECT r.*, a.name as analyte_name, a.code as analyte_code, a.unit,
              m.name as method_name
       FROM results r
       JOIN analytes a ON r.analyte_id = a.id
       LEFT JOIN methods m ON r.method_id = m.id
       WHERE r.shipment_id = ? AND r.laboratory_id = ?
       ORDER BY a.sort_order`,
      [req.params.shipmentId, laboratoryId]
    );

    res.json(results);
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Submit or update results
router.post('/shipment/:shipmentId', authMiddleware, async (req, res) => {
  try {
    const { results } = req.body;
    const shipmentId = req.params.shipmentId;
    const laboratoryId = req.user.laboratory_id;

    if (!results || !Array.isArray(results)) {
      return res.status(400).json({ error: 'Invalid results data' });
    }

    // Check if shipment is open
    const [shipments] = await db.query(
      'SELECT status, end_date FROM shipments WHERE id = ?',
      [shipmentId]
    );

    if (shipments.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (shipments[0].status !== 'open') {
      return res.status(400).json({ error: 'Shipment is closed' });
    }

    // Check if deadline has passed
    if (new Date() > new Date(shipments[0].end_date)) {
      return res.status(400).json({ error: 'Submission deadline has passed' });
    }

    // Use transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      for (const result of results) {
        if (result.result_value !== null && result.result_value !== '') {
          await connection.query(
            `INSERT INTO results
             (shipment_id, laboratory_id, analyte_id, result_value, method_id)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             result_value = VALUES(result_value),
             method_id = VALUES(method_id),
             updated_at = CURRENT_TIMESTAMP`,
            [
              shipmentId,
              laboratoryId,
              result.analyte_id,
              result.result_value,
              result.method_id || null
            ]
          );
        }
      }

      await connection.commit();
      res.json({ message: 'Results saved successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Save results error:', error);
    res.status(500).json({ error: 'Failed to save results' });
  }
});

module.exports = router;
