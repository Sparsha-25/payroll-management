-- =====================================================================
-- SQLite and MySQL Normalized Payroll Database Schema
-- File: /database/payroll.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS payroll_management;
USE payroll_management;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'hr', 'employee') NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- 3. Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  dob DATE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  department_id VARCHAR(36) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  joining_date DATE NOT NULL,
  salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  profile_photo TEXT,
  performance_score INT DEFAULT 80,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
);

-- 4. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- e.g. 'Present', 'Absent', 'Leave', 'Work From Home'
  overtime_hours INT NOT NULL DEFAULT 0,
  UNIQUE(employee_id, date),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 5. Leaves Table
CREATE TABLE IF NOT EXISTS leaves (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  leave_type VARCHAR(50) NOT NULL, -- 'Casual Leave', 'Sick Leave', 'Earned Leave'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  applied_on DATE NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 6. Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
  id VARCHAR(36) PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL,
  month VARCHAR(7) NOT NULL, -- 'YYYY-MM'
  basic_salary DECIMAL(12,2) NOT NULL,
  hra DECIMAL(12,2) NOT NULL,
  da DECIMAL(12,2) NOT NULL,
  bonus DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  overtime_hours INT NOT NULL DEFAULT 0,
  gross_salary DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) NOT NULL,
  pf DECIMAL(12,2) NOT NULL,
  insurance DECIMAL(12,2) NOT NULL,
  net_salary DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Draft', -- 'Draft', 'Processed'
  processed_on TIMESTAMP NULL,
  UNIQUE(employee_id, month),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 7. Predictions Table
CREATE TABLE IF NOT EXISTS ai_predictions (
  prediction_id VARCHAR(36) PRIMARY KEY,
  prediction_type VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
