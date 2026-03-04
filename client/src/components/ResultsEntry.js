import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { shipmentAPI, analyteAPI, resultAPI } from '../services/api';
import { colors } from '../theme';

const ResultsEntry = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [analytes, setAnalytes] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, [shipmentId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load shipment details
      const shipmentRes = await shipmentAPI.getById(shipmentId);
      const shipmentData = shipmentRes.data;
      setShipment(shipmentData);

      // Load analytes for the program
      const analytesRes = await analyteAPI.getByProgram(shipmentData.program_id);
      setAnalytes(analytesRes.data);

      // Load existing results
      const resultsRes = await resultAPI.getByShipment(shipmentId);
      const existingResults = resultsRes.data.reduce((acc, result) => {
        acc[result.analyte_id] = result.result_value;
        return acc;
      }, {});
      setResults(existingResults);

    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  const handleResultChange = (analyteId, value) => {
    setResults((prev) => ({
      ...prev,
      [analyteId]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      // Prepare results data
      const resultsData = analytes.map((analyte) => ({
        analyte_id: analyte.id,
        result_value: results[analyte.id] || null,
      }));

      await resultAPI.submit(shipmentId, { results: resultsData });

      setMessage({
        type: 'success',
        text: 'Resultados guardados exitosamente',
      });

      // Refresh data
      setTimeout(() => {
        loadData();
      }, 1500);
    } catch (error) {
      console.error('Error saving results:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error al guardar resultados',
      });
    } finally {
      setSaving(false);
    }
  };

  const getDaysLeft = (endDate) => {
    const daysLeft = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { text: 'Vencido', color: 'error' };
    if (daysLeft === 0) return { text: 'Vence hoy', color: 'warning' };
    if (daysLeft <= 3) return { text: `${daysLeft} días restantes`, color: 'warning' };
    return { text: `${daysLeft} días restantes`, color: 'success' };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!shipment) {
    return (
      <Box>
        <Alert severity="error">Envío no encontrado</Alert>
      </Box>
    );
  }

  const deadline = getDaysLeft(shipment.end_date);

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 3 }}
      >
        Volver al Dashboard
      </Button>

      <Typography variant="h4" gutterBottom fontWeight="600">
        Envío de Resultados
      </Typography>

      {/* Shipment Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Programa
              </Typography>
              <Typography variant="h6" gutterBottom>
                {shipment.program_name}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Envío
              </Typography>
              <Typography variant="h6" gutterBottom>
                {shipment.name}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">
                Muestra
              </Typography>
              <Typography variant="body1">
                {shipment.sample_number}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">
                Fecha límite
              </Typography>
              <Typography variant="body1">
                {new Date(shipment.end_date).toLocaleDateString('es-GT')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Chip
                label={deadline.text}
                color={deadline.color}
                sx={{ fontWeight: 500 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      {/* Results Entry */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="600" sx={{ mb: 3 }}>
            Ingreso de Resultados
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Ingrese únicamente los valores numéricos. No es obligatorio completar todos los analitos,
            reporte únicamente los que trabaja en su laboratorio.
          </Alert>

          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.lightGray }}>
                <TableCell width="40%">
                  <Typography fontWeight={600}>Analito</Typography>
                </TableCell>
                <TableCell width="20%">
                  <Typography fontWeight={600}>Unidad</Typography>
                </TableCell>
                <TableCell width="40%">
                  <Typography fontWeight={600}>Resultado</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytes.map((analyte) => (
                <TableRow key={analyte.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {analyte.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {analyte.unit}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      value={results[analyte.id] || ''}
                      onChange={(e) => handleResultChange(analyte.id, e.target.value)}
                      placeholder="Ingrese el valor"
                      inputProps={{
                        step: '0.01',
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving || shipment.status !== 'open'}
            >
              {saving ? <CircularProgress size={24} /> : 'Guardar Resultados'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResultsEntry;
