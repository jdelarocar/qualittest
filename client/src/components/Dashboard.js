import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Science as ScienceIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { programAPI, shipmentAPI } from '../services/api';
import { colors } from '../theme';

const Dashboard = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [openShipments, setOpenShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [programsRes, shipmentsRes] = await Promise.all([
        programAPI.getAll(),
        shipmentAPI.getAll({ status: 'open' }),
      ]);

      setPrograms(programsRes.data);
      setOpenShipments(shipmentsRes.data);
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (endDate) => {
    const daysLeft = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'error';
    if (daysLeft <= 3) return 'warning';
    return 'success';
  };

  const getDaysLeft = (endDate) => {
    const daysLeft = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'Vencido';
    if (daysLeft === 0) return 'Vence hoy';
    if (daysLeft === 1) return '1 día restante';
    return `${daysLeft} días restantes`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="600">
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Bienvenido a QUALITTEST - Sistema de Evaluación Externa de la Calidad
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${colors.navyBlue} 0%, ${colors.cyan} 100%)`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScienceIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {programs.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Programas Activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${colors.green} 0%, ${colors.lightGreen} 100%)`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {openShipments.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Envíos Abiertos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Open Shipments */}
      <Typography variant="h5" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
        Envíos Abiertos
      </Typography>

      {openShipments.length === 0 ? (
        <Alert severity="info">
          No hay envíos abiertos en este momento.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {openShipments.map((shipment) => (
            <Grid item xs={12} md={6} lg={4} key={shipment.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip
                      label={shipment.program_name}
                      size="small"
                      sx={{
                        bgcolor: colors.lightCyan,
                        color: colors.navyBlue,
                        fontWeight: 500,
                      }}
                    />
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={getDaysLeft(shipment.end_date)}
                      size="small"
                      color={getStatusColor(shipment.end_date)}
                    />
                  </Box>

                  <Typography variant="h6" gutterBottom fontWeight="600">
                    {shipment.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Muestra: {shipment.sample_number}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Fecha límite:{' '}
                    {new Date(shipment.end_date).toLocaleDateString('es-GT')}
                  </Typography>

                  {shipment.has_results ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', color: colors.green, mb: 2 }}>
                      <CheckCircleIcon sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        Resultados enviados
                      </Typography>
                    </Box>
                  ) : (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Pendiente de envío
                    </Alert>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate(`/results/${shipment.id}`)}
                  >
                    {shipment.has_results ? 'Ver Resultados' : 'Enviar Resultados'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Programs Section */}
      <Typography variant="h5" gutterBottom fontWeight="600" sx={{ mt: 6, mb: 2 }}>
        Programas Disponibles
      </Typography>

      <Grid container spacing={3}>
        {programs.map((program) => (
          <Grid item xs={12} sm={6} md={4} key={program.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="600" color="primary">
                  {program.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {program.description}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/statistics', { state: { programId: program.id } })}
                >
                  Ver Estadísticas
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
