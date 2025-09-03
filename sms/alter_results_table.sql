-- Alter the existing results table to match the new structure
-- This updates the table to use subject_code instead of subject_id
-- and removes the old columns (marks, grade, result_text)

USE sms_db;

-- First, add the new subject_code column
ALTER TABLE results ADD COLUMN subject_code VARCHAR(20) AFTER student_id;

-- Copy data from subject_id to subject_code (assuming subject_id contains the code)
UPDATE results r
JOIN subjects s ON r.subject_id = s.id
SET r.subject_code = s.subject_code;

-- Drop the old subject_id column and foreign key constraint
ALTER TABLE results DROP FOREIGN KEY results_ibfk_2;
ALTER TABLE results DROP COLUMN subject_id;

-- Remove the old columns that are no longer needed
ALTER TABLE results DROP COLUMN marks;
ALTER TABLE results DROP COLUMN grade;
ALTER TABLE results DROP COLUMN result_text;

-- Add the new foreign key constraint for subject_code
-- Note: This is a logical constraint, not a physical one since subject_code is VARCHAR
-- ALTER TABLE results ADD CONSTRAINT fk_subject_code FOREIGN KEY (subject_code) REFERENCES subjects(subject_code);

-- Update the unique key to use subject_code instead of subject_id
ALTER TABLE results DROP INDEX unique_student_subject_semester;
ALTER TABLE results ADD UNIQUE KEY unique_student_subject_semester (student_id, subject_code, semester);

-- Update indexes
ALTER TABLE results DROP INDEX idx_subject_semester;
ALTER TABLE results ADD INDEX idx_subject_code (subject_code);

-- Show the updated table structure
DESCRIBE results;
