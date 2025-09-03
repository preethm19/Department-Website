const db = require('./db');

db.query(`INSERT INTO assignments (class_id, title, description, due_date) VALUES
(1, 'AI Basics Assignment', 'Complete the AI basics worksheet', '2025-09-15'),
(2, 'ML Project', 'Implement a simple ML model', '2025-09-20')`, (err) => {
  if (err) console.error(err);
  else console.log('Assignments inserted');
  db.end();
});
