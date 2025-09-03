const mysql = require('mysql2');
const fs = require('fs');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Add your MySQL password here
  database: 'sms_db',
  multipleStatements: true
};

const connection = mysql.createConnection(dbConfig);

console.log('🔄 Setting up Results table with IA support...');

// Drop existing table if it exists
const dropTableSQL = 'DROP TABLE IF EXISTS results;';

// Read the SQL file
const sqlContent = fs.readFileSync('create_results_table.sql', 'utf8');

// Combine drop and create statements
const fullSQL = dropTableSQL + '\n\n' + sqlContent;

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  console.log('✅ Connected to MySQL database');

  // Execute the SQL commands
  connection.query(fullSQL, (err, results) => {
    if (err) {
      console.error('❌ Error executing SQL:', err);
      connection.end();
      process.exit(1);
    }

    console.log('✅ Results table created successfully!');
    console.log('📊 Table structure:');
    console.log(results);

    // Verify the table was created
    connection.query('DESCRIBE results', (err, results) => {
      if (err) {
        console.error('❌ Error verifying table:', err);
      } else {
        console.log('✅ Table verification:');
        console.table(results);
      }

      connection.end();
      console.log('🎉 Setup complete! You can now use the Upload Results feature.');
    });
  });
});
