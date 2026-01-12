-- ===========================================
-- Token Blacklist Migration
-- ===========================================
-- This migration adds a token_blacklist table
-- to persist invalidated tokens across server restarts
-- ===========================================

USE sms_db;

-- Create token_blacklist table
CREATE TABLE IF NOT EXISTS token_blacklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(500) NOT NULL,
  user_id INT,
  blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  reason VARCHAR(100) DEFAULT 'logout',
  
  -- Indexes for performance
  INDEX idx_token (token(255)),
  INDEX idx_expires_at (expires_at),
  INDEX idx_user_id (user_id),
  
  -- Foreign key to users table
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add cleanup event to automatically remove expired tokens
-- This runs daily at 2 AM to clean up old blacklisted tokens
DROP EVENT IF EXISTS cleanup_expired_tokens;

CREATE EVENT cleanup_expired_tokens
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO
  DELETE FROM token_blacklist WHERE expires_at < NOW();

-- Verify table creation
DESCRIBE token_blacklist;

SELECT 'Token blacklist table created successfully!' as status;
