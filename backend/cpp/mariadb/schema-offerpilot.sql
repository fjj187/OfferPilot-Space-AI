CREATE DATABASE IF NOT EXISTS offerpilot
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE offerpilot;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(128) NOT NULL,
  salt VARCHAR(128) NOT NULL,
  display_name VARCHAR(128) NOT NULL,
  role VARCHAR(32) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  token VARCHAR(128) NOT NULL,
  user_id BIGINT NOT NULL,
  username VARCHAR(64) NOT NULL,
  role VARCHAR(32) NOT NULL,
  display_name VARCHAR(128) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  last_active_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_auth_sessions_token (token),
  KEY idx_auth_sessions_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS interview_sessions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  session_id VARCHAR(128) NOT NULL,
  thread_id VARCHAR(128) NOT NULL,
  topic VARCHAR(128) NOT NULL,
  question_title VARCHAR(255) NOT NULL,
  feedback_style VARCHAR(32) NULL,
  message_count INT NOT NULL DEFAULT 0,
  latest_user_message LONGTEXT NULL,
  latest_assistant_message LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_interview_sessions_session_thread (session_id, thread_id),
  KEY idx_interview_sessions_updated_at (updated_at)
);

CREATE TABLE IF NOT EXISTS interview_messages (
  id BIGINT NOT NULL AUTO_INCREMENT,
  session_id VARCHAR(128) NOT NULL,
  thread_id VARCHAR(128) NOT NULL,
  message_id VARCHAR(160) NOT NULL,
  role VARCHAR(32) NOT NULL,
  content LONGTEXT NOT NULL,
  format VARCHAR(32) NULL,
  status VARCHAR(32) NULL,
  sequence_no INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_interview_messages_message_id (message_id),
  KEY idx_interview_messages_session_thread_seq (session_id, thread_id, sequence_no)
);

CREATE TABLE IF NOT EXISTS interview_reports (
  id BIGINT NOT NULL AUTO_INCREMENT,
  report_id VARCHAR(128) NOT NULL,
  session_id VARCHAR(128) NOT NULL,
  thread_id VARCHAR(128) NULL,
  topic VARCHAR(128) NOT NULL,
  source VARCHAR(64) NOT NULL,
  model_id VARCHAR(128) NULL,
  source_document_id VARCHAR(128) NULL,
  source_document_name VARCHAR(255) NULL,
  source_document_excerpt LONGTEXT NULL,
  question_title VARCHAR(255) NULL,
  summary_headline VARCHAR(255) NOT NULL,
  summary_body LONGTEXT NOT NULL,
  weakness_tags JSON NOT NULL,
  primary_weakness VARCHAR(255) NULL,
  weakness_focus_areas JSON NULL,
  answered_count INT NOT NULL DEFAULT 0,
  total_count INT NOT NULL DEFAULT 0,
  answer_snapshot JSON NULL,
  question_reviews JSON NULL,
  suggested_focus JSON NULL,
  practice_plan JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_interview_reports_report_id (report_id),
  UNIQUE KEY uk_interview_reports_session_id (session_id),
  KEY idx_interview_reports_updated_at (updated_at)
);

CREATE TABLE IF NOT EXISTS interview_stream_checkpoints (
  id BIGINT NOT NULL AUTO_INCREMENT,
  session_id VARCHAR(128) NOT NULL,
  thread_id VARCHAR(128) NOT NULL,
  message_id VARCHAR(160) NOT NULL,
  idempotent_key VARCHAR(160) NOT NULL,
  user_id BIGINT NULL,
  status VARCHAR(32) NOT NULL,
  content LONGTEXT NOT NULL,
  last_sequence INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  error_code VARCHAR(128) NULL,
  error_message LONGTEXT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_stream_checkpoint_key (session_id, thread_id, idempotent_key),
  KEY idx_stream_checkpoint_updated_at (updated_at)
);

INSERT INTO users (username, password_hash, salt, display_name, role, enabled)
VALUES
  ('admin', 'df799f937e13a3d33b99d17701bbe56fd85473a4f036545ce4ab3cfbd7ed38b2', 'offerpilot-admin-salt', 'Admin', 'admin', 1),
  ('user', '449bca6763050d22b706babb740c227ee2181950dbe1aef800681ed60bf00ae5', 'offerpilot-user-salt', 'User', 'user', 1)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  salt = VALUES(salt),
  display_name = VALUES(display_name),
  role = VALUES(role),
  enabled = VALUES(enabled);
