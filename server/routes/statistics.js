const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get statistics for shipment and analyte
router.get('/shipment/:shipmentId/analyte/:analyteId', authMiddleware, async (req, res) => {
  try {
    const { shipmentId, analyteId } = req.params;
    const laboratoryId = req.user.laboratory_id;

    // Get overall statistics
    const [statsAll] = await db.query(
      `SELECT * FROM statistics
       WHERE shipment_id = ? AND analyte_id = ? AND method_id IS NULL`,
      [shipmentId, analyteId]
    );

    // Get laboratory's result and method
    const [labResults] = await db.query(
      `SELECT r.*, m.name as method_name, m.principle
       FROM results r
       LEFT JOIN methods m ON r.method_id = m.id
       WHERE r.shipment_id = ? AND r.analyte_id = ? AND r.laboratory_id = ?`,
      [shipmentId, analyteId, laboratoryId]
    );

    let statsMethod = null;
    if (labResults.length > 0 && labResults[0].method_id) {
      // Get statistics for laboratory's method
      const [methodStats] = await db.query(
        `SELECT * FROM statistics
         WHERE shipment_id = ? AND analyte_id = ? AND method_id = ?`,
        [shipmentId, analyteId, labResults[0].method_id]
      );
      statsMethod = methodStats[0] || null;
    }

    // Get performance metrics
    let performance = null;
    if (labResults.length > 0) {
      const [metrics] = await db.query(
        `SELECT * FROM performance_metrics WHERE result_id = ?`,
        [labResults[0].id]
      );
      performance = metrics[0] || null;
    }

    // Get all results for distribution
    const [allResults] = await db.query(
      `SELECT result_value, method_id FROM results
       WHERE shipment_id = ? AND analyte_id = ?
       ORDER BY result_value`,
      [shipmentId, analyteId]
    );

    res.json({
      statistics_all: statsAll[0] || null,
      statistics_method: statsMethod,
      laboratory_result: labResults[0] || null,
      performance,
      all_results: allResults
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get IDS history for laboratory and analyte
router.get('/history/ids', authMiddleware, async (req, res) => {
  try {
    const { analyteId, year } = req.query;
    const laboratoryId = req.user.laboratory_id;

    if (!analyteId) {
      return res.status(400).json({ error: 'Analyte ID required' });
    }

    let query = `
      SELECT s.name as shipment_name, s.month, s.year,
             r.result_value, pm.ids_all, pm.ids_method,
             st.mean_value, st.std_dev
      FROM results r
      JOIN shipments s ON r.shipment_id = s.id
      LEFT JOIN performance_metrics pm ON pm.result_id = r.id
      LEFT JOIN statistics st ON st.shipment_id = s.id AND st.analyte_id = r.analyte_id AND st.method_id IS NULL
      WHERE r.laboratory_id = ? AND r.analyte_id = ?
    `;
    const params = [laboratoryId, analyteId];

    if (year) {
      query += ' AND s.year = ?';
      params.push(year);
    }

    query += ' ORDER BY s.year DESC, s.month DESC';

    const [history] = await db.query(query, params);
    res.json(history);
  } catch (error) {
    console.error('Get IDS history error:', error);
    res.status(500).json({ error: 'Failed to fetch IDS history' });
  }
});

// Calculate statistics for a shipment (admin only)
router.post('/calculate/:shipmentId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const shipmentId = req.params.shipmentId;

    // Get all analytes for this shipment's program
    const [shipments] = await db.query(
      'SELECT program_id FROM shipments WHERE id = ?',
      [shipmentId]
    );

    if (shipments.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const [analytes] = await db.query(
      'SELECT id FROM analytes WHERE program_id = ?',
      [shipments[0].program_id]
    );

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      for (const analyte of analytes) {
        // Calculate statistics for all results (no method filter)
        await calculateStatsForAnalyte(connection, shipmentId, analyte.id, null);

        // Get unique methods for this analyte in this shipment
        const [methods] = await connection.query(
          'SELECT DISTINCT method_id FROM results WHERE shipment_id = ? AND analyte_id = ? AND method_id IS NOT NULL',
          [shipmentId, analyte.id]
        );

        // Calculate statistics for each method
        for (const method of methods) {
          await calculateStatsForAnalyte(connection, shipmentId, analyte.id, method.method_id);
        }
      }

      // Calculate performance metrics
      await calculatePerformanceMetrics(connection, shipmentId);

      await connection.commit();
      res.json({ message: 'Statistics calculated successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Calculate statistics error:', error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

// Helper function to calculate statistics
async function calculateStatsForAnalyte(connection, shipmentId, analyteId, methodId) {
  let query = `
    SELECT result_value FROM results
    WHERE shipment_id = ? AND analyte_id = ? AND result_value IS NOT NULL
  `;
  const params = [shipmentId, analyteId];

  if (methodId) {
    query += ' AND method_id = ?';
    params.push(methodId);
  }

  const [results] = await connection.query(query, params);

  if (results.length === 0) return;

  const values = results.map(r => parseFloat(r.result_value));

  // Remove outliers using IQR method
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const filtered = values.filter(v => v >= lowerBound && v <= upperBound);
  const excluded = values.length - filtered.length;

  // Calculate statistics
  const n = filtered.length;
  const mean = filtered.reduce((a, b) => a + b, 0) / n;
  const variance = filtered.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / mean) * 100;
  const min = Math.min(...filtered);
  const max = Math.max(...filtered);

  // Get reference value (could be from control serum data)
  const referenceValue = mean; // Simplified - should come from reference data

  // Insert or update statistics
  await connection.query(
    `INSERT INTO statistics
     (shipment_id, analyte_id, method_id, n_total, n_excluded, mean_value,
      std_dev, cv_percent, reference_value, min_value, max_value)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     n_total = VALUES(n_total),
     n_excluded = VALUES(n_excluded),
     mean_value = VALUES(mean_value),
     std_dev = VALUES(std_dev),
     cv_percent = VALUES(cv_percent),
     reference_value = VALUES(reference_value),
     min_value = VALUES(min_value),
     max_value = VALUES(max_value),
     calculated_at = CURRENT_TIMESTAMP`,
    [shipmentId, analyteId, methodId, values.length, excluded, mean, stdDev, cv, referenceValue, min, max]
  );
}

// Helper function to calculate performance metrics
async function calculatePerformanceMetrics(connection, shipmentId) {
  // Get all results for this shipment
  const [results] = await connection.query(
    `SELECT r.id, r.result_value, r.analyte_id, r.method_id
     FROM results r
     WHERE r.shipment_id = ?`,
    [shipmentId]
  );

  for (const result of results) {
    // Get overall statistics
    const [statsAll] = await connection.query(
      'SELECT mean_value, std_dev, reference_value FROM statistics WHERE shipment_id = ? AND analyte_id = ? AND method_id IS NULL',
      [shipmentId, result.analyte_id]
    );

    if (statsAll.length === 0) continue;

    const { mean_value: meanAll, std_dev: sdAll, reference_value: refValue } = statsAll[0];

    // Calculate IDS and DRP for all labs
    const idsAll = (result.result_value - meanAll) / sdAll;
    const drpAll = ((result.result_value - meanAll) / meanAll) * 100;

    // Get method-specific statistics
    let idsMethod = null;
    let drpMethod = null;

    if (result.method_id) {
      const [statsMethod] = await connection.query(
        'SELECT mean_value, std_dev FROM statistics WHERE shipment_id = ? AND analyte_id = ? AND method_id = ?',
        [shipmentId, result.analyte_id, result.method_id]
      );

      if (statsMethod.length > 0) {
        const { mean_value: meanMethod, std_dev: sdMethod } = statsMethod[0];
        idsMethod = (result.result_value - meanMethod) / sdMethod;
        drpMethod = ((result.result_value - meanMethod) / meanMethod) * 100;
      }
    }

    // Calculate Z-score
    const zScore = (result.result_value - refValue) / sdAll;

    // Insert or update performance metrics
    await connection.query(
      `INSERT INTO performance_metrics
       (result_id, ids_all, ids_method, drp_all, drp_method, z_score)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       ids_all = VALUES(ids_all),
       ids_method = VALUES(ids_method),
       drp_all = VALUES(drp_all),
       drp_method = VALUES(drp_method),
       z_score = VALUES(z_score),
       calculated_at = CURRENT_TIMESTAMP`,
      [result.id, idsAll, idsMethod, drpAll, drpMethod, zScore]
    );
  }
}

module.exports = router;
