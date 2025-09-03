const db = require('./db');

db.query(`INSERT INTO notifications (user_id, message, type) VALUES
(2, 'Welcome to MIT AI Department!', 'general'),
(2, 'Assignment deadline approaching', 'reminder')`, (err) => {
  if (err) console.error(err);
  else console.log('Notifications inserted');
  db.end();
});
