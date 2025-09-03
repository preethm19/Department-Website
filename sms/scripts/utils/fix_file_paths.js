const db = require('./db');

console.log('🔧 Fixing inconsistent file paths in database...\n');

async function fixFilePaths() {
  try {
    // Fix documents table
    console.log('📄 Fixing documents table...');
    await db.promise().query(`
      UPDATE documents
      SET file_path = CONCAT('/uploads/', SUBSTRING_INDEX(file_path, '\\\\', -1))
      WHERE file_path LIKE 'uploads\\\\%'
    `);

    await db.promise().query(`
      UPDATE documents
      SET file_path = CONCAT('/uploads/', file_path)
      WHERE file_path NOT LIKE '/uploads/%' AND file_path NOT LIKE 'uploads%'
    `);

    // Fix materials table
    console.log('📚 Fixing materials table...');
    await db.promise().query(`
      UPDATE materials
      SET file_path = CONCAT('/uploads/', SUBSTRING_INDEX(file_path, '\\\\', -1))
      WHERE file_path LIKE 'uploads\\\\%'
    `);

    await db.promise().query(`
      UPDATE materials
      SET file_path = CONCAT('/uploads/', file_path)
      WHERE file_path NOT LIKE '/uploads/%' AND file_path NOT LIKE 'uploads%'
    `);

    // Fix submissions table
    console.log('📝 Fixing submissions table...');
    await db.promise().query(`
      UPDATE submissions
      SET file_path = CONCAT('/uploads/', SUBSTRING_INDEX(file_path, '\\\\', -1))
      WHERE file_path LIKE 'uploads\\\\%'
    `);

    await db.promise().query(`
      UPDATE submissions
      SET file_path = CONCAT('/uploads/', file_path)
      WHERE file_path NOT LIKE '/uploads/%' AND file_path NOT LIKE 'uploads%'
    `);

    // Verify fixes
    console.log('\n✅ Verifying fixes...');

    const [docs] = await db.promise().query('SELECT COUNT(*) as count FROM documents WHERE file_path LIKE "/uploads/%"');
    const [mats] = await db.promise().query('SELECT COUNT(*) as count FROM materials WHERE file_path LIKE "/uploads/%"');
    const [subs] = await db.promise().query('SELECT COUNT(*) as count FROM submissions WHERE file_path LIKE "/uploads/%"');

    console.log(`📄 Documents with correct paths: ${docs[0].count}`);
    console.log(`📚 Materials with correct paths: ${mats[0].count}`);
    console.log(`📝 Submissions with correct paths: ${subs[0].count}`);

    // Show sample of fixed paths
    console.log('\n📋 Sample fixed paths:');
    const [sample] = await db.promise().query(`
      SELECT 'documents' as table_name, title, file_path FROM documents LIMIT 2
      UNION ALL
      SELECT 'materials' as table_name, title, file_path FROM materials LIMIT 2
      UNION ALL
      SELECT 'submissions' as table_name, CONCAT('Submission for assignment ', assignment_id) as title, file_path FROM submissions LIMIT 2
    `);

    sample.forEach(row => {
      console.log(`${row.table_name}: ${row.title} → ${row.file_path}`);
    });

    console.log('\n🎉 File path standardization complete!');
    console.log('All paths should now be in format: /uploads/filename.ext');

  } catch (error) {
    console.error('❌ Error fixing file paths:', error);
  } finally {
    db.end();
  }
}

fixFilePaths();
