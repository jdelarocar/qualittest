const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');

// Validations
const requestValidation = [
  body('lab_name').trim().notEmpty().withMessage('Nombre del laboratorio es requerido'),
  body('lab_email').isEmail().withMessage('Email del laboratorio inválido'),
  body('lab_address').trim().notEmpty().withMessage('Dirección es requerida'),
  body('lab_department').trim().notEmpty().withMessage('Departamento es requerido'),
  body('lab_phone').trim().notEmpty().withMessage('Teléfono es requerido'),
  body('participation_option_id').isInt().withMessage('Opción de participación es requerida'),
  body('payment_plan').isIn(['annual', 'two_payments', 'three_payments', 'six_payments']).withMessage('Forma de pago inválida'),
  body('qb_name').trim().notEmpty().withMessage('Nombre del químico biólogo es requerido'),
  body('qb_email').isEmail().withMessage('Email del químico biólogo inválido'),
  body('qb_phone').trim().notEmpty().withMessage('Celular del químico biólogo es requerido'),
  body('qb_license_number').trim().notEmpty().withMessage('Número de colegiado es requerido'),
  body('billing_name').trim().notEmpty().withMessage('Nombre de facturación es requerido'),
  body('billing_nit').trim().notEmpty().withMessage('NIT es requerido'),
  body('billing_address').trim().notEmpty().withMessage('Dirección de facturación es requerida'),
];

// POST /api/register-request - Create new registration request (PUBLIC)
router.post('/', requestValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      lab_name, lab_email, lab_address, lab_country = 'Guatemala', lab_department,
      lab_phone, participation_option_id, payment_plan,
      qb_name, qb_email, qb_phone, qb_license_number,
      contact_name, contact_email, contact_phone,
      billing_name, billing_nit, billing_address
    } = req.body;

    // Check if email already exists
    const [existingLab] = await db.query(
      'SELECT id FROM laboratories WHERE email = ?',
      [lab_email]
    );

    if (existingLab.length > 0) {
      return res.status(400).json({
        message: 'Ya existe un laboratorio registrado con este correo electrónico'
      });
    }

    // Check for pending requests with same email
    const [pendingRequest] = await db.query(
      'SELECT id FROM registration_requests WHERE lab_email = ? AND status = ?',
      [lab_email, 'pending']
    );

    if (pendingRequest.length > 0) {
      return res.status(400).json({
        message: 'Ya existe una solicitud pendiente con este correo electrónico'
      });
    }

    // Insert registration request
    const [result] = await db.query(
      `INSERT INTO registration_requests (
        lab_name, lab_email, lab_address, lab_country, lab_department, lab_phone,
        participation_option_id, payment_plan,
        qb_name, qb_email, qb_phone, qb_license_number,
        contact_name, contact_email, contact_phone,
        billing_name, billing_nit, billing_address,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        lab_name, lab_email, lab_address, lab_country, lab_department, lab_phone,
        participation_option_id, payment_plan,
        qb_name, qb_email, qb_phone, qb_license_number,
        contact_name || null, contact_email || null, contact_phone || null,
        billing_name, billing_nit, billing_address
      ]
    );

    res.status(201).json({
      message: 'Solicitud enviada exitosamente. Recibirá una respuesta en las próximas 48 horas.',
      requestId: result.insertId
    });

  } catch (error) {
    console.error('Error creating registration request:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
});

// GET /api/admin/requests - Get all registration requests (ADMIN)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { status = 'pending' } = req.query;

    const [requests] = await db.query(
      `SELECT
        rr.*,
        po.name as participation_option_name,
        po.price as participation_option_price
      FROM registration_requests rr
      LEFT JOIN participation_options po ON rr.participation_option_id = po.id
      WHERE rr.status = ?
      ORDER BY rr.created_at DESC`,
      [status]
    );

    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Error al cargar solicitudes' });
  }
});

// GET /api/admin/requests/:id - Get single request (ADMIN)
router.get('/admin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const [requests] = await db.query(
      `SELECT
        rr.*,
        po.name as participation_option_name,
        po.price as participation_option_price,
        po.type as participation_option_type
      FROM registration_requests rr
      LEFT JOIN participation_options po ON rr.participation_option_id = po.id
      WHERE rr.id = ?`,
      [req.params.id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    res.json(requests[0]);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ message: 'Error al cargar solicitud' });
  }
});

// PUT /api/admin/requests/:id/approve - Approve request (ADMIN)
router.put('/admin/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    // Get request details
    const [requests] = await db.query(
      'SELECT * FROM registration_requests WHERE id = ? AND status = ?',
      [req.params.id, 'pending']
    );

    if (requests.length === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada o ya procesada' });
    }

    const request = requests[0];

    // Generate unique laboratory code
    const [lastLab] = await db.query(
      'SELECT code FROM laboratories ORDER BY id DESC LIMIT 1'
    );

    let newCode = 'LAB-0001';
    if (lastLab.length > 0) {
      const lastNumber = parseInt(lastLab[0].code.split('-')[1]);
      newCode = `LAB-${String(lastNumber + 1).padStart(4, '0')}`;
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Create laboratory
      const [labResult] = await connection.query(
        `INSERT INTO laboratories (
          code, name, email, address, phone, country, department,
          director_name, director_license, status, registration_date,
          participation_option_id, payment_plan,
          qb_name, qb_email, qb_phone, qb_license_number,
          contact_name, contact_email, contact_phone,
          billing_name, billing_nit, billing_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newCode, request.lab_name, request.lab_email, request.lab_address,
          request.lab_phone, request.lab_country, request.lab_department,
          request.qb_name, request.qb_license_number,
          request.participation_option_id, request.payment_plan,
          request.qb_name, request.qb_email, request.qb_phone, request.qb_license_number,
          request.contact_name, request.contact_email, request.contact_phone,
          request.billing_name, request.billing_nit, request.billing_address
        ]
      );

      const labId = labResult.insertId;

      // Create user
      await connection.query(
        `INSERT INTO users (
          laboratory_id, username, password, full_name, email, role
        ) VALUES (?, ?, ?, ?, ?, 'laboratory')`,
        [labId, newCode, hashedPassword, request.qb_name, request.lab_email]
      );

      // Update request status
      await connection.query(
        `UPDATE registration_requests
         SET status = 'approved', reviewed_by = ?, reviewed_at = NOW()
         WHERE id = ?`,
        [req.user.id, req.params.id]
      );

      await connection.commit();
      connection.release();

      // TODO: Send email with credentials
      // sendCredentialsEmail(request.lab_email, newCode, tempPassword);

      res.json({
        message: 'Solicitud aprobada exitosamente',
        laboratory: {
          code: newCode,
          name: request.lab_name,
          email: request.lab_email,
          temporaryPassword: tempPassword
        }
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ message: 'Error al aprobar solicitud' });
  }
});

// PUT /api/admin/requests/:id/reject - Reject request (ADMIN)
router.put('/admin/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({ message: 'Debe proporcionar una razón de rechazo' });
    }

    const [result] = await db.query(
      `UPDATE registration_requests
       SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ? AND status = 'pending'`,
      [rejection_reason, req.user.id, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada o ya procesada' });
    }

    // TODO: Send rejection email
    // sendRejectionEmail(request.lab_email, rejection_reason);

    res.json({ message: 'Solicitud rechazada' });

  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Error al rechazar solicitud' });
  }
});

module.exports = router;
