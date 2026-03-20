import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Chip, CircularProgress,
  Alert, IconButton, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';

const ShipmentsAdmin = () => {
  const [shipments, setShipments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [controlSamples, setControlSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [formData, setFormData] = useState({
    program_id: '',
    control_sample_id: '',
    description: '',
    shipment_date: '',
    max_reception_date: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadShipments();
    loadRelatedData();
  }, []);

  const loadShipments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/shipments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShipments(response.data);
    } catch (error) {
      setError('Error al cargar envíos');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [programsRes, samplesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/programs`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/control-samples/admin`, {
          params: { active: 'true' },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setPrograms(programsRes.data);
      setControlSamples(samplesRes.data);
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      program_id: '',
      control_sample_id: '',
      description: '',
      shipment_date: '',
      max_reception_date: '',
    });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!formData.program_id || !formData.control_sample_id || !formData.description ||
        !formData.shipment_date || !formData.max_reception_date) {
      setError('Todos los campos son requeridos');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/shipments/admin`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Envío creado exitosamente');
      setDialog(false);
      loadShipments();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear envío');
    }
  };

  const handleGenerateReport = async (shipmentId) => {
    if (!window.confirm('¿Generar reporte para este envío?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/shipments/admin/${shipmentId}/generate-report`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Reporte generado exitosamente');
      loadShipments();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al generar reporte');
    }
  };

  const handleRegenerateReport = async (shipmentId) => {
    if (!window.confirm('¿Regenerar reporte para este envío?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/shipments/admin/${shipmentId}/regenerate-report`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Reporte regenerado exitosamente');
      loadShipments();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al regenerar reporte');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      active: 'info',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      active: 'Activo',
      closed: 'Cerrado',
    };
    return labels[status] || status;
  };

  const isReceptionDatePassed = (shipment) => {
    if (!shipment.max_reception_date) return false;
    const today = new Date();
    const maxDate = new Date(shipment.max_reception_date);
    return today > maxDate;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Envío de Resultados
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          Nuevo Envío
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card>
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
                    <TableCell>Programa</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Año/Mes</TableCell>
                    <TableCell>Fecha Envío</TableCell>
                    <TableCell>Fecha Límite</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Reporte</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No hay envíos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>{shipment.program_name}</TableCell>
                        <TableCell>{shipment.description}</TableCell>
                        <TableCell>{`${shipment.year}/${shipment.month}`}</TableCell>
                        <TableCell>
                          {shipment.start_date
                            ? new Date(shipment.start_date).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {shipment.max_reception_date
                            ? new Date(shipment.max_reception_date).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(shipment.status)}
                            size="small"
                            color={getStatusColor(shipment.status)}
                          />
                        </TableCell>
                        <TableCell>
                          {shipment.report_generated ? (
                            <Chip label="Generado" size="small" color="success" />
                          ) : (
                            <Chip label="Pendiente" size="small" color="default" />
                          )}
                        </TableCell>
                        <TableCell>
                          {isReceptionDatePassed(shipment) && !shipment.report_generated && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AssignmentIcon />}
                              onClick={() => handleGenerateReport(shipment.id)}
                              sx={{ mr: 1 }}
                            >
                              Generar
                            </Button>
                          )}
                          {shipment.report_generated && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleRegenerateReport(shipment.id)}
                              title="Regenerar Reporte"
                            >
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          )}
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

      {/* Create Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Envío</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Programa</InputLabel>
                <Select
                  value={formData.program_id}
                  onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                  label="Programa"
                >
                  {programs.map((program) => (
                    <MenuItem key={program.id} value={program.id}>
                      {program.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Muestra Control</InputLabel>
                <Select
                  value={formData.control_sample_id}
                  onChange={(e) => setFormData({ ...formData, control_sample_id: e.target.value })}
                  label="Muestra Control"
                >
                  {controlSamples
                    .filter(s => !formData.program_id || s.program_id === formData.program_id)
                    .map((sample) => (
                      <MenuItem key={sample.id} value={sample.id}>
                        {sample.name} - {sample.program_name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="Fecha de Envío"
                value={formData.shipment_date}
                onChange={(e) => setFormData({ ...formData, shipment_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="Fecha Máxima de Recepción"
                value={formData.max_reception_date}
                onChange={(e) => setFormData({ ...formData, max_reception_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Crear Envío
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShipmentsAdmin;
