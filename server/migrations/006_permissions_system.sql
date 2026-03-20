-- Phase 6: Sistema de Permisos Granulares
-- Migration: 006_permissions_system.sql

-- Tabla de permisos disponibles
CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  module VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de permisos asignados a roles
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role ENUM('admin', 'laboratory', 'viewer') NOT NULL,
  permission_id INT NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para mejorar rendimiento
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_permissions_module ON permissions(module);

-- Insertar permisos para todos los módulos del sistema
INSERT INTO permissions (name, description, module) VALUES
-- Administración
('users_management', 'Gestión de usuarios del sistema', 'users'),
('roles_management', 'Gestión de roles y permisos', 'roles'),
('laboratories_management', 'Gestión de laboratorios', 'laboratories'),
('requests_management', 'Gestión de solicitudes de registro', 'requests'),
('participation_options', 'Gestión de opciones de participación', 'participation_options'),
('providers_management', 'Gestión de proveedores', 'providers'),

-- Parámetros
('instruments_management', 'Gestión de instrumentos', 'instruments'),
('brands_management', 'Gestión de marcas', 'brands'),
('principles_management', 'Gestión de principios metodológicos', 'principles'),
('calibrations_management', 'Gestión de calibraciones', 'calibrations'),
('reagents_management', 'Gestión de reactivos', 'reagents'),
('standards_management', 'Gestión de estándares', 'standards'),
('temperatures_management', 'Gestión de temperaturas', 'temperatures'),
('wavelengths_management', 'Gestión de longitudes de onda', 'wavelengths'),
('programs_management', 'Gestión de programas', 'programs'),
('analytes_management', 'Gestión de analitos', 'analytes'),

-- Operaciones
('control_samples_management', 'Gestión de muestras control', 'control_samples'),
('shipments_management', 'Gestión de envíos de resultados', 'shipments'),

-- Resultados y Estadísticas
('results_submission', 'Envío de resultados de laboratorio', 'results_submission'),
('statistics_view', 'Visualización de estadísticas', 'statistics'),
('statistics_management', 'Gestión de estadísticas (admin)', 'statistics_admin'),

-- Configuración
('user_profile', 'Gestión de perfil de usuario', 'user_profile'),
('lab_parameters', 'Configuración de parámetros de medición', 'lab_parameters'),

-- Facturación (futuro)
('invoices_config', 'Configuración de facturas', 'invoices_config'),
('invoices_management', 'Gestión de facturación', 'invoices'),

-- Documentos (futuro)
('documents_management', 'Gestión de documentos', 'documents');

-- Configurar permisos por defecto para rol ADMIN (acceso total)
INSERT INTO role_permissions (role, permission_id, can_view, can_create, can_edit, can_delete)
SELECT 'admin', id, TRUE, TRUE, TRUE, TRUE
FROM permissions;

-- Configurar permisos por defecto para rol LABORATORY (acceso limitado)
INSERT INTO role_permissions (role, permission_id, can_view, can_create, can_edit, can_delete)
SELECT 'laboratory', id,
  CASE
    -- Solo lectura para parámetros
    WHEN module IN ('instruments', 'brands', 'principles', 'calibrations', 'reagents',
                    'standards', 'temperatures', 'wavelengths', 'programs', 'analytes')
    THEN TRUE
    -- Acceso completo a resultados y perfil
    WHEN module IN ('results_submission', 'statistics', 'user_profile', 'lab_parameters')
    THEN TRUE
    ELSE FALSE
  END as can_view,
  CASE
    -- Puede crear resultados
    WHEN module IN ('results_submission', 'lab_parameters') THEN TRUE
    ELSE FALSE
  END as can_create,
  CASE
    -- Puede editar resultados y perfil
    WHEN module IN ('results_submission', 'user_profile', 'lab_parameters') THEN TRUE
    ELSE FALSE
  END as can_edit,
  FALSE as can_delete
FROM permissions;

-- Configurar permisos por defecto para rol VIEWER (solo lectura)
INSERT INTO role_permissions (role, permission_id, can_view, can_create, can_edit, can_delete)
SELECT 'viewer', id,
  CASE
    WHEN module IN ('statistics', 'user_profile') THEN TRUE
    ELSE FALSE
  END as can_view,
  FALSE as can_create,
  FALSE as can_edit,
  FALSE as can_delete
FROM permissions;
