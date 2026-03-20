import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Chip, CircularProgress,
  Alert, IconButton, InputAdornment, Select, MenuItem, FormControl,
  InputLabel, Tabs, Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  LockReset as ResetIcon,
} from '@mui/icons-material';
import axios from 'axios';
import PermissionGuard from '../common/PermissionGuard';
import { usePermissions } from '../../context/PermissionsContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'laboratory',
    laboratory_id: '',
    active: true,
  });
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
    loadLaboratories();
  }, [roleFilter, search]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/users/admin`,
        {
          params: { role: roleFilter, search },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUsers(response.data);
    } catch (error) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadLaboratories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/laboratories`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLaboratories(response.data);
    } catch (error) {
      console.error('Error loading laboratories:', error);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setFormData({
        username: user.username,
        password: '',
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        laboratory_id: user.laboratory_id || '',
        active: user.active,
      });
      setEditingId(user.id);
    } else {
      setFormData({
        username: '',
        password: '',
        full_name: '',
        email: '',
        role: 'laboratory',
        laboratory_id: '',
        active: true,
      });
      setEditingId(null);
    }
    setDialog(true);
  };

  const handleSave = async () => {
    if (!formData.username || !formData.full_name || !formData.email || !formData.role) {
      setError('Complete todos los campos obligatorios');
      return;
    }

    if (!editingId && !formData.password) {
      setError('La contraseña es requerida para nuevos usuarios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingId
        ? `${process.env.REACT_APP_API_URL}/users/admin/${editingId}`
        : `${process.env.REACT_APP_API_URL}/users/admin`;

      const method = editingId ? 'put' : 'post';
      const dataToSend = editingId ?
        { ...formData, password: undefined } : // Don't send password on update
        formData;

      await axios[method](url, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(editingId ? 'Usuario actualizado' : 'Usuario creado');
      setDialog(false);
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleOpenPasswordDialog = (userId) => {
    setEditingId(userId);
    setNewPassword('');
    setPasswordDialog(true);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/users/admin/${editingId}/reset-password`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Contraseña actualizada');
      setPasswordDialog(false);
      setNewPassword('');
    } catch (error) {
      setError(error.response?.data?.message || 'Error al resetear contraseña');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/users/admin/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Usuario eliminado');
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      laboratory: 'Laboratorio',
      coordinator: 'Coordinador',
    };
    return labels[role] || role;
  };

  const { canCreate, canEdit, canDelete } = usePermissions();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Usuarios
        </Typography>
        <PermissionGuard module="users" action="create">
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Nuevo Usuario
          </Button>
        </PermissionGuard>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <Tabs value={roleFilter} onChange={(e, val) => setRoleFilter(val)}>
          <Tab label="Todos" value="" />
          <Tab label="Administradores" value="admin" />
          <Tab label="Laboratorios" value="laboratory" />
          <Tab label="Coordinadores" value="coordinator" />
        </Tabs>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Buscar por usuario, nombre o email..."
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
                    <TableCell>Usuario</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Laboratorio</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No hay usuarios registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip label={getRoleLabel(user.role)} size="small" />
                        </TableCell>
                        <TableCell>{user.laboratory_name || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.active ? 'Activo' : 'Inactivo'}
                            size="small"
                            color={user.active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <PermissionGuard module="users" action="edit" showTooltip>
                            <IconButton size="small" onClick={() => handleOpenDialog(user)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </PermissionGuard>
                          <PermissionGuard module="users" action="edit" showTooltip>
                            <IconButton size="small" color="primary" onClick={() => handleOpenPasswordDialog(user.id)}>
                              <ResetIcon fontSize="small" />
                            </IconButton>
                          </PermissionGuard>
                          <PermissionGuard module="users" action="delete" showTooltip>
                            <IconButton size="small" color="error" onClick={() => handleDelete(user.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </PermissionGuard>
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
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar' : 'Nuevo'} Usuario</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Usuario"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Rol"
                >
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="laboratory">Laboratorio</MenuItem>
                  <MenuItem value="coordinator">Coordinador</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Nombre Completo"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            {!editingId && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Contraseña"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  helperText="Mínimo 6 caracteres"
                />
              </Grid>
            )}
            {formData.role === 'laboratory' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Laboratorio</InputLabel>
                  <Select
                    value={formData.laboratory_id}
                    onChange={(e) => setFormData({ ...formData, laboratory_id: e.target.value })}
                    label="Laboratorio"
                  >
                    <MenuItem value="">Ninguno</MenuItem>
                    {laboratories.map((lab) => (
                      <MenuItem key={lab.id} value={lab.id}>
                        {lab.code} - {lab.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Resetear Contraseña</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            required
            label="Nueva Contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Mínimo 6 caracteres"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleResetPassword}>
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
