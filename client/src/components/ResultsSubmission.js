import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, TextField, Grid,
  Alert, CircularProgress, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const ResultsSubmission = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shipment, setShipment] = useState(null);
  const [values, setValues] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    loadForm();
  }, [shipmentId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/laboratory-results/shipments/${shipmentId}/form`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShipment(response.data.shipment);
      setValues(response.data.values);
      setHasSubmitted(response.data.has_submitted);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al cargar formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (index, value) => {
    const newValues = [...values];
    newValues[index].result_value = value;
    setValues(newValues);
  };

  const validateResults = () => {
    for (const value of values) {
      if (!value.result_value || value.result_value.trim() === '') {
        setError('Por favor complete todos los valores');
        return false;
      }

      if (value.data_type === 'numeric') {
        const numValue = parseFloat(value.result_value);
        if (isNaN(numValue)) {
          setError(`El valor para ${value.analyte_name} debe ser numérico`);
          return false;
        }

        // Warning if outside limits
        if (value.lower_limit && numValue < parseFloat(value.lower_limit)) {
          if (!window.confirm(
            `El valor para ${value.analyte_name} está por debajo del límite inferior (${value.lower_limit}). ¿Desea continuar?`
          )) {
            return false;
          }
        }

        if (value.upper_limit && numValue > parseFloat(value.upper_limit)) {
          if (!window.confirm(
            `El valor para ${value.analyte_name} está por encima del límite superior (${value.upper_limit}). ¿Desea continuar?`
          )) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateResults()) {
      return;
    }

    setConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('token');

      const results = values.map(v => ({
        control_sample_value_id: v.id,
        result_value: v.result_value
      }));

      await axios.post(
        `${process.env.REACT_APP_API_URL}/laboratory-results/shipments/${shipmentId}/submit`,
        { results },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Resultados enviados exitosamente');
      setConfirmDialog(false);
      setHasSubmitted(true);

      // Reload to show submitted values
      setTimeout(() => {
        loadForm();
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al enviar resultados');
      setConfirmDialog(false);
    } finally {
      setSaving(false);
    }
  };

  const isDeadlinePassed = () => {
    if (!shipment?.max_reception_date) return false;
    return new Date() > new Date(shipment.max_reception_date);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!shipment) {
    return (
      <Box>
        <Alert severity="error">Envío no encontrado</Alert>
        <Button onClick={() => navigate('/results')} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="600">
          Ingreso de Resultados
        </Typography>
        <Box>
          {shipment.report_generated && (
            <Button
              variant="contained"
              onClick={() => navigate(`/statistics/${shipmentId}`)}
              sx={{ mr: 2 }}
            >
              Ver Estadísticas
            </Button>
          )}
          <Button variant="outlined" onClick={() => navigate('/results')}>
            Volver
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Programa</Typography>
              <Typography variant="body1" fontWeight="500">{shipment.program_name}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Muestra Control</Typography>
              <Typography variant="body1" fontWeight="500">{shipment.control_sample_name}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Lote</Typography>
              <Typography variant="body1">{shipment.lot_number || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Fecha Límite de Recepción</Typography>
              <Typography variant="body1">
                {new Date(shipment.max_reception_date).toLocaleDateString()}
                {isDeadlinePassed() && (
                  <Chip label="Vencido" size="small" color="error" sx={{ ml: 1 }} />
                )}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Descripción</Typography>
              <Typography variant="body1">{shipment.description}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Resultados por Analito</Typography>
            {hasSubmitted && (
              <Chip
                icon={<CheckIcon />}
                label="Resultados Enviados"
                color="success"
                size="small"
              />
            )}
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Analito</TableCell>
                  <TableCell>Principio</TableCell>
                  <TableCell>Tipo de Dato</TableCell>
                  <TableCell>Valor de Referencia</TableCell>
                  <TableCell>Límites</TableCell>
                  <TableCell>Unidad</TableCell>
                  <TableCell width="200">Resultado *</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {values.map((value, index) => (
                  <TableRow key={value.id}>
                    <TableCell>{value.analyte_name}</TableCell>
                    <TableCell>{value.principle_name || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={value.data_type === 'numeric' ? 'Numérico' : 'Alfanumérico'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{value.reference_value || '-'}</TableCell>
                    <TableCell>
                      {value.lower_limit && value.upper_limit
                        ? `${value.lower_limit} - ${value.upper_limit}`
                        : '-'}
                    </TableCell>
                    <TableCell>{value.unit || value.analyte_unit || '-'}</TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        type={value.data_type === 'numeric' ? 'number' : 'text'}
                        value={value.result_value}
                        onChange={(e) => handleValueChange(index, e.target.value)}
                        disabled={isDeadlinePassed() && !hasSubmitted}
                        placeholder="Ingrese resultado"
                        inputProps={{
                          step: value.data_type === 'numeric' ? '0.01' : undefined
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {isDeadlinePassed() && !hasSubmitted && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <WarningIcon sx={{ mr: 1 }} />
              La fecha límite de recepción ha pasado. Ya no puede enviar resultados.
            </Alert>
          )}

          {!isDeadlinePassed() && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? <CircularProgress size={24} /> : hasSubmitted ? 'Actualizar Resultados' : 'Enviar Resultados'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => !saving && setConfirmDialog(false)}>
        <DialogTitle>Confirmar Envío</DialogTitle>
        <DialogContent>
          <Typography>
            {hasSubmitted
              ? '¿Está seguro que desea actualizar los resultados enviados?'
              : '¿Está seguro que desea enviar estos resultados? Podrá modificarlos antes de la fecha límite.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={confirmSubmit} disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResultsSubmission;
