-- ===========================================
-- SMS (Student Management System) Database
-- Complete Setup Script
-- ===========================================
-- This file consolidates all SQL setup files
-- Created: 2025-09-03
-- Version: 1.0.0
-- ===========================================

-- ===========================================
-- 1. DATABASE CREATION
-- ===========================================
CREATE DATABASE sms_db;
USE sms_db;

-- ===========================================
-- 2. CORE TABLES
-- ===========================================

-- Users table (students and admins)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  usn VARCHAR(50),
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL,
  semester INT,
  phone VARCHAR(20),
  dob DATE,
  department VARCHAR(50) DEFAULT 'AI',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  lecturer_id INT,
  description TEXT,
  schedule VARCHAR(255),
  department VARCHAR(50) DEFAULT 'AI',
  semester INT,
  subject_code VARCHAR(20) UNIQUE,
  FOREIGN KEY (lecturer_id) REFERENCES users(id)
);

-- Enrollments table (student-subject relationships)
CREATE TABLE enrollments (
  student_id INT,
  subject_id INT,
  PRIMARY KEY (student_id, subject_id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Materials table (course materials)
CREATE TABLE materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT,
  title VARCHAR(255) NOT NULL,
  file_path VARCHAR(255),
  original_filename VARCHAR(255),
  uploaded_by INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Assignments table
CREATE TABLE assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  file_path VARCHAR(255),
  original_filename VARCHAR(255),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Submissions table (assignment submissions)
CREATE TABLE submissions (
  assignment_id INT,
  student_id INT,
  file_path VARCHAR(255),
  original_filename VARCHAR(255),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grade VARCHAR(10),
  PRIMARY KEY (assignment_id, student_id),
  FOREIGN KEY (assignment_id) REFERENCES assignments(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Attendance table
CREATE TABLE attendance (
  subject_id INT,
  student_id INT,
  date DATE,
  status ENUM('present', 'absent') DEFAULT 'absent',
  PRIMARY KEY (subject_id, student_id, date),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Notifications table (basic notifications)
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  message TEXT,
  type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Documents table (student documents)
CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(255) NOT NULL,
  file_path VARCHAR(255),
  original_filename VARCHAR(255),
  type ENUM('student', 'lecturer') DEFAULT 'student',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Token blacklist table (for logout session management)
CREATE TABLE token_blacklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(500) NOT NULL,
  user_id INT,
  blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  reason VARCHAR(100) DEFAULT 'logout',
  INDEX idx_token (token(255)),
  INDEX idx_expires_at (expires_at),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===========================================
-- 3. ADMIN TABLES
-- ===========================================

-- Admin documents table
CREATE TABLE admin_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Enhanced notifications table for admin
CREATE TABLE notifications_enhanced (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sender_id INT NOT NULL,
  recipient_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notification recipients table
CREATE TABLE notification_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notification_id INT NOT NULL,
  user_id INT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (notification_id) REFERENCES notifications_enhanced(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_notification_user (notification_id, user_id)
);

-- Document recipients table
CREATE TABLE document_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  user_id INT NOT NULL,
  downloaded_at TIMESTAMP NULL,
  FOREIGN KEY (document_id) REFERENCES admin_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_document_user (document_id, user_id)
);

-- ===========================================
-- 4. RESULTS SYSTEM
-- ===========================================

-- Results table for IA marks and grades
CREATE TABLE results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_usn VARCHAR(20) NOT NULL,
  subject_code VARCHAR(20) NOT NULL,
  semester INT NOT NULL,

  -- Internal Assessment marks (IA1, IA2, IA3)
  ia1_marks DECIMAL(5,2),
  ia2_marks DECIMAL(5,2),
  ia3_marks DECIMAL(5,2),

  -- Metadata
  uploaded_by INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one result per student per subject per semester
  UNIQUE KEY unique_student_subject_semester (student_usn, subject_code, semester),

  -- Foreign key constraints
  FOREIGN KEY (uploaded_by) REFERENCES users(id),

  -- Indexes for better query performance
  INDEX idx_student_semester (student_usn, semester),
  INDEX idx_subject_code (subject_code),
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_uploaded_at (uploaded_at)
);

-- ===========================================
-- 5. COLUMN MODIFICATIONS & UPDATES
-- ===========================================

-- Update existing notifications table structure if needed
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS sender_id INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key if it doesn't exist for notifications
SET @constraint_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND TABLE_NAME = 'notifications'
  AND CONSTRAINT_NAME = 'notifications_ibfk_1'
);

SET @sql = IF(@constraint_exists = 0,
  'ALTER TABLE notifications ADD CONSTRAINT notifications_ibfk_1 FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT "Foreign key already exists" as status;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===========================================
-- 6. SAMPLE DATA INSERTION
-- ===========================================

-- Insert sample users (admin and students)
INSERT INTO users (name, email, usn, password, role, semester, phone, department) VALUES
('Admin User', 'admin@sms.com', NULL, '$2b$10$hashedpassword', 'admin', NULL, '1234567890', 'AI'),
('John Doe', 'john.doe@sms.com', '1AI20CS001', '$2b$10$hashedpassword', 'student', 1, '9876543210', 'AI'),
('Jane Smith', 'jane.smith@sms.com', '1AI20CS002', '$2b$10$hashedpassword', 'student', 1, '9876543211', 'AI'),
('Bob Johnson', 'bob.johnson@sms.com', '1AI20CS003', '$2b$10$hashedpassword', 'student', 1, '9876543212', 'AI')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  password = VALUES(password),
  role = VALUES(role),
  semester = VALUES(semester),
  phone = VALUES(phone),
  department = VALUES(department);

-- Insert sample subjects
INSERT INTO subjects (name, lecturer_id, description, department, semester, subject_code) VALUES
('Data Structures', 1, 'Introduction to Data Structures and Algorithms', 'AI', 1, 'CS101'),
('Database Management', 1, 'Database Design and Management', 'AI', 1, 'CS102'),
('Web Development', 1, 'Modern Web Development Technologies', 'AI', 1, 'CS103')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  lecturer_id = VALUES(lecturer_id),
  description = VALUES(description),
  department = VALUES(department),
  semester = VALUES(semester);

-- Insert sample results data
INSERT INTO results (student_usn, subject_code, semester, ia1_marks, ia2_marks, ia3_marks, uploaded_by) VALUES
('1AI20CS001', 'CS101', 1, 25.0, 28.5, 32.0, 1),
('1AI20CS002', 'CS101', 1, 22.0, 26.0, 30.0, 1),
('1AI20CS003', 'CS101', 1, 28.0, 31.3, 33.0, 1),
('1AI20CS001', 'CS102', 1, 24.5, 27.0, 31.5, 1),
('1AI20CS002', 'CS102', 1, 26.0, 29.5, 33.0, 1)
ON DUPLICATE KEY UPDATE
  ia1_marks = VALUES(ia1_marks),
  ia2_marks = VALUES(ia2_marks),
  ia3_marks = VALUES(ia3_marks),
  uploaded_by = VALUES(uploaded_by),
  uploaded_at = CURRENT_TIMESTAMP;

-- ===========================================
-- 7. FINAL CHECKS AND OPTIMIZATIONS
-- ===========================================

-- Show all tables created
SHOW TABLES;

-- Show results table structure
DESCRIBE results;

-- Show users table structure
DESCRIBE users;

-- Show subjects table structure
DESCRIBE subjects;

-- Count records in each table
SELECT
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM subjects) as subjects_count,
  (SELECT COUNT(*) FROM results) as results_count,
  (SELECT COUNT(*) FROM attendance) as attendance_count,
  (SELECT COUNT(*) FROM notifications) as notifications_count;

-- ===========================================
-- SETUP COMPLETE
-- ===========================================
-- Database: sms_db
-- All tables created successfully
-- Sample data inserted
-- Ready for use!
-- ===========================================
