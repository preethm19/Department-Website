-- Check attendance table structure
USE sms_db;

DESCRIBE attendance;

-- Check if there's any data in attendance table
SELECT COUNT(*) as total_records FROM attendance;
SELECT * FROM attendance LIMIT 5;
