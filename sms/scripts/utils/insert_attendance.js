const db = require('./db');

db.query(`INSERT INTO attendance (class_id, student_id, date, status) VALUES
(1, 2, '2025-09-01', 'present'),
(1, 2, '2025-09-03', 'absent'),
(2, 2, '2025-09-02', 'present')`, (err) => {
  if (err) console.error(err);
  else console.log('Attendance inserted');
  db.end();
});
