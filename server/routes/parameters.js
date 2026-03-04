const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get laboratory parameters for a program and year
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { programId, year } = req.query;
    const laboratoryId = req.user.laboratory_id;

    if (!programId || !year) {
      return res.status(400).json({ error: 'Program ID and year required' });
    }

    const [parameters] = await db.query(
      `SELECT lp.*, a.name as analyte_name, a.code as analyte_code, a.unit,
              m.name as method_name
       FROM lab_parameters lp
       JOIN analytes a ON lp.analyte_id = a.id
       LEFT JOIN methods m ON lp.method_id = m.id
       WHERE lp.laboratory_id = ? AND a.program_id = ? AND lp.year = ?
       ORDER BY a.sort_order`,
      [laboratoryId, programId, year]
    );

    res.json(parameters);
  } catch (error) {
    console.error('Get parameters error:', error);
    res.status(500).json({ error: 'Failed to fetch parameters' });
  }
});

// Save or update laboratory parameters
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { parameters, year } = req.body;
    const laboratoryId = req.user.laboratory_id;

    if (!parameters || !Array.isArray(parameters) || !year) {
      return res.status(400).json({ error: 'Invalid parameters data' });
    }

    // Use transaction for batch insert/update
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      for (const param of parameters) {
        await connection.query(
          `INSERT INTO lab_parameters
           (laboratory_id, analyte_id, method_id, brand, instrument, standard,
            calibration, temperature, wavelength, year)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           method_id = VALUES(method_id),
           brand = VALUES(brand),
           instrument = VALUES(instrument),
           standard = VALUES(standard),
           calibration = VALUES(calibration),
           temperature = VALUES(temperature),
           wavelength = VALUES(wavelength)`,
          [
            laboratoryId,
            param.analyte_id,
            param.method_id || null,
            param.brand || null,
            param.instrument || null,
            param.standard || null,
            param.calibration || null,
            param.temperature || null,
            param.wavelength || null,
            year
          ]
        );
      }

      await connection.commit();
      res.json({ message: 'Parameters saved successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Save parameters error:', error);
    res.status(500).json({ error: 'Failed to save parameters' });
  }
});

module.exports = router;
