const db = require('./db');
const fs = require('fs');

console.log('🔧 Setting up admin tables...\n');

async function setupTables() {
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('create_admin_tables.sql', 'utf8');

    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await db.promise().query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Some statements might fail if tables/constraints already exist
          if (error.code === 'ER_TABLE_EXISTS_ERROR' ||
              error.code === 'ER_DUP_FIELDNAME' ||
              error.code === 'ER_DUP_KEYNAME' ||
              error.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
          }
        }
      }
    }

    console.log('\n✅ Admin tables setup completed!');
    console.log('📋 Available tables:');
    console.log('  - admin_documents (for admin document management)');
    console.log('  - notifications (for notification system)');
    console.log('  - notification_recipients (for tracking notification delivery)');

  } catch (error) {
    console.error('❌ Error setting up tables:', error);
  } finally {
    db.end();
  }
}

setupTables();
