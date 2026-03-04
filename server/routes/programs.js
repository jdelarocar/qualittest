const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get all programs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [programs] = await db.query(
      'SELECT * FROM programs WHERE active = TRUE ORDER BY name'
    );
    res.json(programs);
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Get program by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [programs] = await db.query(
      'SELECT * FROM programs WHERE id = ?',
      [req.params.id]
    );

    if (programs.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json(programs[0]);
  } catch (error) {
    console.error('Get program error:', error);
    res.status(500).json({ error: 'Failed to fetch program' });
  }
});

module.exports = router;
