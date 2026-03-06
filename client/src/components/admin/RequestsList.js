import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { colors } from '../../theme';

const RequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRequests();
  }, [tab]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/register-request/admin?status=${tab}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(response.data);
    } catch (error) {
      setError('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/register-request/admin/${requestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedRequest(response.data);
      setDetailDialog(true);
    } catch (error) {
      setError('Error al cargar detalle');
    }
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/register-request/admin/${selectedRequest.id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Solicitud aprobada. Código: ${response.data.laboratory.code}`);
      setApproveDialog(false);
      setDetailDialog(false);
      loadRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al aprobar solicitud');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Debe proporcionar una razón de rechazo');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/register-request/admin/${selectedRequest.id}/reject`,
        { rejection_reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Solicitud rechazada');
      setRejectDialog(false);
      setDetailDialog(false);
      setRejectionReason('');
      loadRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al rechazar solicitud');
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentPlanLabel = (plan) => {
    const labels = {
      annual: 'Anual',
      two_payments: '2 Cuotas',
      three_payments: '3 Cuotas',
      six_payments: '6 Cuotas',
    };
    return labels[plan] || plan;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="600">
        Solicitudes de Registro
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="Pendientes" value="pending" />
          <Tab label="Aprobadas" value="approved" />
          <Tab label="Rechazadas" value="rejected" />
        </Tabs>

        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Laboratorio</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Opción</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No hay solicitudes {tab === 'pending' ? 'pendientes' : tab}
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.id}</TableCell>
                        <TableCell>{request.lab_name}</TableCell>
                        <TableCell>{request.lab_email}</TableCell>
                        <TableCell>{request.participation_option_name}</TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewDetail(request.id)}
                          >
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de Solicitud #{selectedRequest?.id}</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" color="primary">Datos del Laboratorio</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Nombre</Typography>
                <Typography variant="body1">{selectedRequest.lab_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedRequest.lab_email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Teléfono</Typography>
                <Typography variant="body1">{selectedRequest.lab_phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">País</Typography>
                <Typography variant="body1">{selectedRequest.lab_country}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Dirección</Typography>
                <Typography variant="body1">{selectedRequest.lab_address}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Departamento</Typography>
                <Typography variant="body1">{selectedRequest.lab_department}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Opción de Participación</Typography>
                <Typography variant="body1">
                  {selectedRequest.participation_option_name} - Q{selectedRequest.participation_option_price}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Forma de Pago</Typography>
                <Typography variant="body1">{getPaymentPlanLabel(selectedRequest.payment_plan)}</Typography>
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" color="primary">Químico Biólogo</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Nombre</Typography>
                <Typography variant="body1">{selectedRequest.qb_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedRequest.qb_email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Celular</Typography>
                <Typography variant="body1">{selectedRequest.qb_phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Número de Colegiado</Typography>
                <Typography variant="body1">{selectedRequest.qb_license_number}</Typography>
              </Grid>

              {selectedRequest.contact_name && (
                <>
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="h6" color="primary">Contacto</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Nombre</Typography>
                    <Typography variant="body1">{selectedRequest.contact_name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedRequest.contact_email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Teléfono</Typography>
                    <Typography variant="body1">{selectedRequest.contact_phone}</Typography>
                  </Grid>
                </>
              )}

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" color="primary">Facturación</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Nombre</Typography>
                <Typography variant="body1">{selectedRequest.billing_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">NIT</Typography>
                <Typography variant="body1">{selectedRequest.billing_nit}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Dirección Fiscal</Typography>
                <Typography variant="body1">{selectedRequest.billing_address}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedRequest?.status === 'pending' && (
            <>
              <Button
                startIcon={<RejectIcon />}
                color="error"
                onClick={() => setRejectDialog(true)}
              >
                Rechazar
              </Button>
              <Button
                startIcon={<ApproveIcon />}
                variant="contained"
                color="success"
                onClick={() => setApproveDialog(true)}
              >
                Aprobar
              </Button>
            </>
          )}
          <Button onClick={() => setDetailDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)}>
        <DialogTitle>Confirmar Aprobación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de aprobar esta solicitud? Se generará automáticamente:
          </Typography>
          <ul>
            <li>Código único de laboratorio</li>
            <li>Usuario y contraseña temporal</li>
            <li>Registro en el sistema</li>
          </ul>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Se enviará un email al laboratorio con las credenciales de acceso.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : 'Aprobar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)}>
        <DialogTitle>Rechazar Solicitud</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Razón del rechazo"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explique la razón del rechazo..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestsList;
