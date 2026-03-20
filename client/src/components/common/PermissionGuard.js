import React from 'react';
import { usePermissions } from '../../context/PermissionsContext';
import { Tooltip } from '@mui/material';

/**
 * Componente HOC para proteger elementos basados en permisos
 * @param {Object} props
 * @param {string} props.module - Módulo a verificar
 * @param {string} props.action - Acción requerida (view, create, edit, delete)
 * @param {React.ReactNode} props.children - Contenido a renderizar si tiene permiso
 * @param {React.ReactNode} props.fallback - Contenido a renderizar si no tiene permiso (opcional)
 * @param {boolean} props.showTooltip - Mostrar tooltip cuando no tiene permiso (default: false)
 */
const PermissionGuard = ({
  module,
  action = 'view',
  children,
  fallback = null,
  showTooltip = false,
}) => {
  const { hasPermission, loading } = usePermissions();

  // Mientras se cargan los permisos, no renderizar nada
  if (loading) {
    return null;
  }

  const permitted = hasPermission(module, action);

  if (!permitted) {
    if (showTooltip && React.isValidElement(children)) {
      return (
        <Tooltip title="No tiene permisos para esta acción">
          <span>
            {React.cloneElement(children, { disabled: true })}
          </span>
        </Tooltip>
      );
    }
    return fallback;
  }

  return <>{children}</>;
};

/**
 * Hook para verificar permisos de forma condicional
 * Útil para lógica compleja de renderizado
 */
export const usePermissionCheck = (module, action = 'view') => {
  const { hasPermission, loading } = usePermissions();

  return {
    hasPermission: hasPermission(module, action),
    loading,
  };
};

export default PermissionGuard;
