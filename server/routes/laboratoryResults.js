const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const {
  calculateCompleteStatistics,
  calculateLaboratoryStatistics
} = require('../utils/statistics');

/**
 * GET /api/laboratory-results/shipments/available
 * Get available shipments for result submission (laboratory view)
 */
router.get('/shipments/available', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get laboratory_id from user
    const [userRows] = await db.query(
      'SELECT laboratory_id, role FROM users WHERE id = ?',
      [userId]
    );

    if (!userRows.length) {
      return res.status(403).json({ message: 'User not found' });
    }

    const user = userRows[0];

    // If user is not associated with a laboratory and is not admin, deny access
    if (!user.laboratory_id && user.role !== 'admin') {
      return res.status(403).json({ message: 'User is not associated with a laboratory' });
    }

    const laboratoryId = user.laboratory_id;

    // Get available shipments (active or within submission period)
    const [shipments] = await db.query(`
      SELECT
        s.id,
        s.description,
        s.start_date as shipment_date,
        s.max_reception_date,
        s.status,
        s.year,
        s.month,
        p.name as program_name,
        cs.name as control_sample_name,
        cs.lot_number,
        CASE
          WHEN ? IS NOT NULL AND EXISTS (
            SELECT 1 FROM laboratory_results lr
            WHERE lr.shipment_id = s.id AND lr.laboratory_id = ?
          ) THEN TRUE
          ELSE FALSE
        END as has_submitted
      FROM shipments s
      JOIN programs p ON s.program_id = p.id
      JOIN control_samples cs ON s.control_sample_id = cs.id
      WHERE s.status IN ('active', 'pending')
        OR (s.status = 'closed' AND s.report_generated = FALSE)
      ORDER BY s.year DESC, s.month DESC, s.start_date DESC
    `, [laboratoryId, laboratoryId]);

    res.json(shipments);
  } catch (error) {
    console.error('Error fetching available shipments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/laboratory-results/shipments/:shipmentId/form
 * Get result entry form for a shipment
 */
router.get('/shipments/:shipmentId/form', authMiddleware, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const userId = req.user.id;

    // Get laboratory_id
    const [userRows] = await db.query(
      'SELECT laboratory_id FROM users WHERE id = ?',
      [userId]
    );

    if (!userRows.length || !userRows[0].laboratory_id) {
      return res.status(403).json({ message: 'User not associated with laboratory' });
    }

    const laboratoryId = userRows[0].laboratory_id;

    // Get shipment details
    const [shipments] = await db.query(`
      SELECT
        s.*,
        p.name as program_name,
        cs.id as control_sample_id,
        cs.name as control_sample_name,
        cs.lot_number,
        cs.expiration_date
      FROM shipments s
      JOIN programs p ON s.program_id = p.id
      JOIN control_samples cs ON s.control_sample_id = cs.id
      WHERE s.id = ?
    `, [shipmentId]);

    if (!shipments.length) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    const shipment = shipments[0];

    // Get control sample values (analytes)
    const [values] = await db.query(`
      SELECT
        csv.id,
        csv.analyte_id,
        a.name as analyte_name,
        a.unit as analyte_unit,
        csv.data_type,
        csv.reference_value,
        csv.lower_limit,
        csv.upper_limit,
        csv.unit,
        pr.id as principle_id,
        pr.name as principle_name
      FROM control_sample_values csv
      JOIN analytes a ON csv.analyte_id = a.id
      LEFT JOIN principles pr ON csv.principle_id = pr.id
      WHERE csv.control_sample_id = ?
      ORDER BY a.name
    `, [shipment.control_sample_id]);

    // Get existing results if any
    const [existingResults] = await db.query(`
      SELECT
        lr.id,
        lr.control_sample_value_id,
        lr.result_value,
        lr.submitted_at
      FROM laboratory_results lr
      WHERE lr.shipment_id = ? AND lr.laboratory_id = ?
    `, [shipmentId, laboratoryId]);

    // Map existing results to values
    const resultsMap = {};
    existingResults.forEach(r => {
      resultsMap[r.control_sample_value_id] = r;
    });

    const formData = values.map(v => ({
      ...v,
      result_id: resultsMap[v.id]?.id || null,
      result_value: resultsMap[v.id]?.result_value || '',
      submitted_at: resultsMap[v.id]?.submitted_at || null
    }));

    res.json({
      shipment,
      values: formData,
      has_submitted: existingResults.length > 0
    });
  } catch (error) {
    console.error('Error fetching result form:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/laboratory-results/shipments/:shipmentId/submit
 * Submit or update results for a shipment
 */
router.post('/shipments/:shipmentId/submit', authMiddleware, async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { shipmentId } = req.params;
    const { results } = req.body; // Array of { control_sample_value_id, result_value }
    const userId = req.user.id;

    // Get laboratory_id
    const [userRows] = await connection.query(
      'SELECT laboratory_id FROM users WHERE id = ?',
      [userId]
    );

    if (!userRows.length || !userRows[0].laboratory_id) {
      await connection.rollback();
      return res.status(403).json({ message: 'User not associated with laboratory' });
    }

    const laboratoryId = userRows[0].laboratory_id;

    // Verify shipment is still accepting results
    const [shipments] = await connection.query(
      'SELECT status, max_reception_date FROM shipments WHERE id = ?',
      [shipmentId]
    );

    if (!shipments.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Shipment not found' });
    }

    const now = new Date();
    const submittedAt = now;

    // Insert or update results
    for (const result of results) {
      const { control_sample_value_id, result_value } = result;

      // Check if result already exists
      const [existing] = await connection.query(
        `SELECT id FROM laboratory_results
         WHERE laboratory_id = ? AND shipment_id = ? AND control_sample_value_id = ?`,
        [laboratoryId, shipmentId, control_sample_value_id]
      );

      if (existing.length > 0) {
        // Update existing result
        await connection.query(
          `UPDATE laboratory_results
           SET result_value = ?, submitted_at = ?, updated_by = ?, updated_at = NOW()
           WHERE id = ?`,
          [result_value, submittedAt, userId, existing[0].id]
        );
      } else {
        // Insert new result
        await connection.query(
          `INSERT INTO laboratory_results
           (shipment_id, laboratory_id, control_sample_value_id, result_value,
            submitted_at, created_by, updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [shipmentId, laboratoryId, control_sample_value_id, result_value,
           submittedAt, userId, userId]
        );
      }
    }

    await connection.commit();
    res.json({ message: 'Results submitted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error submitting results:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/laboratory-results/shipments/:shipmentId/statistics
 * Get calculated statistics for a shipment (for viewing by laboratories)
 */
router.get('/shipments/:shipmentId/statistics', authMiddleware, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const userId = req.user.id;

    // Get laboratory_id
    const [userRows] = await db.query(
      'SELECT laboratory_id FROM users WHERE id = ?',
      [userId]
    );

    if (!userRows.length || !userRows[0].laboratory_id) {
      return res.status(403).json({ message: 'User not associated with laboratory' });
    }

    const laboratoryId = userRows[0].laboratory_id;

    // Check if report has been generated
    const [shipments] = await db.query(
      'SELECT report_generated FROM shipments WHERE id = ?',
      [shipmentId]
    );

    if (!shipments.length) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    if (!shipments[0].report_generated) {
      return res.status(403).json({
        message: 'Statistics not available yet. Report has not been generated.'
      });
    }

    // Get statistics for this laboratory
    const [statistics] = await db.query(`
      SELECT
        ss.id as statistic_id,
        a.name as analyte_name,
        a.unit as analyte_unit,
        lr.result_value as lab_value,
        ss.mean_value,
        ss.median_value,
        ss.standard_deviation,
        ss.coefficient_variation,
        ss.reference_value,
        ss.n_total,
        ss.n_valid,
        ls.z_score,
        ls.z_interpretation,
        ls.ids_score,
        ls.drp_score,
        ls.deviation_from_mean,
        ls.percentile
      FROM laboratory_results lr
      JOIN shipment_statistics ss ON lr.shipment_id = ss.shipment_id
        AND lr.control_sample_value_id = ss.control_sample_value_id
      JOIN analytes a ON ss.analyte_id = a.id
      LEFT JOIN laboratory_statistics ls ON ls.laboratory_result_id = lr.id
      WHERE lr.shipment_id = ? AND lr.laboratory_id = ?
    `, [shipmentId, laboratoryId]);

    res.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
