-- ===========================================
-- Admin Notifications Tables Migration
-- ===========================================
-- Creates tables for admin notification system
-- ===========================================

USE sms_db;

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sender_id INT NOT NULL,
  recipient_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_sender_id (sender_id),
  INDEX idx_created_at (created_at),
  
  -- Foreign key
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create admin_notification_recipients table
CREATE TABLE IF NOT EXISTS admin_notification_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notification_id INT NOT NULL,
  user_id INT NOT NULL,
  read_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_notification_id (notification_id),
  INDEX idx_user_id (user_id),
  INDEX idx_read_at (read_at),
  
  -- Foreign keys
  FOREIGN KEY (notification_id) REFERENCES admin_notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Prevent duplicate entries
  UNIQUE KEY unique_notification_user (notification_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'Admin notification tables created successfully!' as status;
