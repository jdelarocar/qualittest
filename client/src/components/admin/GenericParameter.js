import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Chip, CircularProgress,
  Alert, IconButton, InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import axios from 'axios';

const GenericParameter = ({
  title,
  apiEndpoint,
  fieldName = 'name',
  fieldLabel = 'Nombre'
}) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    [fieldName]: '',
    description: '',
    active: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRecords();
  }, [search]);

  const loadRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/${apiEndpoint}/admin`,
        {
          params: { search },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setRecords(response.data);
    } catch (error) {
      setError(`Error al cargar ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (record = null) => {
    if (record) {
      setFormData({
        [fieldName]: record[fieldName],
        description: record.description || '',
        active: record.active,
      });
      setEditingId(record.id);
    } else {
      setFormData({
        [fieldName]: '',
        description: '',
        active: true,
      });
      setEditingId(null);
    }
    setDialog(true);
  };

  const handleSave = async () => {
    if (!formData[fieldName]) {
      setError(`${fieldLabel} es requerido`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingId
        ? `${process.env.REACT_APP_API_URL}/${apiEndpoint}/admin/${editingId}`
        : `${process.env.REACT_APP_API_URL}/${apiEndpoint}/admin`;

      const method = editingId ? 'put' : 'post';
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(editingId ? 'Actualizado exitosamente' : 'Creado exitosamente');
      setDialog(false);
      loadRecords();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/${apiEndpoint}/admin/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Eliminado exitosamente');
      loadRecords();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          {title}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nuevo
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Buscar..."
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
                    <TableCell>{fieldLabel}</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No hay registros
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record[fieldName]}</TableCell>
                        <TableCell>{record.description || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={record.active ? 'Activo' : 'Inactivo'}
                            size="small"
                            color={record.active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleOpenDialog(record)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(record.id)}>
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
        <DialogTitle>{editingId ? 'Editar' : 'Nuevo'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={fieldLabel}
                value={formData[fieldName]}
                onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
              />
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

export default GenericParameter;
