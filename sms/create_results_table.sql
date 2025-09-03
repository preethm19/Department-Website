-- Create dedicated results table for storing student marks/grades
-- This replaces the old approach of using submissions table for results

USE sms_db;

-- Create the new results table with IA support (simplified)
CREATE TABLE IF NOT EXISTS results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_code VARCHAR(20) NOT NULL,  -- Subject code instead of ID
  semester INT NOT NULL,

  -- Internal Assessment marks (IA1, IA2, IA3) - only these columns
  ia1_marks DECIMAL(5,2), -- IA1 marks
  ia2_marks DECIMAL(5,2), -- IA2 marks
  ia3_marks DECIMAL(5,2), -- IA3 marks

  -- Metadata
  uploaded_by INT,    -- Admin who uploaded the result
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one result per student per subject per semester
  UNIQUE KEY unique_student_subject_semester (student_id, subject_code, semester),

  -- Foreign key constraints
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),

  -- Indexes for better query performance
  INDEX idx_student_semester (student_id, semester),
  INDEX idx_subject_code (subject_code),
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_uploaded_at (uploaded_at)
);

-- Add some sample data for testing with IA marks
INSERT INTO results (student_id, subject_code, semester, ia1_marks, ia2_marks, ia3_marks, uploaded_by) VALUES
(1, 'CS101', 1, 25.0, 28.5, 32.0, 1),
(2, 'CS101', 1, 22.0, 26.0, 30.0, 1),
(3, 'CS101', 1, 28.0, 31.3, 33.0, 1)
ON DUPLICATE KEY UPDATE
  ia1_marks = VALUES(ia1_marks),
  ia2_marks = VALUES(ia2_marks),
  ia3_marks = VALUES(ia3_marks),
  uploaded_by = VALUES(uploaded_by),
  uploaded_at = CURRENT_TIMESTAMP;

-- Show the table structure
DESCRIBE results;
