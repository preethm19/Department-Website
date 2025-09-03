const db = require('./db');

console.log('Checking users in database...\n');

db.query('SELECT id, name, email, usn, role, semester FROM users ORDER BY role, name', (err, results) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Current users in database:');
    console.log('=====================================');

    results.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`USN: ${user.usn || 'N/A'}`);
      console.log(`Role: ${user.role}`);
      console.log(`Semester: ${user.semester || 'N/A'}`);
      console.log('-------------------------------------');
    });

    const admins = results.filter(u => u.role === 'admin');
    const students = results.filter(u => u.role === 'student');

    console.log(`\nSummary:`);
    console.log(`Total Users: ${results.length}`);
    console.log(`Admins: ${admins.length}`);
    console.log(`Students: ${students.length}`);
  }

  db.end();
});
