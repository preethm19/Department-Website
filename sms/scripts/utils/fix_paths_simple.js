const db = require('./db');

console.log('🔧 Simple file path fixes...\n');

async function fixPaths() {
  try {
    // Fix specific problematic entries
    console.log('📄 Fixing documents...');

    // Fix backslash paths
    await db.promise().query(`
      UPDATE documents
      SET file_path = '/uploads/3073f165352ba691704d9aa78429bb0b'
      WHERE file_path = 'uploads\\\\3073f165352ba691704d9aa78429bb0b'
    `);

    await db.promise().query(`
      UPDATE documents
      SET file_path = '/uploads/4de07267fcdbd7d9e1a746deda3e03fe'
      WHERE file_path = 'uploads\\\\4de07267fcdbd7d9e1a746deda3e03fe'
    `);

    // Fix paths without leading slash
    await db.promise().query(`
      UPDATE documents
      SET file_path = '/uploads/4f194f5915caeab1bf7b04efc6a771c6'
      WHERE file_path = 'uploads/4f194f5915caeab1bf7b04efc6a771c6'
    `);

    console.log('✅ Documents fixed');

    // Verify the fixes
    console.log('\n🔍 Verification:');
    const [docs] = await db.promise().query('SELECT title, file_path FROM documents');
    docs.forEach(doc => {
      console.log(`  ${doc.title}: ${doc.file_path}`);
    });

    console.log('\n🎉 Path fixes complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.end();
  }
}

fixPaths();
