-- Phase 2: Providers and Users Management

-- Create providers table
CREATE TABLE IF NOT EXISTS providers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  address VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_active (active)
);

-- Add audit fields to users table (one by one to avoid syntax errors)
ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN created_by INT;
ALTER TABLE users ADD COLUMN updated_by INT;

-- Add indexes to users table
ALTER TABLE users ADD INDEX idx_role (role);
ALTER TABLE users ADD INDEX idx_active (active);
