-- QUALITTEST - Schema Updates for New Features
-- Run this after the initial schema.sql

USE qualittest_system;

-- Table: registration_requests (Solicitudes de registro)
CREATE TABLE IF NOT EXISTS registration_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  -- Laboratory Data
  lab_name VARCHAR(255) NOT NULL,
  lab_email VARCHAR(100) NOT NULL,
  lab_address VARCHAR(255),
  lab_country VARCHAR(100) DEFAULT 'Guatemala',
  lab_department VARCHAR(100),
  lab_phone VARCHAR(20),
  participation_option_id INT,
  payment_plan ENUM('annual', 'two_payments', 'three_payments', 'six_payments') DEFAULT 'annual',

  -- Químico Biólogo Data
  qb_name VARCHAR(255) NOT NULL,
  qb_email VARCHAR(100) NOT NULL,
  qb_phone VARCHAR(20),
  qb_license_number VARCHAR(50),

  -- Contact Data
  contact_name VARCHAR(255),
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),

  -- Billing Data
  billing_name VARCHAR(255),
  billing_nit VARCHAR(50),
  billing_address VARCHAR(255),

  -- Request Status
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Table: participation_options (Opciones de participación)
CREATE TABLE IF NOT EXISTS participation_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  type ENUM('open', 'closed') DEFAULT 'open',
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (active)
);

-- Table: participation_option_programs (Relación opciones-programas)
CREATE TABLE IF NOT EXISTS participation_option_programs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  participation_option_id INT NOT NULL,
  program_id INT NOT NULL,
  FOREIGN KEY (participation_option_id) REFERENCES participation_options(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  UNIQUE KEY unique_option_program (participation_option_id, program_id)
);

-- Table: providers (Proveedores)
CREATE TABLE IF NOT EXISTS providers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provider_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  contact_name VARCHAR(255),
  contact_phone VARCHAR(20),
  email VARCHAR(100),
  address VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_provider_name (provider_name),
  INDEX idx_active (active)
);

-- Table: invoices (Facturas - FEL Guatemala)
CREATE TABLE IF NOT EXISTS invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  laboratory_id INT NOT NULL,
  invoice_number VARCHAR(50) UNIQUE,
  fel_uuid VARCHAR(255) UNIQUE,
  fel_series VARCHAR(20),
  fel_number VARCHAR(50),

  -- Invoice Details
  billing_name VARCHAR(255) NOT NULL,
  billing_nit VARCHAR(50) NOT NULL,
  billing_address VARCHAR(255),

  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- Status
  status ENUM('draft', 'issued', 'paid', 'cancelled') DEFAULT 'draft',
  issue_date DATE,
  due_date DATE,
  paid_date DATE,

  -- FEL Integration
  fel_xml TEXT,
  fel_pdf_url VARCHAR(500),
  fel_response TEXT,
  fel_certified_at TIMESTAMP NULL,

  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_laboratory (laboratory_id),
  INDEX idx_status (status),
  INDEX idx_issue_date (issue_date)
);

-- Table: invoice_items (Ítems de factura)
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  participation_option_id INT,

  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (participation_option_id) REFERENCES participation_options(id),
  INDEX idx_invoice (invoice_id)
);

-- Add new fields to laboratories table
ALTER TABLE laboratories
ADD COLUMN IF NOT EXISTS participation_option_id INT,
ADD COLUMN IF NOT EXISTS payment_plan ENUM('annual', 'two_payments', 'three_payments', 'six_payments') DEFAULT 'annual',
ADD COLUMN IF NOT EXISTS qb_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS qb_email VARCHAR(100),
ADD COLUMN IF NOT EXISTS qb_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS qb_license_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS billing_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_nit VARCHAR(50),
ADD COLUMN IF NOT EXISTS billing_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Guatemala',
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Add foreign key for participation_option_id
ALTER TABLE laboratories
ADD CONSTRAINT fk_lab_participation_option
FOREIGN KEY (participation_option_id) REFERENCES participation_options(id);

-- Insert sample participation options
INSERT INTO participation_options (name, price, type, description) VALUES
('Bioquímica Básica', 1500.00, 'open', 'Programa básico de bioquímica clínica'),
('Hematología Completa', 2000.00, 'open', 'Programa completo de hematología'),
('Paquete Completo', 5000.00, 'closed', 'Incluye todos los programas disponibles');

-- Update users table to support admin features
ALTER TABLE users
ADD COLUMN IF NOT EXISTS can_approve_requests BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_manage_billing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_manage_providers BOOLEAN DEFAULT FALSE;

-- Grant admin permissions to existing admin user
UPDATE users SET
  can_approve_requests = TRUE,
  can_manage_billing = TRUE,
  can_manage_providers = TRUE
WHERE role = 'admin';
