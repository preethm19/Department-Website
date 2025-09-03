const db = require('./db');
const bcrypt = require('bcrypt');

async function insertSample() {
  const hashed = await bcrypt.hash('password', 10);
  db.query(`INSERT INTO users (name, email, usn, password, role, semester, phone, dob, department) VALUES
  ('John Doe', 'admin@mit.edu', NULL, ?, 'admin', NULL, '1234567890', '1990-01-01', 'AI'),
  ('Jane Smith', 'jane@mit.edu', 'MITAI001', ?, 'student', 3, '9876543210', '2000-05-15', 'AI')`, [hashed, hashed], (err) => {
    if (err) console.error(err);
    else console.log('Sample users inserted');
    db.end();
  });
}

insertSample();
