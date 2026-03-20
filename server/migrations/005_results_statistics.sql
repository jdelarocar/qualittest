-- Phase 5: Advanced Statistics and Results Management
-- Migration 005: Results and Statistics Tables

-- Table: laboratory_results
-- Stores individual laboratory results for each shipment
CREATE TABLE IF NOT EXISTS laboratory_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shipment_id INT NOT NULL,
  laboratory_id INT NOT NULL,
  control_sample_value_id INT NOT NULL,
  result_value VARCHAR(100),
  is_numeric BOOLEAN DEFAULT TRUE,
  is_excluded BOOLEAN DEFAULT FALSE,
  exclusion_reason VARCHAR(255),
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
  FOREIGN KEY (control_sample_value_id) REFERENCES control_sample_values(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  UNIQUE KEY unique_lab_shipment_value (laboratory_id, shipment_id, control_sample_value_id)
);

-- Table: shipment_statistics
-- Stores calculated statistics for each analyte in a shipment
CREATE TABLE IF NOT EXISTS shipment_statistics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shipment_id INT NOT NULL,
  control_sample_value_id INT NOT NULL,
  analyte_id INT NOT NULL,
  n_total INT DEFAULT 0,
  n_valid INT DEFAULT 0,
  n_excluded INT DEFAULT 0,
  mean_value DECIMAL(15,4),
  median_value DECIMAL(15,4),
  standard_deviation DECIMAL(15,4),
  coefficient_variation DECIMAL(10,4),
  min_value DECIMAL(15,4),
  max_value DECIMAL(15,4),
  reference_value DECIMAL(15,4),
  lower_limit DECIMAL(15,4),
  upper_limit DECIMAL(15,4),
  calculated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  FOREIGN KEY (control_sample_value_id) REFERENCES control_sample_values(id) ON DELETE CASCADE,
  FOREIGN KEY (analyte_id) REFERENCES analytes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_shipment_analyte (shipment_id, control_sample_value_id)
);

-- Table: laboratory_statistics
-- Stores individual laboratory performance metrics
CREATE TABLE IF NOT EXISTS laboratory_statistics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  laboratory_result_id INT NOT NULL,
  shipment_statistic_id INT NOT NULL,
  z_score DECIMAL(10,4),
  z_interpretation ENUM('acceptable', 'warning', 'unacceptable'),
  ids_score DECIMAL(10,4),
  drp_score DECIMAL(10,4),
  deviation_from_mean DECIMAL(15,4),
  percentile DECIMAL(5,2),
  calculated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (laboratory_result_id) REFERENCES laboratory_results(id) ON DELETE CASCADE,
  FOREIGN KEY (shipment_statistic_id) REFERENCES shipment_statistics(id) ON DELETE CASCADE,
  UNIQUE KEY unique_lab_result_stat (laboratory_result_id)
);

-- Table: parameter_configurations
-- Stores laboratory parameter configurations (per analyte)
CREATE TABLE IF NOT EXISTS parameter_configurations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  laboratory_id INT NOT NULL,
  analyte_id INT NOT NULL,
  brand_id INT,
  principle_id INT,
  instrument_id INT,
  standard_id INT,
  calibration_id INT,
  temperature_id INT,
  wavelength_id INT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  updated_by INT,
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
  FOREIGN KEY (analyte_id) REFERENCES analytes(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (principle_id) REFERENCES principles(id),
  FOREIGN KEY (instrument_id) REFERENCES instruments(id),
  FOREIGN KEY (standard_id) REFERENCES standards(id),
  FOREIGN KEY (calibration_id) REFERENCES calibrations(id),
  FOREIGN KEY (temperature_id) REFERENCES temperatures(id),
  FOREIGN KEY (wavelength_id) REFERENCES wavelengths(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  UNIQUE KEY unique_lab_analyte_config (laboratory_id, analyte_id)
);

-- Indexes for performance
CREATE INDEX idx_lab_results_shipment ON laboratory_results(shipment_id);
CREATE INDEX idx_lab_results_laboratory ON laboratory_results(laboratory_id);
CREATE INDEX idx_lab_results_submitted ON laboratory_results(submitted_at);
CREATE INDEX idx_shipment_stats_shipment ON shipment_statistics(shipment_id);
CREATE INDEX idx_shipment_stats_analyte ON shipment_statistics(analyte_id);
CREATE INDEX idx_lab_stats_result ON laboratory_statistics(laboratory_result_id);
CREATE INDEX idx_param_config_lab ON parameter_configurations(laboratory_id);
CREATE INDEX idx_param_config_analyte ON parameter_configurations(analyte_id);
