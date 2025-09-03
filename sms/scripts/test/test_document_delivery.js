const db = require('./db');

console.log('🔍 Testing document delivery system...\n');

// Get all students
db.query('SELECT id, name, usn FROM users WHERE role = "student"', (err, students) => {
  if (err) {
    console.error('❌ Error getting students:', err);
    return;
  }

  console.log(`👥 Found ${students.length} students:`);
  students.forEach(student => {
    console.log(`  - ${student.name} (${student.usn}) - ID: ${student.id}`);
  });

  console.log('\n📄 Testing document retrieval for each student...\n');

  // Test document retrieval for each student
  let completed = 0;
  const total = students.length;

  students.forEach(student => {
    // Simulate the documents query for this student
    const studentDocumentsQuery = 'SELECT *, "student" as source, NULL as sender_name FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC';
    const adminDocumentsQuery = `
      SELECT d.*, "admin" as source, u.name as sender_name
      FROM admin_documents d
      JOIN document_recipients dr ON d.id = dr.document_id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE dr.user_id = ?
      ORDER BY d.uploaded_at DESC
    `;

    // Get student documents
    db.query(studentDocumentsQuery, [student.id], (err, studentDocs) => {
      if (err) {
        console.error(`❌ Error getting student docs for ${student.name}:`, err);
        return;
      }

      // Get admin documents
      db.query(adminDocumentsQuery, [student.id], (err, adminDocs) => {
        if (err) {
          console.error(`❌ Error getting admin docs for ${student.name}:`, err);
          return;
        }

        const allDocuments = [...studentDocs, ...adminDocs]
          .sort((a, b) => new Date(b.uploaded_at || b.created_at) - new Date(a.uploaded_at || a.created_at));

        console.log(`📋 ${student.name} (${student.usn}):`);
        console.log(`   - Total documents: ${allDocuments.length}`);

        if (allDocuments.length > 0) {
          allDocuments.forEach(doc => {
            const source = doc.source === 'admin' ? '📄 Admin' : '📝 Student';
            console.log(`   - ${source}: ${doc.title} (${doc.original_filename})`);
          });
        } else {
          console.log(`   - No documents found`);
        }

        completed++;
        if (completed === total) {
          console.log('\n✅ Document delivery test completed!');
          console.log('\n💡 If a student shows "No documents found":');
          console.log('   1. Make sure they are logged in with correct credentials');
          console.log('   2. Check browser console for JavaScript errors');
          console.log('   3. Verify the student ID matches the document_recipients table');
          db.end();
        }
      });
    });
  });
});
