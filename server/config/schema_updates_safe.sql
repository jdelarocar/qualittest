-- Phase 1: Registration Request System & Participation Options
-- Safe version for MySQL without IF NOT EXISTS in multiple ADD COLUMN

-- Create registration_requests table
CREATE TABLE IF NOT EXISTS registration_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lab_name VARCHAR(255) NOT NULL,
  lab_email VARCHAR(100) NOT NULL,
  lab_address VARCHAR(255),
  lab_country VARCHAR(100) DEFAULT 'Guatemala',
  lab_department VARCHAR(100),
  lab_phone VARCHAR(20),
  participation_option_id INT,
  payment_plan ENUM('annual', 'two_payments', 'three_payments', 'six_payments') DEFAULT 'annual',
  qb_name VARCHAR(255) NOT NULL,
  qb_email VARCHAR(100) NOT NULL,
  qb_phone VARCHAR(20),
  qb_license_number VARCHAR(50),
  contact_name VARCHAR(255),
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  billing_name VARCHAR(255),
  billing_nit VARCHAR(50),
  billing_address VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_lab_email (lab_email),
  INDEX idx_created_at (created_at)
);

-- Create participation_options table
CREATE TABLE IF NOT EXISTS participation_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  type ENUM('open', 'closed') DEFAULT 'open',
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (active),
  INDEX idx_type (type)
);

-- Create participation_option_programs junction table
CREATE TABLE IF NOT EXISTS participation_option_programs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  participation_option_id INT NOT NULL,
  program_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participation_option_id) REFERENCES participation_options(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  UNIQUE KEY unique_option_program (participation_option_id, program_id)
);

-- Add new fields to laboratories table (one by one to avoid IF NOT EXISTS issue)
ALTER TABLE laboratories ADD COLUMN participation_option_id INT;
ALTER TABLE laboratories ADD COLUMN payment_plan ENUM('annual', 'two_payments', 'three_payments', 'six_payments') DEFAULT 'annual';
ALTER TABLE laboratories ADD COLUMN qb_name VARCHAR(255);
ALTER TABLE laboratories ADD COLUMN qb_email VARCHAR(100);
ALTER TABLE laboratories ADD COLUMN qb_phone VARCHAR(20);
ALTER TABLE laboratories ADD COLUMN qb_license_number VARCHAR(50);
ALTER TABLE laboratories ADD COLUMN contact_name VARCHAR(255);
ALTER TABLE laboratories ADD COLUMN contact_email VARCHAR(100);
ALTER TABLE laboratories ADD COLUMN contact_phone VARCHAR(20);
ALTER TABLE laboratories ADD COLUMN billing_name VARCHAR(255);
ALTER TABLE laboratories ADD COLUMN billing_nit VARCHAR(50);
ALTER TABLE laboratories ADD COLUMN billing_address VARCHAR(255);
ALTER TABLE laboratories ADD COLUMN country VARCHAR(100) DEFAULT 'Guatemala';
ALTER TABLE laboratories ADD COLUMN department VARCHAR(100);

-- Add foreign key for participation_option_id if not exists
ALTER TABLE laboratories ADD CONSTRAINT fk_lab_participation_option
  FOREIGN KEY (participation_option_id) REFERENCES participation_options(id) ON DELETE SET NULL;

-- Add indexes
ALTER TABLE laboratories ADD INDEX idx_participation_option (participation_option_id);
ALTER TABLE laboratories ADD INDEX idx_country (country);
