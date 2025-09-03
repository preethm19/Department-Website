const mysql = require('mysql2');
const fs = require('fs');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Empty password as per db.js
  database: 'sms_db'
};

const connection = mysql.createConnection(dbConfig);

console.log('Connecting to database...');

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to database successfully');

  // Read the SQL file
  const sqlFile = fs.readFileSync('drop_old_columns.sql', 'utf8');

  // Split the SQL file into individual statements
  const statements = sqlFile.split(';').filter(stmt => stmt.trim().length > 0);

  console.log(`Executing ${statements.length} SQL statements...`);

  let completed = 0;

  statements.forEach((statement, index) => {
    if (statement.trim()) {
      console.log(`Executing statement ${index + 1}: ${statement.substring(0, 50)}...`);
      connection.query(statement, (err, results) => {
        if (err) {
          console.error(`Error executing statement ${index + 1}:`, err);
        } else {
          console.log(`Statement ${index + 1} executed successfully`);
          if (results && results.length > 0) {
            console.log('Result:', results);
          }
        }

        completed++;
        if (completed === statements.length) {
          console.log('All statements executed. Closing connection...');
          connection.end();
          console.log('Old columns successfully dropped from results table!');
        }
      });
    } else {
      completed++;
    }
  });
});
