const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  calculateCompleteStatistics,
  calculateLaboratoryStatistics
} = require('../utils/statistics');

/**
 * POST /api/statistics/admin/shipments/:shipmentId/calculate
 * Calculate and store statistics for a shipment
 * (Called when generating/regenerating report)
 */
router.post('/shipments/:shipmentId/calculate', authenticateToken, requireRole('admin'), async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { shipmentId } = req.params;

    // Get all control sample values for this shipment
    const [sampleValues] = await connection.query(`
      SELECT
        csv.id as control_sample_value_id,
        csv.analyte_id,
        csv.data_type,
        csv.reference_value,
        csv.lower_limit,
        csv.upper_limit
      FROM shipments s
      JOIN control_sample_values csv ON s.control_sample_id = csv.id
      WHERE s.id = ?
    `, [shipmentId]);

    for (const sampleValue of sampleValues) {
      // Skip non-numeric analytes
      if (sampleValue.data_type !== 'numeric') {
        continue;
      }

      // Get all laboratory results for this analyte
      const [results] = await connection.query(`
        SELECT
          lr.id,
          lr.laboratory_id,
          lr.result_value,
          lr.is_excluded
        FROM laboratory_results lr
        WHERE lr.shipment_id = ?
          AND lr.control_sample_value_id = ?
          AND lr.result_value IS NOT NULL
          AND lr.result_value != ''
      `, [shipmentId, sampleValue.control_sample_value_id]);

      if (results.length === 0) {
        continue;
      }

      // Calculate statistics
      const stats = calculateCompleteStatistics(
        results,
        parseFloat(sampleValue.reference_value),
        parseFloat(sampleValue.lower_limit),
        parseFloat(sampleValue.upper_limit)
      );

      // Update exclusion flags
      for (const excluded of stats.excludedResults) {
        await connection.query(
          `UPDATE laboratory_results
           SET is_excluded = TRUE, exclusion_reason = ?
           WHERE id = ?`,
          [excluded.exclusion_reason, excluded.id]
        );
      }

      for (const valid of stats.validResults) {
        await connection.query(
          `UPDATE laboratory_results
           SET is_excluded = FALSE, exclusion_reason = NULL
           WHERE id = ?`,
          [valid.id]
        );
      }

      // Insert or update shipment statistics
      const [existing] = await connection.query(
        `SELECT id FROM shipment_statistics
         WHERE shipment_id = ? AND control_sample_value_id = ?`,
        [shipmentId, sampleValue.control_sample_value_id]
      );

      let statisticId;
      if (existing.length > 0) {
        await connection.query(
          `UPDATE shipment_statistics
           SET n_total = ?, n_valid = ?, n_excluded = ?,
               mean_value = ?, median_value = ?, standard_deviation = ?,
               coefficient_variation = ?, min_value = ?, max_value = ?,
               reference_value = ?, lower_limit = ?, upper_limit = ?,
               calculated_at = NOW()
           WHERE id = ?`,
          [stats.n_total, stats.n_valid, stats.n_excluded,
           stats.mean_value, stats.median_value, stats.standard_deviation,
           stats.coefficient_variation, stats.min_value, stats.max_value,
           stats.reference_value, stats.lower_limit, stats.upper_limit,
           existing[0].id]
        );
        statisticId = existing[0].id;
      } else {
        const [insertResult] = await connection.query(
          `INSERT INTO shipment_statistics
           (shipment_id, control_sample_value_id, analyte_id,
            n_total, n_valid, n_excluded,
            mean_value, median_value, standard_deviation,
            coefficient_variation, min_value, max_value,
            reference_value, lower_limit, upper_limit, calculated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [shipmentId, sampleValue.control_sample_value_id, sampleValue.analyte_id,
           stats.n_total, stats.n_valid, stats.n_excluded,
           stats.mean_value, stats.median_value, stats.standard_deviation,
           stats.coefficient_variation, stats.min_value, stats.max_value,
           stats.reference_value, stats.lower_limit, stats.upper_limit]
        );
        statisticId = insertResult.insertId;
      }

      // Calculate individual laboratory statistics
      const allValidValues = stats.validResults.map(r => parseFloat(r.result_value));

      for (const result of stats.validResults) {
        const labStats = calculateLaboratoryStatistics(
          parseFloat(result.result_value),
          stats,
          allValidValues
        );

        // Insert or update laboratory statistics
        const [existingLabStat] = await connection.query(
          `SELECT id FROM laboratory_statistics WHERE laboratory_result_id = ?`,
          [result.id]
        );

        if (existingLabStat.length > 0) {
          await connection.query(
            `UPDATE laboratory_statistics
             SET z_score = ?, z_interpretation = ?, ids_score = ?,
                 drp_score = ?, deviation_from_mean = ?, percentile = ?,
                 calculated_at = NOW()
             WHERE id = ?`,
            [labStats.z_score, labStats.z_interpretation, labStats.ids_score,
             labStats.drp_score, labStats.deviation_from_mean, labStats.percentile,
             existingLabStat[0].id]
          );
        } else {
          await connection.query(
            `INSERT INTO laboratory_statistics
             (laboratory_result_id, shipment_statistic_id,
              z_score, z_interpretation, ids_score, drp_score,
              deviation_from_mean, percentile, calculated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [result.id, statisticId,
             labStats.z_score, labStats.z_interpretation, labStats.ids_score,
             labStats.drp_score, labStats.deviation_from_mean, labStats.percentile]
          );
        }
      }
    }

    await connection.commit();
    res.json({ message: 'Statistics calculated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error calculating statistics:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/statistics/admin/shipments/:shipmentId
 * Get complete statistics for a shipment (admin view)
 */
router.get('/shipments/:shipmentId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { shipmentId } = req.params;

    // Get shipment statistics summary
    const [statistics] = await db.query(`
      SELECT
        ss.id,
        a.name as analyte_name,
        a.unit as analyte_unit,
        ss.n_total,
        ss.n_valid,
        ss.n_excluded,
        ss.mean_value,
        ss.median_value,
        ss.standard_deviation,
        ss.coefficient_variation,
        ss.min_value,
        ss.max_value,
        ss.reference_value,
        ss.lower_limit,
        ss.upper_limit,
        ss.calculated_at
      FROM shipment_statistics ss
      JOIN analytes a ON ss.analyte_id = a.id
      WHERE ss.shipment_id = ?
      ORDER BY a.name
    `, [shipmentId]);

    // Get laboratory results with statistics
    const [labResults] = await db.query(`
      SELECT
        l.code as lab_code,
        l.name as lab_name,
        a.name as analyte_name,
        lr.result_value,
        lr.is_excluded,
        lr.exclusion_reason,
        ls.z_score,
        ls.z_interpretation,
        ls.ids_score,
        ls.drp_score,
        ls.deviation_from_mean,
        ls.percentile
      FROM laboratory_results lr
      JOIN laboratories l ON lr.laboratory_id = l.id
      JOIN control_sample_values csv ON lr.control_sample_value_id = csv.id
      JOIN analytes a ON csv.analyte_id = a.id
      LEFT JOIN laboratory_statistics ls ON ls.laboratory_result_id = lr.id
      WHERE lr.shipment_id = ?
      ORDER BY l.code, a.name
    `, [shipmentId]);

    res.json({
      summary: statistics,
      laboratory_results: labResults
    });
  } catch (error) {
    console.error('Error fetching shipment statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/statistics/admin/shipments/:shipmentId/analyte/:analyteId/chart-data
 * Get data for generating Levey-Jennings and other charts
 */
router.get('/shipments/:shipmentId/analyte/:analyteId/chart-data', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { shipmentId, analyteId } = req.params;

    // Get statistic summary
    const [statistics] = await db.query(`
      SELECT * FROM shipment_statistics
      WHERE shipment_id = ? AND analyte_id = ?
    `, [shipmentId, analyteId]);

    if (!statistics.length) {
      return res.status(404).json({ message: 'Statistics not found' });
    }

    const stat = statistics[0];

    // Get all valid laboratory results
    const [results] = await db.query(`
      SELECT
        l.code as lab_code,
        l.name as lab_name,
        lr.result_value,
        ls.z_score
      FROM laboratory_results lr
      JOIN laboratories l ON lr.laboratory_id = l.id
      JOIN control_sample_values csv ON lr.control_sample_value_id = csv.id
      LEFT JOIN laboratory_statistics ls ON ls.laboratory_result_id = lr.id
      WHERE lr.shipment_id = ?
        AND csv.analyte_id = ?
        AND lr.is_excluded = FALSE
      ORDER BY l.code
    `, [shipmentId, analyteId]);

    const data = results.map((r, index) => ({
      lab_code: r.lab_code,
      lab_name: r.lab_name,
      value: parseFloat(r.result_value),
      z_score: r.z_score,
      index: index + 1
    }));

    res.json({
      statistics: stat,
      data: data
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
