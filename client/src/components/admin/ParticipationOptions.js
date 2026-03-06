import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Select, MenuItem,
  FormControl, InputLabel, Chip, CircularProgress, Alert, Checkbox,
  FormControlLabel, FormGroup,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const ParticipationOptions = () => {
  const [options, setOptions] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    type: 'open',
    description: '',
    program_ids: [],
    active: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [optionsRes, programsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/participation-options/admin`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/programs`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);
      setOptions(optionsRes.data);
      setPrograms(programsRes.data);
    } catch (error) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async (option = null) => {
    if (option) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/participation-options/admin/${option.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFormData({
          name: response.data.name,
          price: response.data.price,
          type: response.data.type,
          description: response.data.description || '',
          program_ids: response.data.program_ids || [],
          active: response.data.active,
        });
        setEditingId(option.id);
      } catch (error) {
        setError('Error al cargar opción');
        return;
      }
    } else {
      setFormData({
        name: '',
        price: '',
        type: 'open',
        description: '',
        program_ids: [],
        active: true,
      });
      setEditingId(null);
    }
    setDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || formData.program_ids.length === 0) {
      setError('Complete todos los campos obligatorios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingId
        ? `${process.env.REACT_APP_API_URL}/participation-options/admin/${editingId}`
        : `${process.env.REACT_APP_API_URL}/participation-options/admin`;

      const method = editingId ? 'put' : 'post';
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(editingId ? 'Opción actualizada' : 'Opción creada');
      setDialog(false);
      loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta opción?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/participation-options/admin/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Opción eliminada');
      loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleProgramToggle = (programId) => {
    const newIds = formData.program_ids.includes(programId)
      ? formData.program_ids.filter(id => id !== programId)
      : [...formData.program_ids, programId];
    setFormData({ ...formData, program_ids: newIds });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Opciones de Participación
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nueva Opción
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
                    <TableCell>Nombre</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Programas</TableCell>
                    <TableCell>Laboratorios</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {options.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell>{option.name}</TableCell>
                      <TableCell>Q{parseFloat(option.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={option.type === 'open' ? 'Abierto' : 'Cerrado'}
                          size="small"
                          color={option.type === 'open' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{option.programs || 'N/A'}</TableCell>
                      <TableCell>{option.laboratories_count || 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={option.active ? 'Activo' : 'Inactivo'}
                          size="small"
                          color={option.active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenDialog(option)}>
                          Editar
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          color="error"
                          onClick={() => handleDelete(option.id)}
                          disabled={option.laboratories_count > 0}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar' : 'Nueva'} Opción de Participación</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Precio (Q)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Tipo"
                >
                  <MenuItem value="open">Abierto</MenuItem>
                  <MenuItem value="closed">Cerrado</MenuItem>
                </Select>
              </FormControl>
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
              <Typography variant="subtitle2" gutterBottom>
                Programas Incluidos *
              </Typography>
              <FormGroup>
                {programs.map((program) => (
                  <FormControlLabel
                    key={program.id}
                    control={
                      <Checkbox
                        checked={formData.program_ids.includes(program.id)}
                        onChange={() => handleProgramToggle(program.id)}
                      />
                    }
                    label={program.name}
                  />
                ))}
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                }
                label="Activo"
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

export default ParticipationOptions;
