const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');

// Validations
const userValidation = [
  body('username').trim().notEmpty().withMessage('Usuario es requerido'),
  body('full_name').trim().notEmpty().withMessage('Nombre completo es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('role').isIn(['admin', 'laboratory', 'coordinator']).withMessage('Rol inválido'),
];

const passwordValidation = [
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
];

// GET /api/admin/users - Get all users (ADMIN)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { role, active, search } = req.query;

    let query = `
      SELECT u.*, l.name as laboratory_name, l.code as laboratory_code
      FROM users u
      LEFT JOIN laboratories l ON u.laboratory_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }

    if (active !== undefined) {
      query += ' AND u.active = ?';
      params.push(active === 'true');
    }

    if (search) {
      query += ' AND (u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY u.created_at DESC';

    const [users] = await db.query(query, params);

    // Remove password from response
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error al cargar usuarios' });
  }
});

// GET /api/admin/users/:id - Get user by ID (ADMIN)
router.get('/admin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const [users] = await db.query(
      `SELECT u.*, l.name as laboratory_name, l.code as laboratory_code
       FROM users u
       LEFT JOIN laboratories l ON u.laboratory_id = l.id
       WHERE u.id = ?`,
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const { password, ...userWithoutPassword } = users[0];
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error al cargar usuario' });
  }
});

// POST /api/admin/users - Create user (ADMIN)
router.post('/admin', auth, [...userValidation, ...passwordValidation], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, full_name, email, role, laboratory_id, active } = req.body;

    // Check if username already exists
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'El nombre de usuario ya existe' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (username, password, full_name, email, role, laboratory_id, active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, full_name, email, role, laboratory_id || null, active !== false, req.user.id]
    );

    const [newUser] = await db.query(
      `SELECT u.*, l.name as laboratory_name, l.code as laboratory_code
       FROM users u
       LEFT JOIN laboratories l ON u.laboratory_id = l.id
       WHERE u.id = ?`,
      [result.insertId]
    );

    const { password: _, ...userWithoutPassword } = newUser[0];

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

// PUT /api/admin/users/:id - Update user (ADMIN)
router.put('/admin/:id', auth, userValidation, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, full_name, email, role, laboratory_id, active } = req.body;

    // Check if username is taken by another user
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, req.params.id]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'El nombre de usuario ya existe' });
    }

    const [result] = await db.query(
      `UPDATE users
       SET username = ?, full_name = ?, email = ?, role = ?,
           laboratory_id = ?, active = ?, updated_by = ?
       WHERE id = ?`,
      [username, full_name, email, role, laboratory_id || null, active !== false, req.user.id, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const [updatedUser] = await db.query(
      `SELECT u.*, l.name as laboratory_name, l.code as laboratory_code
       FROM users u
       LEFT JOIN laboratories l ON u.laboratory_id = l.id
       WHERE u.id = ?`,
      [req.params.id]
    );

    const { password: _, ...userWithoutPassword } = updatedUser[0];

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// PUT /api/admin/users/:id/reset-password - Reset user password (ADMIN)
router.put('/admin/:id/reset-password', auth, passwordValidation, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'UPDATE users SET password = ?, password_changed_at = NOW() WHERE id = ?',
      [hashedPassword, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error al resetear contraseña' });
  }
});

// DELETE /api/admin/users/:id - Delete user (ADMIN)
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    // Prevent deleting own account
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'No puede eliminar su propia cuenta' });
    }

    const [result] = await db.query(
      'DELETE FROM users WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

module.exports = router;
