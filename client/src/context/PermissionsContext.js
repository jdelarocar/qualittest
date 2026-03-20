import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const PermissionsContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadPermissions();
    } else {
      setPermissions({});
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/permissions/my-permissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPermissions(response.data.permissions || {});
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (module, action = 'view') => {
    // Admin siempre tiene todos los permisos
    if (user?.role === 'admin') {
      return true;
    }

    // Verificar si existe el módulo y el permiso
    if (!permissions[module]) {
      return false;
    }

    const actionField = `can_${action}`;
    return Boolean(permissions[module][actionField]);
  };

  const canView = (module) => hasPermission(module, 'view');
  const canCreate = (module) => hasPermission(module, 'create');
  const canEdit = (module) => hasPermission(module, 'edit');
  const canDelete = (module) => hasPermission(module, 'delete');

  const value = {
    permissions,
    loading,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    refreshPermissions: loadPermissions,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};
