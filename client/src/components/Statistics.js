import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { programAPI, analyteAPI, shipmentAPI, statisticsAPI } from '../services/api';
import { colors } from '../theme';

const Statistics = () => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [analytes, setAnalytes] = useState([]);
  const [selectedAnalyte, setSelectedAnalyte] = useState('');
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [idsHistory, setIdsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      loadAnalytes();
      loadShipments();
    }
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedShipment && selectedAnalyte) {
      loadStatistics();
    }
  }, [selectedShipment, selectedAnalyte]);

  useEffect(() => {
    if (selectedAnalyte) {
      loadIDSHistory();
    }
  }, [selectedAnalyte]);

  const loadPrograms = async () => {
    try {
      const response = await programAPI.getAll();
      setPrograms(response.data);
      const biochem = response.data.find(p => p.code === 'BIOCHEM');
      if (biochem) {
        setSelectedProgram(biochem.id);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadAnalytes = async () => {
    try {
      const response = await analyteAPI.getByProgram(selectedProgram);
      setAnalytes(response.data);
      if (response.data.length > 0) {
        setSelectedAnalyte(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading analytes:', error);
    }
  };

  const loadShipments = async () => {
    try {
      const response = await shipmentAPI.getAll({
        programId: selectedProgram,
        status: 'closed',
      });
      setShipments(response.data);
      if (response.data.length > 0) {
        setSelectedShipment(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading shipments:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await statisticsAPI.getByShipmentAndAnalyte(
        selectedShipment,
        selectedAnalyte
      );
      setStatistics(response.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIDSHistory = async () => {
    try {
      const response = await statisticsAPI.getIDSHistory({
        analyteId: selectedAnalyte,
        year: new Date().getFullYear(),
      });
      setIdsHistory(response.data);
    } catch (error) {
      console.error('Error loading IDS history:', error);
    }
  };

  const getPerformanceLabel = (ids) => {
    if (!ids) return { text: 'N/A', color: 'default' };
    const absIds = Math.abs(ids);
    if (absIds <= 2) return { text: 'Satisfactorio', color: 'success' };
    if (absIds <= 3) return { text: 'Cuestionable', color: 'warning' };
    return { text: 'Insatisfactorio', color: 'error' };
  };

  // Prepare data for distribution chart
  const getDistributionData = () => {
    if (!statistics?.all_results) return [];

    const values = statistics.all_results.map(r => parseFloat(r.result_value));
    const sorted = [...values].sort((a, b) => a - b);

    // Create bins
    const min = Math.min(...sorted);
    const max = Math.max(...sorted);
    const binCount = 10;
    const binSize = (max - min) / binCount;

    const bins = Array(binCount).fill(0);
    sorted.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
      bins[binIndex]++;
    });

    return bins.map((count, index) => ({
      range: `${(min + index * binSize).toFixed(1)}-${(min + (index + 1) * binSize).toFixed(1)}`,
      count,
      isLab: statistics.laboratory_result &&
        parseFloat(statistics.laboratory_result.result_value) >= (min + index * binSize) &&
        parseFloat(statistics.laboratory_result.result_value) < (min + (index + 1) * binSize),
    }));
  };

  // Prepare IDS history data
  const idsHistoryData = idsHistory.map((item) => ({
    month: `${item.month}/${item.year}`,
    IDS_Todos: item.ids_all,
    IDS_Principio: item.ids_method,
  }));

  if (programs.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="600">
        Estadísticas y Gráficas
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Visualice su desempeño y compare con otros laboratorios
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Programa</InputLabel>
                <Select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
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

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Analito</InputLabel>
                <Select
                  value={selectedAnalyte}
                  onChange={(e) => setSelectedAnalyte(e.target.value)}
                  label="Analito"
                >
                  {analytes.map((analyte) => (
                    <MenuItem key={analyte.id} value={analyte.id}>
                      {analyte.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Envío</InputLabel>
                <Select
                  value={selectedShipment}
                  onChange={(e) => setSelectedShipment(e.target.value)}
                  label="Envío"
                >
                  {shipments.map((shipment) => (
                    <MenuItem key={shipment.id} value={shipment.id}>
                      {shipment.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : statistics ? (
        <>
          {/* Results Summary */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Su Resultado
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {statistics.laboratory_result?.result_value || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Media del Grupo
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {statistics.statistics_all?.mean_value?.toFixed(2) || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    IDS (Todos)
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {statistics.performance?.ids_all?.toFixed(2) || 'N/A'}
                  </Typography>
                  <Chip
                    size="small"
                    label={getPerformanceLabel(statistics.performance?.ids_all).text}
                    color={getPerformanceLabel(statistics.performance?.ids_all).color}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Valor Z
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {statistics.performance?.z_score?.toFixed(2) || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Statistics Table */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Estadísticas Descriptivas
              </Typography>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    N (Participantes)
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {statistics.statistics_all?.n_total || 0}
                  </Typography>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Desviación Estándar
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {statistics.statistics_all?.std_dev?.toFixed(2) || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    CV %
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {statistics.statistics_all?.cv_percent?.toFixed(2) || 'N/A'}%
                  </Typography>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Valor de Referencia
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {statistics.statistics_all?.reference_value?.toFixed(2) || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Charts */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Historia IDS" />
              <Tab label="Distribución de Resultados" />
            </Tabs>

            <Box sx={{ mt: 3 }}>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Historia de Valores IDS
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Evolución del Índice de Desviación Estándar a lo largo del tiempo
                  </Typography>

                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={idsHistoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
                      <ReferenceLine y={2} stroke={colors.green} strokeDasharray="3 3" label="Satisfactorio" />
                      <ReferenceLine y={-2} stroke={colors.green} strokeDasharray="3 3" />
                      <ReferenceLine y={3} stroke={colors.warning} strokeDasharray="3 3" label="Límite" />
                      <ReferenceLine y={-3} stroke={colors.warning} strokeDasharray="3 3" />
                      <Line
                        type="monotone"
                        dataKey="IDS_Todos"
                        stroke={colors.navyBlue}
                        strokeWidth={2}
                        name="IDS Todos los laboratorios"
                      />
                      <Line
                        type="monotone"
                        dataKey="IDS_Principio"
                        stroke={colors.cyan}
                        strokeWidth={2}
                        name="IDS Por principio"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <strong>Interpretación:</strong> El IDS entre -2 y +2 es satisfactorio.
                    Entre -3 y -2 o entre +2 y +3 es cuestionable. Fuera de -3 y +3 es insatisfactorio.
                  </Alert>
                </Box>
              )}

              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Distribución de Resultados - Todos los Participantes
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Comparación de su resultado con la distribución del grupo
                  </Typography>

                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={getDistributionData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill={colors.lightCyan}
                        name="Otros laboratorios"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>
          </Paper>
        </>
      ) : (
        <Alert severity="info">
          Seleccione un programa, analito y envío para ver las estadísticas
        </Alert>
      )}
    </Box>
  );
};

export default Statistics;
