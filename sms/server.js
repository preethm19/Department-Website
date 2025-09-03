const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const db = require('./db');

const upload = multer({ dest: 'uploads/' });

const app = express();

// CORS configuration for cross-origin requests from main website
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests from the main website (same domain)
        const allowedOrigins = [
            'http://localhost:3000',    // SMS server
            'http://localhost:8080',    // Main website (adjust port as needed)
            'http://127.0.0.1:3000',    // Alternative localhost
            'http://127.0.0.1:8080'     // Alternative localhost
        ];

        // Allow requests with no origin (mobile apps, etc.)
        if (!origin || allowedOrigins.some(url => origin.startsWith(url.split(':')[1]))) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all for development - restrict in production
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// Serve static files FIRST (before authentication middleware)
app.use(express.static('public'));
app.use('/images', express.static('public/images'));

// Enhanced cache control middleware for sensitive pages
app.use('/student/', (req, res, next) => {
  // Comprehensive cache prevention headers
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use('/admin/', (req, res, next) => {
  // Comprehensive cache prevention headers
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Authentication middleware for protected routes (excluding static files)
const requireAuth = (req, res, next) => {
  // Skip authentication for static files (.html, .css, .js, .png, etc.)
  if (req.path.match(/\.(html|css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    return next();
  }

  const token = req.header('Authorization');

  // If no token, redirect to main website immediately
  if (!token) {
    console.log('No token found, redirecting to main website');
    return res.redirect('http://localhost:8080/');
  }

  // Check if token is blacklisted
  if (tokenBlacklist.has(token)) {
    console.log('Token blacklisted, redirecting to main website');
    return res.redirect('http://localhost:8080/');
  }

  // Verify token validity
  try {
    const verified = jwt.verify(token, 'secret_key');
    req.user = verified;
    next();
  } catch (err) {
    console.log('Invalid token, redirecting to main website');
    return res.redirect('http://localhost:8080/');
  }
};

// Apply authentication to protected routes
app.use('/student/', requireAuth);
app.use('/admin/', requireAuth);

// Token blacklist for logout
const tokenBlacklist = new Set();

// Basic route
app.get('/', (req, res) => {
  res.send('Student Management System API');
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  // Check if token is blacklisted
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Token has been invalidated' });
  }

  try {
    const verified = jwt.verify(token, 'secret_key');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Enhanced logout endpoint - completely destroy session
app.post('/logout', (req, res) => {
  const token = req.header('Authorization');

  if (token) {
    // Add token to blacklist to prevent reuse
    tokenBlacklist.add(token);
    console.log('Token added to blacklist for logout');

    // Clear any server-side session data if it exists
    // In a production environment, you might also:
    // - Clear session cookies
    // - Invalidate refresh tokens
    // - Log the logout event for security auditing
  }

  // Send comprehensive logout response
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  res.json({
    message: 'Logged out successfully',
    timestamp: new Date().toISOString(),
    redirect: 'http://localhost:8080/'
  });
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE (role = "student" AND usn = ?) OR (role = "admin" AND email = ?)', [username, username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = results[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, 'secret_key', { expiresIn: '1h' });
    res.json({ token, role: user.role });
  });
});

// Get user profile
app.get('/profile', authenticate, (req, res) => {
  db.query('SELECT name, usn, semester, phone, email, dob FROM users WHERE id = ?', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(results[0]);
  });
});

// Get student subjects (automatic based on semester)
app.get('/subjects', authenticate, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });
  db.query('SELECT s.* FROM subjects s WHERE s.semester = (SELECT semester FROM users WHERE id = ?)', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Get student assignments (automatic based on semester)
app.get('/assignments', authenticate, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });
  db.query(`
    SELECT a.*, s.name as subject_name, s.subject_code, s.semester
    FROM assignments a
    JOIN subjects s ON a.subject_id = s.id
    WHERE s.semester = (SELECT semester FROM users WHERE id = ?)
    ORDER BY a.due_date ASC
  `, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Get student attendance
app.get('/attendance', authenticate, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });
  db.query(`
    SELECT
      a.date,
      a.status,
      s.name as subject_name,
      s.subject_code,
      u.name as student_name,
      u.usn as student_usn
    FROM attendance a
    JOIN subjects s ON a.subject_id = s.id
    JOIN users u ON a.student_id = u.id
    WHERE a.student_id = ?
    ORDER BY a.date DESC
  `, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Get student results (using simplified results table with subject_code and student_usn)
app.get('/marks', authenticate, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Access denied' });
  db.query(`
    SELECT
      r.ia1_marks,
      r.ia2_marks,
      r.ia3_marks,
      s.name as subject_name,
      r.subject_code,
      s.semester,
      r.uploaded_at,
      u.name as uploaded_by_name
    FROM results r
    JOIN subjects s ON r.subject_code = s.subject_code
    LEFT JOIN users u ON r.uploaded_by = u.id
    WHERE r.student_usn = (SELECT usn FROM users WHERE id = ?) AND r.semester = (SELECT semester FROM users WHERE id = ?)
    ORDER BY r.uploaded_at DESC
  `, [req.user.id, req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Get notifications (both student and admin notifications)
app.get('/notifications', authenticate, (req, res) => {
  // Get student notifications (original system)
  const studentNotificationsQuery = 'SELECT *, "student" as source FROM notifications WHERE user_id = ? ORDER BY created_at DESC';

  // Get admin notifications for this user
  const adminNotificationsQuery = `
    SELECT n.*, "admin" as source, u.name as sender_name
    FROM admin_notifications n
    JOIN admin_notification_recipients nr ON n.id = nr.notification_id
    LEFT JOIN users u ON n.sender_id = u.id
    WHERE nr.user_id = ?
    ORDER BY n.created_at DESC
  `;

  // Execute both queries
  db.query(studentNotificationsQuery, [req.user.id], (err, studentNotifications) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    db.query(adminNotificationsQuery, [req.user.id], (err, adminNotifications) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      // Combine and sort all notifications
      const allNotifications = [...studentNotifications, ...adminNotifications]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.json(allNotifications);
    });
  });
});

// Get all subjects for admin
app.get('/admin/classes', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const semester = req.query.semester || 'all';
  let query = 'SELECT * FROM subjects';
  let params = [];
  if (semester !== 'all') {
    query += ' WHERE semester = ?';
    params = [semester];
  }
  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Create new subject
app.post('/admin/classes', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const { name, description, subjectCode, semester } = req.body;

  if (!name || !description || !subjectCode || !semester) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.query('INSERT INTO subjects (name, description, subject_code, department, semester) VALUES (?, ?, ?, ?, ?)',
    [name, description, subjectCode, 'AI', semester], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Subject created successfully', id: result.insertId });
  });
});

// Update subject
app.put('/admin/classes/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const { id } = req.params;
  const { name, description, subjectCode, semester } = req.body;

  if (!name || !description || !subjectCode || !semester) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.query('UPDATE subjects SET name = ?, description = ?, subject_code = ?, semester = ? WHERE id = ?',
    [name, description, subjectCode, semester, id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.json({ message: 'Subject updated successfully' });
  });
});

// Delete subject with cascade
app.delete('/admin/classes/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const { id } = req.params;

  // Use transaction for cascade delete
  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Step 1: Delete submissions (child of assignments)
    db.query('DELETE s FROM submissions s INNER JOIN assignments a ON s.assignment_id = a.id WHERE a.subject_id = ?',
      [id], (err) => {
      if (err) {
        console.error('Error deleting submissions:', err);
        return db.rollback(() => res.status(500).json({ error: 'Failed to delete submissions' }));
      }

      // Step 2: Delete assignments
      db.query('DELETE FROM assignments WHERE subject_id = ?', [id], (err) => {
        if (err) {
          console.error('Error deleting assignments:', err);
          return db.rollback(() => res.status(500).json({ error: 'Failed to delete assignments' }));
        }

        // Step 3: Delete materials
        db.query('DELETE FROM materials WHERE subject_id = ?', [id], (err) => {
          if (err) {
            console.error('Error deleting materials:', err);
            return db.rollback(() => res.status(500).json({ error: 'Failed to delete materials' }));
          }

          // Step 4: Delete enrollments
          db.query('DELETE FROM enrollments WHERE subject_id = ?', [id], (err) => {
            if (err) {
              console.error('Error deleting enrollments:', err);
              return db.rollback(() => res.status(500).json({ error: 'Failed to delete enrollments' }));
            }

            // Step 5: Delete attendance records
            db.query('DELETE FROM attendance WHERE subject_id = ?', [id], (err) => {
              if (err) {
                console.error('Error deleting attendance:', err);
                return db.rollback(() => res.status(500).json({ error: 'Failed to delete attendance records' }));
              }

              // Step 6: Finally delete the subject
              db.query('DELETE FROM subjects WHERE id = ?', [id], (err, result) => {
                if (err) {
                  console.error('Error deleting subject:', err);
                  return db.rollback(() => res.status(500).json({ error: 'Failed to delete subject' }));
                }

                if (result.affectedRows === 0) {
                  return db.rollback(() => res.status(404).json({ error: 'Subject not found' }));
                }

                // Commit the transaction
                db.commit((err) => {
                  if (err) {
                    console.error('Commit error:', err);
                    return db.rollback(() => res.status(500).json({ error: 'Failed to commit changes' }));
                  }

                  res.json({
                    message: 'Subject and all related data deleted successfully',
                    deleted: {
                      subject: 1,
                      assignments: 'and related submissions',
                      materials: 'files',
                      enrollments: 'student enrollments',
                      attendance: 'records'
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// Get existing results for editing
app.get('/admin/existing-results', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const { subjectCode, semester, iaType } = req.query;

  if (!subjectCode || !semester || !iaType) {
    return res.status(400).json({ error: 'Subject code, semester, and IA type are required' });
  }

  if (!['ia1', 'ia2', 'ia3'].includes(iaType)) {
    return res.status(400).json({ error: 'Invalid IA type. Must be: ia1, ia2, or ia3' });
  }

  // Query existing results for the specified subject, semester, and IA type
  const query = `
    SELECT
      r.student_usn,
      r.ia1_marks,
      r.ia2_marks,
      r.ia3_marks,
      u.name as student_name,
      u.usn
    FROM results r
    JOIN users u ON r.student_usn = u.usn
    WHERE r.subject_code = ? AND r.semester = ?
  `;

  db.query(query, [subjectCode, semester], (err, results) => {
    if (err) {
      console.error('Error fetching existing results:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Filter results to only include those with marks for the specified IA type
    const filteredResults = results.filter(result => {
      if (iaType === 'ia1') {
        return result.ia1_marks !== null && result.ia1_marks !== undefined;
      } else if (iaType === 'ia2') {
        return result.ia2_marks !== null && result.ia2_marks !== undefined;
      } else if (iaType === 'ia3') {
        return result.ia3_marks !== null && result.ia3_marks !== undefined;
      }
      return false;
    });

    res.json(filteredResults);
  });
});

// Get all users for admin
app.get('/admin/users', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const semester = req.query.semester;
  const userType = req.query.userType || 'all'; // 'students', 'admins', 'all'

  let query = 'SELECT id, name, email, usn, role, semester, phone, dob FROM users';
  let params = [];

  // Simple filtering logic as requested
  if (userType === 'students') {
    query += ' WHERE role = ?';
    params.push('student');
    // Apply semester filter for students if provided
    if (semester && semester !== 'all') {
      query += ' AND semester = ?';
      params.push(semester);
    }
  } else if (userType === 'admins') {
    query += ' WHERE role = ?';
    params.push('admin');
    // No semester filtering for admins
  } else if (userType === 'all') {
    // Show all users, no filtering
    query += ' WHERE 1=1';
    // No semester filtering for all users
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Get all assignments for admin
app.get('/admin/assignments', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const semester = req.query.semester || 'all';
  let query = 'SELECT a.*, s.name as subject_name, s.subject_code, s.semester FROM assignments a JOIN subjects s ON a.subject_id = s.id';
  let params = [];
  if (semester !== 'all') {
    query += ' WHERE s.semester = ?';
    params = [semester];
  }
  query += ' ORDER BY a.due_date ASC';
  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Get all materials for admin
app.get('/admin/materials', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const semester = req.query.semester || 'all';
  let query = 'SELECT m.*, s.name as subject_name, s.semester FROM materials m JOIN subjects s ON m.subject_id = s.id';
  let params = [];
  if (semester !== 'all') {
    query += ' WHERE s.semester = ?';
    params = [semester];
  }
  query += ' ORDER BY m.uploaded_at DESC';
  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Upload material
app.post('/admin/materials', authenticate, upload.single('file'), (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const { subjectId, title } = req.body;
  // Normalize path to ensure consistency
  const file_path = `/uploads/${req.file.filename}`.replace(/\\/g, '/');
  const original_filename = req.file.originalname;
  db.query('INSERT INTO materials (subject_id, title, file_path, original_filename, uploaded_by) VALUES (?, ?, ?, ?, ?)',
    [subjectId, title, file_path, original_filename, req.user.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Material uploaded successfully', id: result.insertId });
  });
});

// Get students for attendance (automatic based on subject semester)
app.get('/admin/attendance/students', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const { subjectId } = req.query;
  db.query(`
    SELECT u.id, u.name, u.usn
    FROM users u
    JOIN subjects s ON u.semester = s.semester
    WHERE s.id = ? AND u.role = "student"
  `, [subjectId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Get existing attendance records
app.get('/admin/attendance/existing', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const { subjectId, date } = req.query;

  if (!subjectId || !date) {
    return res.status(400).json({ error: 'Subject ID and date are required' });
  }

  db.query('SELECT student_id, status FROM attendance WHERE subject_id = ? AND date = ?',
    [subjectId, date], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Save attendance
app.post('/admin/attendance', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const { subjectId, date, attendance } = req.body;

  // Use transaction to ensure data consistency
  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    let completed = 0;
    const total = attendance.length;

    attendance.forEach(record => {
      db.query('INSERT INTO attendance (subject_id, student_id, date, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = ?',
        [subjectId, record.studentId, date, record.status, record.status], (err) => {
        if (err) {
          db.rollback(() => {
            res.status(500).json({ error: 'Failed to save attendance' });
          });
          return;
        }

        completed++;
        if (completed === total) {
          db.commit((err) => {
            if (err) {
              db.rollback(() => {
                res.status(500).json({ error: 'Failed to save attendance' });
              });
            } else {
              res.json({ message: 'Attendance saved successfully' });
            }
          });
        }
      });
    });
  });
});

// Get assignments for a subject
app.get('/admin/assignments', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const { subjectId } = req.query;
  db.query('SELECT * FROM assignments WHERE subject_id = ?', [subjectId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Get submissions for an assignment
app.get('/admin/submissions', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const { assignmentId } = req.query;
  db.query('SELECT s.*, u.name as student_name, u.usn FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.assignment_id = ?', [assignmentId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Save results (legacy - for assignment submissions)
app.post('/admin/results', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const { results } = req.body;

  // Use transaction to ensure data consistency
  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    let completed = 0;
    const total = results.length;

    results.forEach(result => {
      db.query('UPDATE submissions SET result = ? WHERE id = ?',
        [result.result, result.submissionId], (err) => {
        if (err) {
          db.rollback(() => {
            res.status(500).json({ error: 'Failed to save results' });
          });
          return;
        }

        completed++;
        if (completed === total) {
          db.commit((err) => {
            if (err) {
              db.rollback(() => {
                res.status(500).json({ error: 'Failed to save results' });
              });
            } else {
              res.json({ message: 'Results saved successfully' });
            }
          });
        }
      });
    });
  });
});

// Upload results (using simplified results table with subject_code and student_usn)
app.post('/admin/upload-results', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const { results, iaType } = req.body; // iaType can be 'ia1', 'ia2', 'ia3'

  if (!results || results.length === 0) {
    return res.status(400).json({ error: 'No results provided' });
  }

  if (!iaType || !['ia1', 'ia2', 'ia3'].includes(iaType)) {
    return res.status(400).json({ error: 'Invalid IA type. Must be: ia1, ia2, or ia3' });
  }

  // Use transaction to ensure data consistency
  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    let completed = 0;
    const total = results.length;

    results.forEach(result => {
      const { studentId, subjectCode, marks } = result;

      // Get student USN and semester for the result
      db.query('SELECT usn, semester FROM users WHERE id = ?', [studentId], (err, studentData) => {
        if (err) {
          db.rollback(() => {
            res.status(500).json({ error: 'Failed to get student data' });
          });
          return;
        }

        if (studentData.length === 0) {
          db.rollback(() => {
            res.status(500).json({ error: 'Student not found' });
          });
          return;
        }

        const studentUsn = studentData[0].usn;
        const semester = studentData[0].semester;

        // Build dynamic query based on IA type
        let updateFields = [];
        let insertFields = ['student_usn', 'subject_code', 'semester', 'uploaded_by'];
        let insertValues = [studentUsn, subjectCode, semester, req.user.id];

        if (iaType === 'ia1') {
          insertFields.push('ia1_marks');
          insertValues.push(marks);
          updateFields.push('ia1_marks = VALUES(ia1_marks)');
        } else if (iaType === 'ia2') {
          insertFields.push('ia2_marks');
          insertValues.push(marks);
          updateFields.push('ia2_marks = VALUES(ia2_marks)');
        } else if (iaType === 'ia3') {
          insertFields.push('ia3_marks');
          insertValues.push(marks);
          updateFields.push('ia3_marks = VALUES(ia3_marks)');
        }

        const insertQuery = `INSERT INTO results (${insertFields.join(', ')}) VALUES (${insertValues.map(() => '?').join(', ')})`;
        const updateQuery = `ON DUPLICATE KEY UPDATE ${updateFields.join(', ')}, uploaded_by = VALUES(uploaded_by), uploaded_at = CURRENT_TIMESTAMP`;

        const fullQuery = `${insertQuery} ${updateQuery}`;

        db.query(fullQuery, insertValues, (err) => {
          if (err) {
            console.error('Error saving result:', err);
            db.rollback(() => {
              res.status(500).json({ error: 'Failed to save results' });
            });
            return;
          }

          completed++;
          if (completed === total) {
            db.commit((err) => {
              if (err) {
                console.error('Commit error:', err);
                db.rollback(() => {
                  res.status(500).json({ error: 'Failed to save results' });
                });
              } else {
                res.json({ message: `${iaType.toUpperCase()} results uploaded successfully` });
              }
            });
          }
        });
      });
    });
  });
});

// Get documents (both student-uploaded and admin-sent)
app.get('/documents', authenticate, (req, res) => {
  // Get student-uploaded documents
  const studentDocumentsQuery = 'SELECT *, "student" as source, NULL as sender_name FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC';

  // Get admin-sent documents for this user
  const adminDocumentsQuery = `
    SELECT d.*, "admin" as source, u.name as sender_name
    FROM admin_documents d
    JOIN document_recipients dr ON d.id = dr.document_id
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE dr.user_id = ?
    ORDER BY d.uploaded_at DESC
  `;

  // Execute both queries
  db.query(studentDocumentsQuery, [req.user.id], (err, studentDocuments) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    db.query(adminDocumentsQuery, [req.user.id], (err, adminDocuments) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      // Combine and sort all documents
      const allDocuments = [...studentDocuments, ...adminDocuments]
        .sort((a, b) => new Date(b.uploaded_at || b.created_at) - new Date(a.uploaded_at || a.created_at));

      res.json(allDocuments);
    });
  });
});

// Upload document
app.post('/upload-document', authenticate, upload.single('file'), (req, res) => {
  const { title } = req.body;
  // Normalize path to ensure consistency
  const file_path = `/uploads/${req.file.filename}`.replace(/\\/g, '/');
  const original_filename = req.file.originalname;
  db.query('INSERT INTO documents (user_id, title, file_path, original_filename, type) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, title, file_path, original_filename, req.user.role === 'student' ? 'student' : 'lecturer'], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Document uploaded successfully' });
  });
});

// Create new admin
app.post('/admin/create-admin', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if email already exists
    const [existing] = await db.promise().query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin
    await db.promise().query('INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'admin', 'AI']);

    res.json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Download file with original filename
app.get('/download/:type/:id', authenticate, (req, res) => {
  const { type, id } = req.params;
  let table, idField;

  // Determine table and ID field based on type
  switch (type) {
    case 'document':
      table = 'documents';
      idField = 'id';
      break;
    case 'admin-document':
      // Special case for admin documents - need to check access
      db.query('SELECT d.file_path, d.original_filename FROM admin_documents d JOIN document_recipients dr ON d.id = dr.document_id WHERE d.id = ? AND dr.user_id = ?',
        [id, req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(403).json({ error: 'Access denied' });

        const { file_path, original_filename } = results[0];
        const actualPath = file_path.replace('/uploads/', '');
        const fullPath = require('path').join(__dirname, 'uploads', actualPath);

        res.setHeader('Content-Disposition', `attachment; filename="${original_filename}"`);
        res.sendFile(fullPath, (err) => {
          if (err) {
            console.error('File download error:', err);
            res.status(500).json({ error: 'File download failed' });
          }
        });
      });
      return; // Exit early for admin documents
    case 'material':
      table = 'materials';
      idField = 'id';
      break;
    case 'submission':
      table = 'submissions';
      idField = 'id';
      break;
    case 'assignment':
      table = 'assignments';
      idField = 'id';
      break;
    default:
      return res.status(400).json({ error: 'Invalid file type' });
  }

  // Get file info from database
  db.query(`SELECT file_path, original_filename FROM ${table} WHERE ${idField} = ?`, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'File not found' });

    const { file_path, original_filename } = results[0];

    // Remove the /uploads prefix to get the actual file path
    const actualPath = file_path.replace('/uploads/', '');

    // Set headers for proper download
    res.setHeader('Content-Disposition', `attachment; filename="${original_filename}"`);

    // Send the file
    res.sendFile(actualPath, { root: 'uploads/' }, (err) => {
      if (err) {
        console.error('File download error:', err);
        res.status(500).json({ error: 'File download failed' });
      }
    });
  });
});

// Export users as CSV
app.get('/admin/export-users', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  db.query('SELECT name, usn, email, role, semester, phone, dob FROM users ORDER BY role, semester, name', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    // Create CSV content
    let csvContent = 'Name,USN,Email,Role,Semester,Phone,DOB\n';

    results.forEach(user => {
      const row = [
        user.name,
        user.usn || '',
        user.email,
        user.role,
        user.semester || '',
        user.phone || '',
        user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
      ];
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Current_users.csv"');
    res.send(csvContent);
  });
});

// Delete user
app.delete('/admin/users/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const userId = req.params.id;

  // Prevent admin from deleting themselves
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  db.query('DELETE FROM users WHERE id = ? AND role != ?', [userId, 'admin'], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found or cannot be deleted' });
    }

    res.json({ message: 'User deleted successfully' });
  });
});

// Bulk import students
app.post('/admin/bulk-import', authenticate, upload.single('csvFile'), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const results = [];
  const errors = [];
  const students = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      students.push(data);
    })
    .on('end', async () => {
      for (const student of students) {
        const { Name: name, USN: usn, Email: email, Semester: semester, Phone: phone, DOB: dob } = student;

        // Skip empty rows
        if (!name && !usn && !email) continue;

        // Validation
        if (!name || !usn || !email || !semester) {
          errors.push({ row: students.indexOf(student) + 1, error: 'Missing required fields' });
          continue;
        }

        if (semester < 1 || semester > 8) {
          errors.push({ row: students.indexOf(student) + 1, error: 'Invalid semester (1-8)' });
          continue;
        }

        // Check for duplicates
        try {
          const [existing] = await db.promise().query('SELECT id FROM users WHERE usn = ? OR email = ?', [usn, email]);
          if (existing.length > 0) {
            errors.push({ row: students.indexOf(student) + 1, error: 'Duplicate USN or email' });
            continue;
          }

          // Hash password
          const hashedPassword = await bcrypt.hash('password', 10);

          // Insert student
          await db.promise().query('INSERT INTO users (name, usn, email, password, role, semester, phone, dob, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, usn, email, hashedPassword, 'student', semester, phone || null, dob || null, 'AI']);

          results.push({ name, usn, email, semester });
        } catch (err) {
          errors.push({ row: students.indexOf(student) + 1, error: err.message });
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        message: `Import completed. ${results.length} students imported, ${errors.length} errors.`,
        imported: results.length,
        errors: errors.length,
        details: { imported: results, errors }
      });
    });
});

// Admin document management endpoints
app.post('/admin/send-document', authenticate, upload.single('file'), (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const { title, recipientType, specificUser, semester } = req.body;

  if (!title || !recipientType) {
    return res.status(400).json({ error: 'Title and recipient type are required' });
  }

  // Normalize path to ensure consistency
  const file_path = `/uploads/${req.file.filename}`.replace(/\\/g, '/');
  const original_filename = req.file.originalname;

  // Build recipient query based on type
  let recipientQuery = '';
  let recipientParams = [];
  let recipientTypeLabel = recipientType;

  switch (recipientType) {
    case 'all':
      recipientQuery = 'SELECT id FROM users';
      break;
    case 'students':
      if (semester && semester !== 'all') {
        recipientQuery = 'SELECT id FROM users WHERE role = ? AND semester = ?';
        recipientParams = ['student', semester];
        recipientTypeLabel = `Students (Semester ${semester})`;
      } else {
        recipientQuery = 'SELECT id FROM users WHERE role = ?';
        recipientParams = ['student'];
        recipientTypeLabel = 'All Students';
      }
      break;
    case 'admins':
      recipientQuery = 'SELECT id FROM users WHERE role = ?';
      recipientParams = ['admin'];
      recipientTypeLabel = 'All Admins';
      break;
    case 'specific':
      if (!specificUser) {
        return res.status(400).json({ error: 'Specific user ID is required' });
      }
      recipientQuery = 'SELECT id FROM users WHERE id = ?';
      recipientParams = [specificUser];
      recipientTypeLabel = 'Specific User';
      break;
    default:
      return res.status(400).json({ error: 'Invalid recipient type' });
  }

  // Get recipient IDs
  db.query(recipientQuery, recipientParams, (err, recipients) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No recipients found for the selected criteria' });
    }

    // Insert document record
    db.query('INSERT INTO admin_documents (title, recipient_type, file_path, original_filename, uploaded_by) VALUES (?, ?, ?, ?, ?)',
      [title, recipientTypeLabel, file_path, original_filename, req.user.id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      const documentId = result.insertId;

      // Insert document recipients
      const recipientValues = recipients.map(recipient => [documentId, recipient.id]);
      const placeholders = recipientValues.map(() => '(?, ?)').join(', ');
      const flattenedValues = recipientValues.flat();

      db.query(`INSERT INTO document_recipients (document_id, user_id) VALUES ${placeholders}`,
        flattenedValues, (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        res.json({
          message: `Document sent to ${recipients.length} recipient(s)`,
          recipients: recipients.length
        });
      });
    });
  });
});

app.get('/admin/documents', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const { type } = req.query;
  let query = 'SELECT * FROM admin_documents ORDER BY uploaded_at DESC';
  let params = [];

  if (type) {
    query = 'SELECT * FROM admin_documents WHERE type = ? ORDER BY uploaded_at DESC';
    params = [type];
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

app.delete('/admin/documents/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const docId = req.params.id;

  // First get the file path to delete the actual file
  db.query('SELECT file_path FROM admin_documents WHERE id = ?', [docId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (results.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = results[0].file_path;

    // Delete from database
    db.query('DELETE FROM admin_documents WHERE id = ?', [docId], (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete the actual file
      const fs = require('fs');
      const path = require('path');
      const fullPath = path.join(__dirname, filePath.replace('/uploads/', 'uploads/'));

      fs.unlink(fullPath, (err) => {
        if (err) console.error('Error deleting file:', err);
        // Don't return error for file deletion failure
      });

      res.json({ message: 'Document deleted successfully' });
    });
  });
});

// Download admin document (for students)
app.get('/download/admin-document/:id', authenticate, (req, res) => {
  const { id } = req.params;

  console.log('Download request for document ID:', id, 'by user ID:', req.user.id);

  // Check if user has access to this document
  db.query('SELECT d.file_path, d.original_filename FROM admin_documents d JOIN document_recipients dr ON d.id = dr.document_id WHERE d.id = ? AND dr.user_id = ?',
    [id, req.user.id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      console.log('Access denied - no matching document found for user', req.user.id);
      return res.status(403).json({ error: 'Access denied' });
    }

    const { file_path, original_filename } = results[0];
    console.log('File path from DB:', file_path);
    console.log('Original filename:', original_filename);

    // Remove the /uploads prefix to get the actual file path
    const actualPath = file_path.replace('/uploads/', '');
    const fullPath = require('path').join(__dirname, 'uploads', actualPath);

    console.log('Full file path:', fullPath);
    console.log('File exists:', require('fs').existsSync(fullPath));

    // Set headers for proper download
    res.setHeader('Content-Disposition', `attachment; filename="${original_filename}"`);

    // Send the file
    res.sendFile(fullPath, (err) => {
      if (err) {
        console.error('File download error:', err);
        res.status(500).json({ error: 'File download failed' });
      }
    });
  });
});

// Upload attendance proof
app.post('/upload-attendance-proof', authenticate, upload.single('file'), (req, res) => {
  const { title, proofDate, subjectName } = req.body;

  if (!title || !proofDate || !subjectName) {
    return res.status(400).json({ error: 'Title, proof date, and subject name are required' });
  }

  // Validate file
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Check file size (max 5MB)
  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'File size must be less than 5MB' });
  }

  // Normalize path to ensure consistency
  const file_path = `/uploads/${req.file.filename}`.replace(/\\/g, '/');
  const original_filename = req.file.originalname;

  // Insert attendance proof record
  db.query('INSERT INTO documents (user_id, title, file_path, original_filename, type) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, title, file_path, original_filename, 'attendance_proof'], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      message: 'Attendance proof uploaded successfully',
      documentId: result.insertId,
      fileName: original_filename
    });
  });
});

// Send notification endpoint
app.post('/admin/send-notification', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const { title, message, recipientType, specificUser, semester } = req.body;

  if (!title || !message || !recipientType) {
    return res.status(400).json({ error: 'Title, message, and recipient type are required' });
  }

  // Build recipient query based on type
  let recipientQuery = '';
  let recipientParams = [];
  let recipientTypeLabel = recipientType;

  switch (recipientType) {
    case 'all':
      recipientQuery = 'SELECT id FROM users';
      break;
    case 'students':
      if (semester && semester !== 'all') {
        recipientQuery = 'SELECT id FROM users WHERE role = ? AND semester = ?';
        recipientParams = ['student', semester];
        recipientTypeLabel = `Students (Semester ${semester})`;
      } else {
        recipientQuery = 'SELECT id FROM users WHERE role = ?';
        recipientParams = ['student'];
        recipientTypeLabel = 'All Students';
      }
      break;
    case 'admins':
      recipientQuery = 'SELECT id FROM users WHERE role = ?';
      recipientParams = ['admin'];
      recipientTypeLabel = 'All Admins';
      break;
    case 'specific':
      if (!specificUser) {
        return res.status(400).json({ error: 'Specific user ID is required' });
      }
      recipientQuery = 'SELECT id FROM users WHERE id = ?';
      recipientParams = [specificUser];
      recipientTypeLabel = 'Specific User';
      break;
    default:
      return res.status(400).json({ error: 'Invalid recipient type' });
  }

  // Get recipient IDs
  db.query(recipientQuery, recipientParams, (err, recipients) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No recipients found for the selected criteria' });
    }

    // Insert notification record
    db.query('INSERT INTO admin_notifications (title, message, sender_id, recipient_type, created_at) VALUES (?, ?, ?, ?, NOW())',
      [title, message, req.user.id, recipientTypeLabel], (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      const notificationId = result.insertId;

      // Insert notification recipients
      const recipientValues = recipients.map(recipient => [notificationId, recipient.id]);
      const placeholders = recipientValues.map(() => '(?, ?)').join(', ');
      const flattenedValues = recipientValues.flat();

      db.query(`INSERT INTO admin_notification_recipients (notification_id, user_id) VALUES ${placeholders}`,
        flattenedValues, (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        res.json({
          message: `Notification sent to ${recipients.length} recipient(s)`,
          recipients: recipients.length
        });
      });
    });
  });
});

// Get admin notifications history
app.get('/admin/notifications', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  db.query(`
    SELECT n.*, u.name as sender_name
    FROM admin_notifications n
    LEFT JOIN users u ON n.sender_id = u.id
    WHERE n.sender_id = ?
    ORDER BY n.created_at DESC
  `, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Update notification
app.put('/admin/notifications/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const { id } = req.params;
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  db.query('UPDATE admin_notifications SET title = ?, message = ? WHERE id = ? AND sender_id = ?',
    [title, message, id, req.user.id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found or access denied' });
    }

    res.json({ message: 'Notification updated successfully' });
  });
});

// Delete notification
app.delete('/admin/notifications/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const { id } = req.params;

  // Use transaction to ensure data consistency
  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // First delete notification recipients
    db.query('DELETE FROM admin_notification_recipients WHERE notification_id = ?',
      [id], (err) => {
      if (err) {
        console.error('Error deleting notification recipients:', err);
        return db.rollback(() => res.status(500).json({ error: 'Failed to delete notification recipients' }));
      }

      // Then delete the notification itself
      db.query('DELETE FROM admin_notifications WHERE id = ? AND sender_id = ?',
        [id, req.user.id], (err, result) => {
        if (err) {
          console.error('Error deleting notification:', err);
          return db.rollback(() => res.status(500).json({ error: 'Failed to delete notification' }));
        }

        if (result.affectedRows === 0) {
          return db.rollback(() => res.status(404).json({ error: 'Notification not found or access denied' }));
        }

        // Commit the transaction
        db.commit((err) => {
          if (err) {
            console.error('Commit error:', err);
            return db.rollback(() => res.status(500).json({ error: 'Failed to commit changes' }));
          }

          res.json({ message: 'Notification deleted successfully' });
        });
      });
    });
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
