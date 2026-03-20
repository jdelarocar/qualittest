import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Chip, CircularProgress,
  Alert, IconButton, InputAdornment, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Reagents = () => {
  const [reagents, setReagents] = useState([]);
  const [brands, setBrands] = useState([]);
  const [providers, setProviders] = useState([]);
  const [analytes, setAnalytes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    brand_id: '',
    provider_id: '',
    analyte_id: '',
    description: '',
    active: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadReagents();
    loadRelatedData();
  }, [search]);

  const loadReagents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/reagents/admin`,
        {
          params: { search },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setReagents(response.data);
    } catch (error) {
      setError('Error al cargar reactivos');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [brandsRes, providersRes, analytesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/brands/admin`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/providers/admin`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/analytes`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setBrands(brandsRes.data);
      setProviders(providersRes.data);
      setAnalytes(analytesRes.data);
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

  const handleOpenDialog = (reagent = null) => {
    if (reagent) {
      setFormData({
        name: reagent.name,
        brand_id: reagent.brand_id || '',
        provider_id: reagent.provider_id || '',
        analyte_id: reagent.analyte_id || '',
        description: reagent.description || '',
        active: reagent.active,
      });
      setEditingId(reagent.id);
    } else {
      setFormData({
        name: '',
        brand_id: '',
        provider_id: '',
        analyte_id: '',
        description: '',
        active: true,
      });
      setEditingId(null);
    }
    setDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      setError('Nombre es requerido');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingId
        ? `${process.env.REACT_APP_API_URL}/reagents/admin/${editingId}`
        : `${process.env.REACT_APP_API_URL}/reagents/admin`;

      const method = editingId ? 'put' : 'post';
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(editingId ? 'Reactivo actualizado' : 'Reactivo creado');
      setDialog(false);
      loadReagents();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este reactivo?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/reagents/admin/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Reactivo eliminado');
      loadReagents();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Reactivos
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nuevo Reactivo
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, marca, proveedor o analito..."
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
                    <TableCell>Marca</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell>Analito</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reagents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No hay reactivos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    reagents.map((reagent) => (
                      <TableRow key={reagent.id}>
                        <TableCell>{reagent.name}</TableCell>
                        <TableCell>{reagent.brand_name || '-'}</TableCell>
                        <TableCell>{reagent.provider_name || '-'}</TableCell>
                        <TableCell>{reagent.analyte_name || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={reagent.active ? 'Activo' : 'Inactivo'}
                            size="small"
                            color={reagent.active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleOpenDialog(reagent)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(reagent.id)}>
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

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar' : 'Nuevo'} Reactivo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Nombre del Reactivo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Marca</InputLabel>
                <Select
                  value={formData.brand_id}
                  onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                  label="Marca"
                >
                  <MenuItem value="">Ninguna</MenuItem>
                  {brands.filter(b => b.active).map((brand) => (
                    <MenuItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Proveedor</InputLabel>
                <Select
                  value={formData.provider_id}
                  onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                  label="Proveedor"
                >
                  <MenuItem value="">Ninguno</MenuItem>
                  {providers.filter(p => p.active).map((provider) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Analito</InputLabel>
                <Select
                  value={formData.analyte_id}
                  onChange={(e) => setFormData({ ...formData, analyte_id: e.target.value })}
                  label="Analito"
                >
                  <MenuItem value="">Ninguno</MenuItem>
                  {analytes.map((analyte) => (
                    <MenuItem key={analyte.id} value={analyte.id}>
                      {analyte.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
    </Box>
  );
};

export default Reagents;
