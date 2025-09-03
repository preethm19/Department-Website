const db = require('./db');

db.query(`INSERT INTO subjects (name, lecturer_id, description, schedule, department, semester) VALUES
('Artificial Intelligence', 1, 'Introduction to AI', 'Mon-Wed 10:00-11:30', 'AI', 3),
('Machine Learning', 1, 'ML fundamentals', 'Tue-Thu 14:00-15:30', 'AI', 3)`, (err) => {
  if (err) console.error(err);
  else {
    db.query('INSERT INTO enrollments (student_id, subject_id) VALUES (2, 1), (2, 2)', (err) => {
      if (err) console.error(err);
      else console.log('Sample data inserted');
      db.end();
    });
  }
});
