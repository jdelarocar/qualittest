const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get analytes by program
router.get('/program/:programId', authMiddleware, async (req, res) => {
  try {
    const [analytes] = await db.query(
      'SELECT * FROM analytes WHERE program_id = ? AND active = TRUE ORDER BY sort_order, name',
      [req.params.programId]
    );
    res.json(analytes);
  } catch (error) {
    console.error('Get analytes error:', error);
    res.status(500).json({ error: 'Failed to fetch analytes' });
  }
});

// Get methods for an analyte
router.get('/:analyteId/methods', authMiddleware, async (req, res) => {
  try {
    const [methods] = await db.query(
      'SELECT * FROM methods WHERE analyte_id = ? ORDER BY name',
      [req.params.analyteId]
    );
    res.json(methods);
  } catch (error) {
    console.error('Get methods error:', error);
    res.status(500).json({ error: 'Failed to fetch methods' });
  }
});

module.exports = router;
