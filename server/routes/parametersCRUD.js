const express = require('express');
const db = require('../config/database');
const { body, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');

// Generic CRUD factory for simple parameter tables
// Tables: instruments, brands, principles, calibrations, standards, temperatures, wavelengths
const createParameterRouter = (tableName, fieldName = 'name') => {
  const router = express.Router();

  // Validation
  const validation = [
    body(fieldName).trim().notEmpty().withMessage(`${fieldName} es requerido`),
  ];

  // GET /api/admin/:table - Get all records (ADMIN)
  router.get('/admin', auth, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
      }

      const { active, search } = req.query;
      let query = `SELECT * FROM ${tableName} WHERE 1=1`;
      const params = [];

      if (active !== undefined) {
        query += ' AND active = ?';
        params.push(active === 'true');
      }

      if (search) {
        query += ` AND (${fieldName} LIKE ? OR description LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
      }

      query += ` ORDER BY ${fieldName} ASC`;

      const [records] = await db.query(query, params);
      res.json(records);
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      res.status(500).json({ message: `Error al cargar ${tableName}` });
    }
  });

  // GET /api/admin/:table/:id - Get record by ID (ADMIN)
  router.get('/admin/:id', auth, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
      }

      const [records] = await db.query(
        `SELECT * FROM ${tableName} WHERE id = ?`,
        [req.params.id]
      );

      if (records.length === 0) {
        return res.status(404).json({ message: 'Registro no encontrado' });
      }

      res.json(records[0]);
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      res.status(500).json({ message: `Error al cargar ${tableName}` });
    }
  });

  // POST /api/admin/:table - Create record (ADMIN)
  router.post('/admin', auth, validation, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { [fieldName]: value, description, active } = req.body;

      const [result] = await db.query(
        `INSERT INTO ${tableName} (${fieldName}, description, active) VALUES (?, ?, ?)`,
        [value, description || null, active !== false]
      );

      const [newRecord] = await db.query(
        `SELECT * FROM ${tableName} WHERE id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        message: 'Registro creado exitosamente',
        record: newRecord[0]
      });
    } catch (error) {
      console.error(`Error creating ${tableName}:`, error);
      res.status(500).json({ message: `Error al crear ${tableName}` });
    }
  });

  // PUT /api/admin/:table/:id - Update record (ADMIN)
  router.put('/admin/:id', auth, validation, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { [fieldName]: value, description, active } = req.body;

      const [result] = await db.query(
        `UPDATE ${tableName} SET ${fieldName} = ?, description = ?, active = ? WHERE id = ?`,
        [value, description || null, active !== false, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Registro no encontrado' });
      }

      const [updatedRecord] = await db.query(
        `SELECT * FROM ${tableName} WHERE id = ?`,
        [req.params.id]
      );

      res.json({
        message: 'Registro actualizado exitosamente',
        record: updatedRecord[0]
      });
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error);
      res.status(500).json({ message: `Error al actualizar ${tableName}` });
    }
  });

  // DELETE /api/admin/:table/:id - Delete record (ADMIN)
  router.delete('/admin/:id', auth, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
      }

      const [result] = await db.query(
        `DELETE FROM ${tableName} WHERE id = ?`,
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Registro no encontrado' });
      }

      res.json({ message: 'Registro eliminado exitosamente' });
    } catch (error) {
      console.error(`Error deleting ${tableName}:`, error);
      res.status(500).json({ message: `Error al eliminar ${tableName}` });
    }
  });

  return router;
};

module.exports = createParameterRouter;
