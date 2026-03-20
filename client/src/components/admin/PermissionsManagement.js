import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';

const PermissionsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('laboratory');
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadPermissions(selectedRole);
    }
  }, [selectedRole]);

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/permissions/available-roles`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoles(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al cargar roles');
    }
  };

  const loadPermissions = async (role) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/permissions/roles/${role}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPermissions(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al cargar permisos');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permissionId, field, value) => {
    setPermissions(prevPermissions =>
      prevPermissions.map(p =>
        p.id === permissionId ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');

      const permissionsData = permissions.map(p => ({
        permission_id: p.id,
        can_view: p.can_view || false,
        can_create: p.can_create || false,
        can_edit: p.can_edit || false,
        can_delete: p.can_delete || false,
      }));

      await axios.put(
        `${process.env.REACT_APP_API_URL}/permissions/roles/${selectedRole}`,
        { permissions: permissionsData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Permisos guardados exitosamente');

      // Recargar permisos
      setTimeout(() => {
        loadPermissions(selectedRole);
      }, 1000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    loadPermissions(selectedRole);
  };

  // Agrupar permisos por módulo
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const getModuleName = (module) => {
    const moduleNames = {
      users: 'Usuarios',
      roles: 'Roles y Permisos',
      laboratories: 'Laboratorios',
      requests: 'Solicitudes',
      participation_options: 'Opciones de Participación',
      providers: 'Proveedores',
      instruments: 'Instrumentos',
      brands: 'Marcas',
      principles: 'Principios',
      calibrations: 'Calibraciones',
      reagents: 'Reactivos',
      standards: 'Estándares',
      temperatures: 'Temperaturas',
      wavelengths: 'Longitudes de Onda',
      programs: 'Programas',
      analytes: 'Analitos',
      control_samples: 'Muestras Control',
      shipments: 'Envíos',
      results_submission: 'Envío de Resultados',
      statistics: 'Estadísticas',
      statistics_admin: 'Estadísticas (Admin)',
      user_profile: 'Perfil de Usuario',
      lab_parameters: 'Parámetros de Laboratorio',
      invoices_config: 'Configuración de Facturas',
      invoices: 'Facturación',
      documents: 'Documentos',
    };
    return moduleNames[module] || module;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="600">
          Gestión de Permisos
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 2 }}
          >
            Recargar
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || selectedRole === 'admin'}
          >
            {saving ? <CircularProgress size={24} /> : 'Guardar Cambios'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {selectedRole === 'admin' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Los permisos del rol Administrador no pueden ser modificados. Siempre tiene acceso total.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs
            value={selectedRole}
            onChange={(e, newValue) => setSelectedRole(newValue)}
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            {roles.map(role => (
              <Tab
                key={role.value}
                value={role.value}
                label={
                  <Box>
                    <Typography variant="body1">{role.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {role.description}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Tabs>

          {Object.keys(groupedPermissions).map(module => (
            <Paper key={module} sx={{ mb: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                <Chip label={getModuleName(module)} color="primary" size="small" sx={{ mr: 1 }} />
                {getModuleName(module)}
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Permiso</TableCell>
                      <TableCell align="center" width="100">Ver</TableCell>
                      <TableCell align="center" width="100">Crear</TableCell>
                      <TableCell align="center" width="100">Editar</TableCell>
                      <TableCell align="center" width="100">Eliminar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groupedPermissions[module].map(permission => (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {permission.description || permission.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={Boolean(permission.can_view)}
                            onChange={(e) => handlePermissionChange(permission.id, 'can_view', e.target.checked)}
                            disabled={selectedRole === 'admin'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={Boolean(permission.can_create)}
                            onChange={(e) => handlePermissionChange(permission.id, 'can_create', e.target.checked)}
                            disabled={selectedRole === 'admin'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={Boolean(permission.can_edit)}
                            onChange={(e) => handlePermissionChange(permission.id, 'can_edit', e.target.checked)}
                            disabled={selectedRole === 'admin'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={Boolean(permission.can_delete)}
                            onChange={(e) => handlePermissionChange(permission.id, 'can_delete', e.target.checked)}
                            disabled={selectedRole === 'admin'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PermissionsManagement;
