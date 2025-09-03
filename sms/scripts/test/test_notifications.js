const db = require('./db');

console.log('🔍 Testing notification system...\n');

// Check if there are students in the database
db.query('SELECT COUNT(*) as count FROM users WHERE role = "student"', (err, results) => {
  if (err) {
    console.error('❌ Error checking students:', err);
    return;
  }

  const studentCount = results[0].count;
  console.log(`👥 Students in database: ${studentCount}`);

  if (studentCount === 0) {
    console.log('⚠️  No students found! This might be why notifications aren\'t showing.');
    console.log('💡 Try adding some students first using the bulk import feature.');
    db.end();
    return;
  }

  // Check admin notifications
  db.query('SELECT COUNT(*) as count FROM admin_notifications', (err, results) => {
    if (err) {
      console.error('❌ Error checking admin notifications:', err);
      return;
    }

    const notificationCount = results[0].count;
    console.log(`📢 Admin notifications: ${notificationCount}`);

    // Check notification recipients
    db.query('SELECT COUNT(*) as count FROM admin_notification_recipients', (err, results) => {
      if (err) {
        console.error('❌ Error checking recipients:', err);
        return;
      }

      const recipientCount = results[0].count;
      console.log(`👤 Notification recipients: ${recipientCount}`);

      console.log('\n📊 Summary:');
      console.log(`- Students: ${studentCount}`);
      console.log(`- Notifications: ${notificationCount}`);
      console.log(`- Recipients: ${recipientCount}`);

      if (notificationCount > 0 && recipientCount > 0) {
        console.log('✅ Notification system appears to be working!');
        console.log('💡 If notifications still don\'t show, check:');
        console.log('   1. Student login credentials');
        console.log('   2. Browser console for JavaScript errors');
        console.log('   3. Network tab for failed API calls');
      } else {
        console.log('⚠️  No notifications or recipients found.');
        console.log('💡 Try sending a notification from admin panel first.');
      }

      db.end();
    });
  });
});
