-- Phase 4: Operations Module (Control Samples & Enhanced Shipments)

-- Create control_samples table
CREATE TABLE IF NOT EXISTS control_samples (
  id INT PRIMARY KEY AUTO_INCREMENT,
  program_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  lot_number VARCHAR(100),
  expiration_date DATE,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_program (program_id),
  INDEX idx_name (name),
  INDEX idx_active (active)
);

-- Create control_sample_values table (stores expected values per analyte)
CREATE TABLE IF NOT EXISTS control_sample_values (
  id INT PRIMARY KEY AUTO_INCREMENT,
  control_sample_id INT NOT NULL,
  analyte_id INT NOT NULL,
  principle_id INT,
  data_type ENUM('numeric', 'alphanumeric') DEFAULT 'numeric',
  reference_value VARCHAR(50),
  upper_limit DECIMAL(10,4),
  lower_limit DECIMAL(10,4),
  unit VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (control_sample_id) REFERENCES control_samples(id) ON DELETE CASCADE,
  FOREIGN KEY (analyte_id) REFERENCES analytes(id) ON DELETE RESTRICT,
  FOREIGN KEY (principle_id) REFERENCES principles(id) ON DELETE SET NULL,
  UNIQUE KEY unique_sample_analyte (control_sample_id, analyte_id, principle_id),
  INDEX idx_control_sample (control_sample_id),
  INDEX idx_analyte (analyte_id)
);

-- Enhance shipments table with additional fields
ALTER TABLE shipments ADD COLUMN control_sample_id INT;
ALTER TABLE shipments ADD COLUMN max_reception_date DATE;
ALTER TABLE shipments ADD COLUMN report_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE shipments ADD COLUMN report_generated_at TIMESTAMP NULL;
ALTER TABLE shipments ADD COLUMN report_generated_by INT;

-- Add foreign keys to shipments
ALTER TABLE shipments ADD CONSTRAINT fk_shipment_control_sample
  FOREIGN KEY (control_sample_id) REFERENCES control_samples(id) ON DELETE SET NULL;
ALTER TABLE shipments ADD CONSTRAINT fk_shipment_report_user
  FOREIGN KEY (report_generated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes to shipments
ALTER TABLE shipments ADD INDEX idx_control_sample (control_sample_id);
ALTER TABLE shipments ADD INDEX idx_max_reception (max_reception_date);
ALTER TABLE shipments ADD INDEX idx_report_generated (report_generated);
