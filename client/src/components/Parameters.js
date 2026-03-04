import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { programAPI, analyteAPI, parameterAPI } from '../services/api';

const Parameters = () => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [analytes, setAnalytes] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [methods, setMethods] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      loadAnalytes();
    }
  }, [selectedProgram, year]);

  const loadPrograms = async () => {
    try {
      const response = await programAPI.getAll();
      setPrograms(response.data);
      // Auto-select Biochemistry program
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
      setLoading(true);
      const [analytesRes, paramsRes] = await Promise.all([
        analyteAPI.getByProgram(selectedProgram),
        parameterAPI.get(selectedProgram, year),
      ]);

      setAnalytes(analytesRes.data);

      // Load methods for each analyte
      const methodsData = {};
      for (const analyte of analytesRes.data) {
        try {
          const methodsRes = await analyteAPI.getMethods(analyte.id);
          methodsData[analyte.id] = methodsRes.data;
        } catch (err) {
          methodsData[analyte.id] = [];
        }
      }
      setMethods(methodsData);

      // Initialize parameters
      const existingParams = paramsRes.data.reduce((acc, param) => {
        acc[param.analyte_id] = param;
        return acc;
      }, {});

      const initialParams = analytesRes.data.map((analyte) => ({
        analyte_id: analyte.id,
        method_id: existingParams[analyte.id]?.method_id || '',
        brand: existingParams[analyte.id]?.brand || '',
        instrument: existingParams[analyte.id]?.instrument || '',
        standard: existingParams[analyte.id]?.standard || '',
        calibration: existingParams[analyte.id]?.calibration || '',
        temperature: existingParams[analyte.id]?.temperature || '',
        wavelength: existingParams[analyte.id]?.wavelength || '',
      }));

      setParameters(initialParams);
    } catch (error) {
      console.error('Error loading analytes:', error);
      setMessage({ type: 'error', text: 'Error al cargar analitos' });
    } finally {
      setLoading(false);
    }
  };

  const handleParameterChange = (analyteId, field, value) => {
    setParameters((prev) =>
      prev.map((param) =>
        param.analyte_id === analyteId
          ? { ...param, [field]: value }
          : param
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      // Filter out empty parameters
      const validParams = parameters.filter(
        (p) => p.method_id || p.brand || p.instrument
      );

      await parameterAPI.save({
        parameters: validParams,
        year,
      });

      setMessage({
        type: 'success',
        text: 'Parámetros guardados exitosamente',
      });
    } catch (error) {
      console.error('Error saving parameters:', error);
      setMessage({
        type: 'error',
        text: 'Error al guardar parámetros',
      });
    } finally {
      setSaving(false);
    }
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
        Configuración de Parámetros
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure los métodos y parámetros de medición para cada analito
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Año"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {analytes.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                      Analito
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                      Método/Principio
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                      Marca
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                      Instrumento
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                      Estándar
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                      Temp. (°C)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytes.map((analyte, index) => {
                    const param = parameters.find((p) => p.analyte_id === analyte.id);
                    return (
                      <tr key={analyte.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px' }}>
                          <Typography variant="body2" fontWeight={500}>
                            {analyte.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {analyte.unit}
                          </Typography>
                        </td>
                        <td style={{ padding: '12px', minWidth: '200px' }}>
                          <FormControl fullWidth size="small">
                            <Select
                              value={param?.method_id || ''}
                              onChange={(e) =>
                                handleParameterChange(analyte.id, 'method_id', e.target.value)
                              }
                            >
                              <MenuItem value="">
                                <em>Seleccionar</em>
                              </MenuItem>
                              {(methods[analyte.id] || []).map((method) => (
                                <MenuItem key={method.id} value={method.id}>
                                  {method.name}
                                  {method.principle && ` - ${method.principle}`}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </td>
                        <td style={{ padding: '12px', minWidth: '150px' }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={param?.brand || ''}
                            onChange={(e) =>
                              handleParameterChange(analyte.id, 'brand', e.target.value)
                            }
                          />
                        </td>
                        <td style={{ padding: '12px', minWidth: '150px' }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={param?.instrument || ''}
                            onChange={(e) =>
                              handleParameterChange(analyte.id, 'instrument', e.target.value)
                            }
                          />
                        </td>
                        <td style={{ padding: '12px', minWidth: '150px' }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={param?.standard || ''}
                            onChange={(e) =>
                              handleParameterChange(analyte.id, 'standard', e.target.value)
                            }
                          />
                        </td>
                        <td style={{ padding: '12px', minWidth: '100px' }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={param?.temperature || ''}
                            onChange={(e) =>
                              handleParameterChange(analyte.id, 'temperature', e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <CircularProgress size={24} /> : 'Guardar Parámetros'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Parameters;
