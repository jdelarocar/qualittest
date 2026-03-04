-- QUALITTEST System Database Schema
-- Drop existing database if exists and create new one
DROP DATABASE IF EXISTS qualittest_system;
CREATE DATABASE qualittest_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qualittest_system;

-- Laboratories Table
CREATE TABLE laboratories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(100),
  director_name VARCHAR(255),
  director_license VARCHAR(50),
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  registration_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_status (status)
);

-- Users Table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  laboratory_id INT NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role ENUM('admin', 'laboratory', 'coordinator') DEFAULT 'laboratory',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
  INDEX idx_username (username),
  INDEX idx_email (email)
);

-- Programs Table
CREATE TABLE programs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code)
);

-- Analytes Table (for Biochemistry program)
CREATE TABLE analytes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  program_id INT NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(20),
  active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  INDEX idx_program (program_id),
  INDEX idx_code (code)
);

-- Methods/Principles Table
CREATE TABLE methods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  analyte_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  principle VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analyte_id) REFERENCES analytes(id) ON DELETE CASCADE,
  INDEX idx_analyte (analyte_id)
);

-- Sample Shipments Table
CREATE TABLE shipments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  program_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phase VARCHAR(50),
  year YEAR NOT NULL,
  month INT NOT NULL,
  sample_number VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('open', 'closed', 'processing') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES programs(id),
  INDEX idx_program (program_id),
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date)
);

-- Laboratory Measurement Parameters
CREATE TABLE lab_parameters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  laboratory_id INT NOT NULL,
  analyte_id INT NOT NULL,
  method_id INT,
  brand VARCHAR(100),
  instrument VARCHAR(100),
  standard VARCHAR(100),
  calibration VARCHAR(100),
  temperature DECIMAL(4,1),
  wavelength INT,
  year YEAR NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
  FOREIGN KEY (analyte_id) REFERENCES analytes(id) ON DELETE CASCADE,
  FOREIGN KEY (method_id) REFERENCES methods(id) ON DELETE SET NULL,
  UNIQUE KEY unique_lab_analyte_year (laboratory_id, analyte_id, year),
  INDEX idx_lab_year (laboratory_id, year)
);

-- Results Table
CREATE TABLE results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shipment_id INT NOT NULL,
  laboratory_id INT NOT NULL,
  analyte_id INT NOT NULL,
  result_value DECIMAL(12,4),
  method_id INT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
  FOREIGN KEY (analyte_id) REFERENCES analytes(id) ON DELETE CASCADE,
  FOREIGN KEY (method_id) REFERENCES methods(id) ON DELETE SET NULL,
  UNIQUE KEY unique_result (shipment_id, laboratory_id, analyte_id),
  INDEX idx_shipment (shipment_id),
  INDEX idx_laboratory (laboratory_id),
  INDEX idx_analyte (analyte_id)
);

-- Statistics Table (Pre-calculated statistics for performance)
CREATE TABLE statistics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shipment_id INT NOT NULL,
  analyte_id INT NOT NULL,
  method_id INT,
  n_total INT NOT NULL,
  n_excluded INT DEFAULT 0,
  mean_value DECIMAL(12,4),
  std_dev DECIMAL(12,4),
  cv_percent DECIMAL(8,4),
  reference_value DECIMAL(12,4),
  min_value DECIMAL(12,4),
  max_value DECIMAL(12,4),
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  FOREIGN KEY (analyte_id) REFERENCES analytes(id) ON DELETE CASCADE,
  FOREIGN KEY (method_id) REFERENCES methods(id) ON DELETE SET NULL,
  UNIQUE KEY unique_stat (shipment_id, analyte_id, method_id),
  INDEX idx_shipment_analyte (shipment_id, analyte_id)
);

-- Lab Performance Table (IDS, DRP, Z-Score per result)
CREATE TABLE performance_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  result_id INT NOT NULL,
  ids_all DECIMAL(8,4),
  ids_method DECIMAL(8,4),
  drp_all DECIMAL(8,4),
  drp_method DECIMAL(8,4),
  z_score DECIMAL(8,4),
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
  UNIQUE KEY unique_metric (result_id),
  INDEX idx_result (result_id)
);

-- Payments Table
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  laboratory_id INT NOT NULL,
  program_id INT NOT NULL,
  year YEAR NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id),
  INDEX idx_laboratory (laboratory_id),
  INDEX idx_status (status)
);

-- Certificates Table
CREATE TABLE certificates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  laboratory_id INT NOT NULL,
  program_id INT NOT NULL,
  year YEAR NOT NULL,
  participation_percent DECIMAL(5,2),
  issued BOOLEAN DEFAULT FALSE,
  issued_at TIMESTAMP NULL,
  certificate_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id),
  INDEX idx_laboratory_year (laboratory_id, year)
);

-- Insert Initial Programs
INSERT INTO programs (code, name, description, active) VALUES
('BIOCHEM', 'Bioquímica', 'Programa de evaluación de química clínica con 39 analitos', TRUE),
('HEMA', 'Hematología', 'Evaluación de hemoglobina, fórmula diferencial y morfología', TRUE),
('URO', 'Uroanálisis', 'Análisis químico de orina y sedimento urinario', TRUE),
('PARA', 'Parasitología', 'Identificación de parásitos intestinales', TRUE),
('BACT', 'Bacteriología', 'Identificación bacteriológica y antibiograma', TRUE),
('TB', 'Tuberculosis', 'Tinción de Ziehl Neelsen y BAAR', TRUE),
('MYCO', 'Micología', 'Identificación de estructuras fúngicas', TRUE),
('IMMUNO', 'Inmunología', 'Pruebas inmunológicas y serológicas', TRUE);

-- Insert Biochemistry Analytes
INSERT INTO analytes (program_id, code, name, unit, sort_order) VALUES
(1, 'AMYLASE', 'a-AMILASA', 'U/L', 1),
(1, 'PAMYLASE', 'a-AMILASA PANCREÁTICA', 'U/L', 2),
(1, 'ACE', 'ACE', 'U/L', 3),
(1, 'URIC_ACID', 'ÁCIDO ÚRICO', 'mg/dL', 4),
(1, 'BILE_ACIDS', 'ÁCIDOS BILIARES TOTALES', 'μmol/L', 5),
(1, 'ALBUMIN', 'ALBÚMINA', 'g/dL', 6),
(1, 'ALT', 'ALT/TGP', 'U/L', 7),
(1, 'AST', 'AST/GOT', 'U/L', 8),
(1, 'BILIRUBIN_D', 'BILIRRUBINA (DIRECTA)', 'mg/dL', 9),
(1, 'BILIRUBIN_T', 'BILIRRUBINA TOTAL', 'mg/dL', 10),
(1, 'CALCIUM', 'CALCIO', 'mg/dL', 11),
(1, 'CK', 'CK', 'U/L', 12),
(1, 'CHLORIDE', 'CLORURO', 'mmol/L', 13),
(1, 'COPPER', 'COBRE-PAESA', 'μg/dL', 14),
(1, 'HDL', 'COLESTEROL HDL', 'mg/dL', 15),
(1, 'LDL', 'COLESTEROL LDL', 'mg/dL', 16),
(1, 'CHOL_TOTAL', 'COLESTEROL TOTAL', 'mg/dL', 17),
(1, 'CHOLINESTERASE', 'COLINESTERASA', 'U/L', 18),
(1, 'CREATININE', 'CREATINA', 'mg/dL', 19),
(1, 'ACP', 'FOSFATASA ÁCIDA', 'U/L', 20),
(1, 'ALP', 'FOSFATASA ALCALINA', 'U/L', 21),
(1, 'PHOSPHORUS', 'FÓSFORO', 'mg/dL', 22),
(1, 'GLUCOSE', 'GLUCOSA', 'mg/dL', 23),
(1, 'IRON', 'HIERRO', 'μg/dL', 24),
(1, 'LACTATE', 'LACTATO', 'mmol/L', 25),
(1, 'LDH', 'LDH', 'U/L', 26),
(1, 'LIPASE', 'LIPASA', 'U/L', 27),
(1, 'MAGNESIUM', 'MAGNESIO', 'mg/dL', 28),
(1, 'NEFA', 'NEFA', 'mmol/L', 29),
(1, 'BUN', 'NITROGENO DE UREA', 'mg/dL', 30),
(1, 'POTASSIUM', 'POTASIO', 'mmol/L', 31),
(1, 'PROTEIN', 'PROTEÍNA (TOTAL)', 'g/dL', 32),
(1, 'SODIUM', 'SODIO', 'mmol/L', 33),
(1, 'TRIGLYCERIDES', 'TRIGLICERIDOS', 'mg/dL', 34),
(1, 'UIBC', 'UIBC', 'μg/dL', 35),
(1, 'UREA', 'UREA TOTAL', 'mg/dL', 36),
(1, 'ZINC', 'ZINC', 'μg/dL', 37),
(1, 'BHBA', 'β-HIDROXIBUTIRATO', 'mmol/L', 38),
(1, 'GGT', 'γ-GT', 'U/L', 39);

-- Insert Sample Methods for some analytes
INSERT INTO methods (analyte_id, name, principle) VALUES
(23, 'Glucosa Oxidasa', 'Enzimático'),
(23, 'Hexoquinasa', 'Enzimático'),
(17, 'CHOD-PAP', 'Enzimático'),
(17, 'Colorimétrico', 'Colorimétrico'),
(34, 'GPO-PAP', 'Enzimático'),
(7, 'IFCC sin P5P', 'Enzimático'),
(7, 'IFCC con P5P', 'Enzimático');

-- Create Admin User (password: admin123 - hashed with bcrypt)
INSERT INTO users (laboratory_id, username, password, full_name, email, role)
VALUES (1, 'admin', '$2a$10$XQK9q8Y9hX9K5x5Y9hX9K5x5Y9hX9K5x5Y9hX9K5x5Y9hX9K5x5', 'Administrador PEEC', 'admin@aqbg.org', 'admin');

-- Create Sample Laboratory
INSERT INTO laboratories (code, name, address, phone, email, director_name, director_license, registration_date)
VALUES ('1010333', 'Laboratorio Ejemplo', '1a. Av. 10-43 Zona 10', '2448-2502', 'ejemplo@lab.com', 'Dr. Juan Pérez', '12345', CURDATE());
