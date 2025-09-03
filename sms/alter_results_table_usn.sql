-- Alter the results table to use student_usn instead of student_id

USE sms_db;

-- First, add the new student_usn column
ALTER TABLE results ADD COLUMN student_usn VARCHAR(20) AFTER id;

-- Copy data from student_id to student_usn (by joining with users table)
UPDATE results r
JOIN users u ON r.student_id = u.id
SET r.student_usn = u.usn;

-- Drop the old student_id column and its foreign key constraint
ALTER TABLE results DROP FOREIGN KEY results_ibfk_1;
ALTER TABLE results DROP COLUMN student_id;

-- Update the unique key to use student_usn instead of student_id
ALTER TABLE results DROP INDEX unique_student_subject_semester;
ALTER TABLE results ADD UNIQUE KEY unique_student_subject_semester (student_usn, subject_code, semester);

-- Update indexes
ALTER TABLE results DROP INDEX idx_student_semester;
ALTER TABLE results ADD INDEX idx_student_semester (student_usn, semester);

-- Show the updated table structure
DESCRIBE results;
