-- Create admin_documents table
CREATE TABLE IF NOT EXISTS admin_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sender_id INT NOT NULL,
  recipient_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create notification_recipients table
CREATE TABLE IF NOT EXISTS notification_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notification_id INT NOT NULL,
  user_id INT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_notification_user (notification_id, user_id)
);

-- Create document_recipients table
CREATE TABLE IF NOT EXISTS document_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  user_id INT NOT NULL,
  downloaded_at TIMESTAMP NULL,
  FOREIGN KEY (document_id) REFERENCES admin_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_document_user (document_id, user_id)
);

-- Update existing notifications table structure if needed
-- (This handles the case where notifications table might exist but with different structure)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS sender_id INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key if it doesn't exist
SET @constraint_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND TABLE_NAME = 'notifications'
  AND CONSTRAINT_NAME = 'notifications_ibfk_1'
);

SET @sql = IF(@constraint_exists = 0,
  'ALTER TABLE notifications ADD CONSTRAINT notifications_ibfk_1 FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT "Foreign key already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
