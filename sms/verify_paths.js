const db = require('./db');

console.log('🔍 Verifying file paths after fixes...\n');

async function verifyPaths() {
  try {
    // Check documents
    console.log('📄 Documents:');
    const [docs] = await db.promise().query('SELECT title, file_path FROM documents');
    docs.forEach(doc => {
      console.log(`  ${doc.title}: ${doc.file_path}`);
    });

    // Check materials
    console.log('\n📚 Materials:');
    const [mats] = await db.promise().query('SELECT title, file_path FROM materials');
    mats.forEach(mat => {
      console.log(`  ${mat.title}: ${mat.file_path}`);
    });

    // Check submissions
    console.log('\n📝 Submissions:');
    const [subs] = await db.promise().query('SELECT assignment_id, file_path FROM submissions');
    subs.forEach(sub => {
      console.log(`  Assignment ${sub.assignment_id}: ${sub.file_path}`);
    });

    console.log('\n✅ Path verification complete!');
    console.log('All paths should now be in format: /uploads/filename.ext');

  } catch (error) {
    console.error('❌ Error verifying paths:', error);
  } finally {
    db.end();
  }
}

verifyPaths();
