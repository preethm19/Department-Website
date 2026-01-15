-- ===========================================
-- Comprehensive Database Schema Migration
-- ===========================================
-- Creates all missing tables for the SMS system
-- ===========================================

USE sms_db;

-- Documents table (for student/lecturer documents)
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  type ENUM('student', 'lecturer') NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin Documents table (for admin-uploaded documents)
CREATE TABLE IF NOT EXISTS admin_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  recipient_type VARCHAR(100) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_recipient_type (recipient_type),
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Document Recipients table
CREATE TABLE IF NOT EXISTS document_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  user_id INT NOT NULL,
  downloaded_at TIMESTAMP NULL DEFAULT NULL,
  
  INDEX idx_document_id (document_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (document_id) REFERENCES admin_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_document_user (document_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subject_code VARCHAR(50) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  semester INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_department (department),
  INDEX idx_semester (semester),
  INDEX idx_subject_code (subject_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Materials table (course materials)
CREATE TABLE IF NOT EXISTS materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_subject_id (subject_id),
  INDEX idx_uploaded_by (uploaded_by),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  student_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent') NOT NULL,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_subject_id (subject_id),
  INDEX idx_student_id (student_id),
  INDEX idx_date (date),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (subject_id, student_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Results table (exam results)
CREATE TABLE IF NOT EXISTS results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  usn VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  semester INT NOT NULL,
  exam_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_student_id (student_id),
  INDEX idx_usn (usn),
  INDEX idx_semester (semester),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'All database tables created successfully!' as status;
