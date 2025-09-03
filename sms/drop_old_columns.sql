-- Drop the old columns from results table
USE sms_db;

-- Drop foreign key constraints first
ALTER TABLE results DROP FOREIGN KEY results_ibfk_1;
ALTER TABLE results DROP FOREIGN KEY results_ibfk_2;

-- Drop the old columns
ALTER TABLE results DROP COLUMN student_id;
ALTER TABLE results DROP COLUMN subject_id;

-- Show the final table structure
DESCRIBE results;
