-- Check current table structure and fix any remaining issues
USE sms_db;

-- First, check the current structure
DESCRIBE results;

-- Check if student_id column still exists and drop it
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'sms_db'
     AND TABLE_NAME = 'results'
     AND COLUMN_NAME = 'student_id') > 0,
    'ALTER TABLE results DROP COLUMN student_id;',
    'SELECT "student_id column already removed" as status;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if subject_id column still exists and drop it
SET @sql2 = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'sms_db'
     AND TABLE_NAME = 'results'
     AND COLUMN_NAME = 'subject_id') > 0,
    'ALTER TABLE results DROP COLUMN subject_id;',
    'SELECT "subject_id column already removed" as status;'
));
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Check if student_usn column exists, if not add it
SET @sql3 = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'sms_db'
     AND TABLE_NAME = 'results'
     AND COLUMN_NAME = 'student_usn') = 0,
    'ALTER TABLE results ADD COLUMN student_usn VARCHAR(20) AFTER id;',
    'SELECT "student_usn column already exists" as status;'
));
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Check if subject_code column exists, if not add it
SET @sql4 = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'sms_db'
     AND TABLE_NAME = 'results'
     AND COLUMN_NAME = 'subject_code') = 0,
    'ALTER TABLE results ADD COLUMN subject_code VARCHAR(20) AFTER student_usn;',
    'SELECT "subject_code column already exists" as status;'
));
PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- Copy data from student_id to student_usn if student_id still exists
SET @sql5 = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'sms_db'
     AND TABLE_NAME = 'results'
     AND COLUMN_NAME = 'student_id') > 0
    AND
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'sms_db'
     AND TABLE_NAME = 'results'
     AND COLUMN_NAME = 'student_usn') > 0,
    'UPDATE results r JOIN users u ON r.student_id = u.id SET r.student_usn = u.usn WHERE r.student_usn IS NULL;',
    'SELECT "Data copy not needed or already done" as status;'
));
PREPARE stmt5 FROM @sql5;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;

-- Copy data from subject_id to subject_code if subject_id still exists
SET @sql6 = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'sms_db'
     AND TABLE_NAME = 'results'
     AND COLUMN_NAME = 'subject_id') > 0
    AND
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'sms_db'
     AND TABLE_NAME = 'results'
     AND COLUMN_NAME = 'subject_code') > 0,
    'UPDATE results r JOIN subjects s ON r.subject_id = s.id SET r.subject_code = s.subject_code WHERE r.subject_code IS NULL;',
    'SELECT "Subject data copy not needed or already done" as status;'
));
PREPARE stmt6 FROM @sql6;
EXECUTE stmt6;
DEALLOCATE PREPARE stmt6;

-- Final check of the table structure
DESCRIBE results;
