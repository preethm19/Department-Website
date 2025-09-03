const db = require('./db');

db.query(`INSERT INTO submissions (assignment_id, student_id, grade) VALUES
(1, 2, 'A'),
(2, 2, 'B+')`, (err) => {
  if (err) console.error(err);
  else console.log('Marks inserted');
  db.end();
});
