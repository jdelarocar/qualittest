import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Chip, CircularProgress,
  Alert, IconButton, InputAdornment, Select, MenuItem, FormControl,
  InputLabel, List, ListItem, ListItemText, Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
} from '@mui/icons-material';
import axios from 'axios';

const ControlSamples = () => {
  const [samples, setSamples] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [analytes, setAnalytes] = useState([]);
  const [principles, setPrinciples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedSample, setSelectedSample] = useState(null);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [formData, setFormData] = useState({
    program_id: '',
    name: '',
    lot_number: '',
    expiration_date: '',
    description: '',
    active: true,
    values: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSamples();
    loadRelatedData();
  }, [search, programFilter]);

  const loadSamples = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/control-samples/admin`,
        {
          params: { search, program_id: programFilter },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSamples(response.data);
    } catch (error) {
      setError('Error al cargar muestras control');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [programsRes, analytesRes, principlesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/programs`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/analytes`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/principles/admin`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setPrograms(programsRes.data);
      setAnalytes(analytesRes.data);
      setPrinciples(principlesRes.data.filter(p => p.active));
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

  const handleOpenDialog = async (sample = null) => {
    if (sample) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/control-samples/admin/${sample.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFormData({
          program_id: response.data.program_id,
          name: response.data.name,
          lot_number: response.data.lot_number || '',
          expiration_date: response.data.expiration_date || '',
          description: response.data.description || '',
          active: response.data.active,
          values: response.data.values || []
        });
        setEditingId(sample.id);
      } catch (error) {
        setError('Error al cargar muestra control');
      }
    } else {
      setFormData({
        program_id: '',
        name: '',
        lot_number: '',
        expiration_date: '',
        description: '',
        active: true,
        values: []
      });
      setEditingId(null);
    }
    setDialog(true);
  };

  const handleAddValue = () => {
    setFormData({
      ...formData,
      values: [
        ...formData.values,
        {
          analyte_id: '',
          principle_id: '',
          data_type: 'numeric',
          reference_value: '',
          upper_limit: '',
          lower_limit: '',
          unit: ''
        }
      ]
    });
  };

  const handleRemoveValue = (index) => {
    const newValues = [...formData.values];
    newValues.splice(index, 1);
    setFormData({ ...formData, values: newValues });
  };

  const handleValueChange = (index, field, value) => {
    const newValues = [...formData.values];
    newValues[index][field] = value;
    setFormData({ ...formData, values: newValues });
  };

  const handleSave = async () => {
    if (!formData.program_id || !formData.name) {
      setError('Programa y nombre son requeridos');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingId
        ? `${process.env.REACT_APP_API_URL}/control-samples/admin/${editingId}`
        : `${process.env.REACT_APP_API_URL}/control-samples/admin`;

      const method = editingId ? 'put' : 'post';
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(editingId ? 'Muestra control actualizada' : 'Muestra control creada');
      setDialog(false);
      loadSamples();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleView = async (sample) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/control-samples/admin/${sample.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedSample(response.data);
      setViewDialog(true);
    } catch (error) {
      setError('Error al cargar muestra control');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta muestra control?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/control-samples/admin/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Muestra control eliminada');
      loadSamples();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Muestras Control
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nueva Muestra
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre o lote..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Programa</InputLabel>
                <Select
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  label="Filtrar por Programa"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {programs.map((program) => (
                    <MenuItem key={program.id} value={program.id}>
                      {program.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
                    <TableCell>Nombre</TableCell>
                    <TableCell>Programa</TableCell>
                    <TableCell>Lote</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {samples.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No hay muestras control registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    samples.map((sample) => (
                      <TableRow key={sample.id}>
                        <TableCell>{sample.name}</TableCell>
                        <TableCell>{sample.program_name}</TableCell>
                        <TableCell>{sample.lot_number || '-'}</TableCell>
                        <TableCell>
                          {sample.expiration_date
                            ? new Date(sample.expiration_date).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sample.active ? 'Activo' : 'Inactivo'}
                            size="small"
                            color={sample.active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleView(sample)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleOpenDialog(sample)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(sample.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Editar' : 'Nueva'} Muestra Control</DialogTitle>
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
              <TextField
                fullWidth
                required
                label="Nombre de la Muestra"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Número de Lote"
                value={formData.lot_number}
                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Vencimiento"
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Valores por Analito</Typography>
                <Button startIcon={<AddCircleIcon />} onClick={handleAddValue}>
                  Agregar Analito
                </Button>
              </Box>

              {formData.values.map((value, index) => (
                <Card key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" color="primary">
                          Analito #{index + 1}
                        </Typography>
                        <IconButton color="error" size="small" onClick={() => handleRemoveValue(index)}>
                          <RemoveCircleIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Analito</InputLabel>
                        <Select
                          value={value.analyte_id}
                          onChange={(e) => handleValueChange(index, 'analyte_id', e.target.value)}
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
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Principio Metodológico</InputLabel>
                        <Select
                          value={value.principle_id}
                          onChange={(e) => handleValueChange(index, 'principle_id', e.target.value)}
                          label="Principio Metodológico"
                        >
                          <MenuItem value="">Ninguno</MenuItem>
                          {principles.map((principle) => (
                            <MenuItem key={principle.id} value={principle.id}>
                              {principle.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Tipo de Dato</InputLabel>
                        <Select
                          value={value.data_type}
                          onChange={(e) => handleValueChange(index, 'data_type', e.target.value)}
                          label="Tipo de Dato"
                        >
                          <MenuItem value="numeric">Numérico</MenuItem>
                          <MenuItem value="alphanumeric">Alfanumérico</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Unidad de Medida"
                        value={value.unit}
                        onChange={(e) => handleValueChange(index, 'unit', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Valor de Referencia"
                        value={value.reference_value}
                        onChange={(e) => handleValueChange(index, 'reference_value', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Límite Inferior Mínimo"
                        value={value.lower_limit}
                        onChange={(e) => handleValueChange(index, 'lower_limit', e.target.value)}
                        disabled={value.data_type === 'alphanumeric'}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Límite Superior Máximo"
                        value={value.upper_limit}
                        onChange={(e) => handleValueChange(index, 'upper_limit', e.target.value)}
                        disabled={value.data_type === 'alphanumeric'}
                      />
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de Muestra Control</DialogTitle>
        <DialogContent>
          {selectedSample && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Programa</Typography>
                  <Typography variant="body1">{selectedSample.program_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Nombre</Typography>
                  <Typography variant="body1">{selectedSample.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Lote</Typography>
                  <Typography variant="body1">{selectedSample.lot_number || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Vencimiento</Typography>
                  <Typography variant="body1">
                    {selectedSample.expiration_date
                      ? new Date(selectedSample.expiration_date).toLocaleDateString()
                      : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Descripción</Typography>
                  <Typography variant="body1">{selectedSample.description || '-'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>Valores por Analito</Typography>
              <List>
                {selectedSample.values && selectedSample.values.length > 0 ? (
                  selectedSample.values.map((value, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={`${value.analyte_name}${value.principle_name ? ` - ${value.principle_name}` : ''}`}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Tipo: {value.data_type === 'numeric' ? 'Numérico' : 'Alfanumérico'}
                              {value.unit && ` | Unidad: ${value.unit}`}
                            </Typography>
                            <Typography variant="body2">
                              Referencia: {value.reference_value || 'N/A'}
                              {value.data_type === 'numeric' && value.lower_limit && value.upper_limit &&
                                ` | Límites: ${value.lower_limit} - ${value.upper_limit}`}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography color="text.secondary">No hay valores definidos</Typography>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ControlSamples;
