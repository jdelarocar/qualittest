const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get laboratory info (own)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [labs] = await db.query(
      'SELECT * FROM laboratories WHERE id = ?',
      [req.user.laboratory_id]
    );

    if (labs.length === 0) {
      return res.status(404).json({ error: 'Laboratory not found' });
    }

    res.json(labs[0]);
  } catch (error) {
    console.error('Get laboratory error:', error);
    res.status(500).json({ error: 'Failed to fetch laboratory info' });
  }
});

// Get all laboratories (admin only)
router.get('/', authMiddleware, roleMiddleware('admin', 'coordinator'), async (req, res) => {
  try {
    const [labs] = await db.query(
      'SELECT * FROM laboratories ORDER BY name'
    );
    res.json(labs);
  } catch (error) {
    console.error('Get laboratories error:', error);
    res.status(500).json({ error: 'Failed to fetch laboratories' });
  }
});

module.exports = router;
