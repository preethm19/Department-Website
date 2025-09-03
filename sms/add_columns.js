const db = require('./db');

console.log('🔧 Adding missing original_filename columns...\n');

async function addColumns() {
  try {
    // Add columns to all tables
    console.log('📄 Adding original_filename to documents...');
    await db.promise().query('ALTER TABLE documents ADD COLUMN original_filename VARCHAR(255)');

    console.log('📚 Adding original_filename to materials...');
    await db.promise().query('ALTER TABLE materials ADD COLUMN original_filename VARCHAR(255)');

    console.log('📝 Adding original_filename to submissions...');
    await db.promise().query('ALTER TABLE submissions ADD COLUMN original_filename VARCHAR(255)');

    console.log('📋 Adding original_filename to assignments...');
    await db.promise().query('ALTER TABLE assignments ADD COLUMN original_filename VARCHAR(255)');

    console.log('\n✅ All columns added successfully!');
    console.log('Database is now ready for filename preservation.');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Columns already exist - no action needed');
    } else {
      console.error('❌ Error adding columns:', error);
    }
  } finally {
    db.end();
  }
}

addColumns();
