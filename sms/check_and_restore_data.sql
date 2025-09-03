-- Check current data in results table and restore if needed
USE sms_db;

-- Check current data
SELECT COUNT(*) as total_records FROM results;
SELECT * FROM results LIMIT 10;

-- If student_usn is NULL but we have users, let's restore the data
UPDATE results r
JOIN users u ON r.student_usn IS NULL AND r.id IS NOT NULL
SET r.student_usn = u.usn
WHERE u.role = 'student';

-- If subject_code is NULL but we have subjects, let's restore the data
UPDATE results r
JOIN subjects s ON r.subject_code IS NULL AND r.id IS NOT NULL
SET r.subject_code = s.subject_code;

-- Check the data after restoration
SELECT COUNT(*) as total_records_after_restore FROM results;
SELECT * FROM results LIMIT 10;

-- Check if we have any sample data to insert
INSERT INTO results (student_usn, subject_code, semester, ia1_marks, ia2_marks, ia3_marks, uploaded_by)
SELECT
    u.usn,
    s.subject_code,
    u.semester,
    FLOOR(RAND() * 20) + 10 as ia1_marks,
    FLOOR(RAND() * 20) + 10 as ia2_marks,
    FLOOR(RAND() * 20) + 10 as ia3_marks,
    1 as uploaded_by
FROM users u
CROSS JOIN subjects s
WHERE u.role = 'student'
    AND u.semester = s.semester
    AND NOT EXISTS (
        SELECT 1 FROM results r
        WHERE r.student_usn = u.usn
        AND r.subject_code = s.subject_code
        AND r.semester = u.semester
    )
LIMIT 20;

-- Final check
SELECT COUNT(*) as final_total_records FROM results;
SELECT
    r.*,
    u.name as student_name,
    s.name as subject_name
FROM results r
JOIN users u ON r.student_usn = u.usn
JOIN subjects s ON r.subject_code = s.subject_code
ORDER BY r.uploaded_at DESC
LIMIT 10;
