import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Alert, CircularProgress, Chip,
  Grid,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, Remove as TrendingFlat,
  CheckCircle, Warning, Error as ErrorIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { colors } from '../theme';

const MyStatistics = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatistics();
  }, [shipmentId]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/laboratory-results/shipments/${shipmentId}/statistics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatistics(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const getZScoreIcon = (interpretation) => {
    switch (interpretation) {
      case 'acceptable':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'unacceptable':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const getZScoreColor = (interpretation) => {
    switch (interpretation) {
      case 'acceptable':
        return 'success';
      case 'warning':
        return 'warning';
      case 'unacceptable':
        return 'error';
      default:
        return 'default';
    }
  };

  const getZScoreLabel = (interpretation) => {
    switch (interpretation) {
      case 'acceptable':
        return 'Aceptable';
      case 'warning':
        return 'Advertencia';
      case 'unacceptable':
        return 'No Aceptable';
      default:
        return interpretation;
    }
  };

  const getDeviationIcon = (deviation) => {
    if (deviation > 0) return <TrendingUp color="error" />;
    if (deviation < 0) return <TrendingDown color="primary" />;
    return <TrendingFlat />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (statistics.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          Las estadísticas aún no están disponibles. El administrador debe generar el reporte primero.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="600" sx={{ mb: 3 }}>
        Mis Estadísticas
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statistics.map((stat, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Typography variant="h6" fontWeight="600" color="primary">
                    {stat.analyte_name}
                  </Typography>
                  {getZScoreIcon(stat.z_interpretation)}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Mi Resultado</Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stat.lab_value} {stat.analyte_unit}
                  </Typography>
                </Box>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Media del Grupo</Typography>
                    <Typography variant="body2" fontWeight="500">
                      {parseFloat(stat.mean_value).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Desv. Estándar</Typography>
                    <Typography variant="body2" fontWeight="500">
                      {parseFloat(stat.standard_deviation).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Z-Score</Typography>
                    <Typography variant="body2" fontWeight="500">
                      {parseFloat(stat.z_score).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Percentil</Typography>
                    <Typography variant="body2" fontWeight="500">
                      {parseFloat(stat.percentile).toFixed(1)}%
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={getZScoreLabel(stat.z_interpretation)}
                    color={getZScoreColor(stat.z_interpretation)}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Detailed Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="600">
            Detalle Estadístico
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Analito</TableCell>
                  <TableCell>Mi Valor</TableCell>
                  <TableCell>Media</TableCell>
                  <TableCell>Desv. Std</TableCell>
                  <TableCell>CV%</TableCell>
                  <TableCell>Z-Score</TableCell>
                  <TableCell>IDS</TableCell>
                  <TableCell>DRP%</TableCell>
                  <TableCell>Desviación</TableCell>
                  <TableCell>Evaluación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statistics.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell>{stat.analyte_name}</TableCell>
                    <TableCell>
                      <strong>{stat.lab_value}</strong> {stat.analyte_unit}
                    </TableCell>
                    <TableCell>{parseFloat(stat.mean_value).toFixed(2)}</TableCell>
                    <TableCell>{parseFloat(stat.standard_deviation).toFixed(2)}</TableCell>
                    <TableCell>{parseFloat(stat.coefficient_variation).toFixed(2)}%</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {parseFloat(stat.z_score).toFixed(2)}
                      </Box>
                    </TableCell>
                    <TableCell>{parseFloat(stat.ids_score).toFixed(2)}</TableCell>
                    <TableCell>{parseFloat(stat.drp_score).toFixed(2)}%</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getDeviationIcon(stat.deviation_from_mean)}
                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                          {parseFloat(stat.deviation_from_mean).toFixed(2)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getZScoreLabel(stat.z_interpretation)}
                        color={getZScoreColor(stat.z_interpretation)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, p: 2, bgcolor: colors.lightGray, borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="600">
              Interpretación de Z-Score:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    |Z| ≤ 2: <strong>Aceptable</strong>
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Warning color="warning" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    2 &lt; |Z| &lt; 3: <strong>Advertencia</strong>
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    |Z| ≥ 3: <strong>No Aceptable</strong>
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="600">
                Indicadores:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>IDS (Índice de Desviación Estándar):</strong> Valores cercanos a 0 indican mejor desempeño
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>DRP (Desvío Relativo Porcentual):</strong> Porcentaje de desviación respecto a la media del grupo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>CV (Coeficiente de Variación):</strong> Medida de dispersión relativa del grupo
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MyStatistics;
