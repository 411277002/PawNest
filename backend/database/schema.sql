CREATE DATABASE IF NOT EXISTS pawnest
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pawnest;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE,
  username VARCHAR(60) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  role ENUM('customer', 'admin', 'staff', 'groomer', 'reception') NOT NULL DEFAULT 'customer',
  store_id INT NULL,
  membership_tier ENUM('general', 'vip') NOT NULL DEFAULT 'general',
  membership_points INT NOT NULL DEFAULT 0,
  vip_expires_at DATE NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_store (store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('dog', 'cat', 'other') NOT NULL DEFAULT 'dog',
  breed VARCHAR(100),
  gender VARCHAR(20),
  age INT,
  weight DECIMAL(5,2),
  note TEXT,
  photo_url LONGTEXT,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_pet_user_name (user_id, name),
  CONSTRAINT fk_pets_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  area VARCHAR(60),
  address VARCHAR(255),
  phone VARCHAR(30),
  open_time TIME,
  close_time TIME,
  image_url LONGTEXT,
  description TEXT,
  dog_room_capacity INT NOT NULL DEFAULT 0,
  cat_room_capacity INT NOT NULL DEFAULT 0,
  daycare_capacity INT NOT NULL DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category ENUM('grooming', 'boarding', 'daycare', 'addon') NOT NULL,
  price INT NOT NULL,
  duration_minutes INT,
  description TEXT,
  target_pet_type ENUM('all', 'dog', 'cat') NOT NULL DEFAULT 'all',
  image_url LONGTEXT,
  badge VARCHAR(50),
  status ENUM('active', 'inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  category VARCHAR(60),
  summary VARCHAR(255),
  description TEXT,
  start_date DATE NULL,
  end_date DATE NULL,
  image_url LONGTEXT,
  cta_label VARCHAR(60),
  cta_link VARCHAR(120),
  is_banner TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  pet_id INT NOT NULL,
  service_id INT NOT NULL,
  store_id INT NOT NULL,
  staff_id INT NULL,

  -- 舊版相容欄位：目前很多前後端仍會用 booking_date。
  -- 新資料建議讓 booking_date = start_date。
  booking_date DATE NOT NULL,

  -- 新版完整預約區間：
  -- 美容：start_date/start_time，end_date/end_time 可由服務時長推算或同日。
  -- 安親：start_date/start_time 到 end_date/end_time，通常同日，以小時計。
  -- 住宿：start_date/start_time 到 end_date/end_time，以天數計。
  start_date DATE NULL,
  start_time TIME NOT NULL,
  end_date DATE NULL,
  end_time TIME NULL,

  status ENUM(
    'pending',
    'confirmed',
    'checked_in',
    'in_service',
    'completed',
    'cancelled'
  ) DEFAULT 'pending',

  note TEXT,
  photo_url LONGTEXT,

  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  actual_amount INT NULL,
  discount_points_used INT NOT NULL DEFAULT 0,
  final_amount INT NULL,
  payment_note TEXT NULL,

  INDEX idx_bookings_customer (customer_id),
  INDEX idx_bookings_date_time (booking_date, start_time),
  INDEX idx_bookings_store_start_end (store_id, start_date, end_date),
  INDEX idx_bookings_store_date_time (store_id, start_date, start_time, end_time),
  INDEX idx_bookings_status (status),

  CONSTRAINT fk_bookings_customer
    FOREIGN KEY (customer_id) REFERENCES users(id),

  CONSTRAINT fk_bookings_pet
    FOREIGN KEY (pet_id) REFERENCES pets(id),

  CONSTRAINT fk_bookings_service
    FOREIGN KEY (service_id) REFERENCES services(id),

  CONSTRAINT fk_bookings_store
    FOREIGN KEY (store_id) REFERENCES stores(id),

  CONSTRAINT fk_bookings_staff
    FOREIGN KEY (staff_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  service_id INT NOT NULL,
  price_snapshot INT NOT NULL DEFAULT 0,
  duration_snapshot INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_booking_service (booking_id, service_id),

  CONSTRAINT fk_booking_services_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_booking_services_service
    FOREIGN KEY (service_id) REFERENCES services(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,

  booking_id INT NOT NULL,
  customer_id INT NOT NULL,
  staff_id INT NULL,

  original_amount INT NOT NULL DEFAULT 0,
  discount_points_used INT NOT NULL DEFAULT 0,
  discount_amount INT NOT NULL DEFAULT 0,
  final_amount INT NOT NULL DEFAULT 0,

  points_earned INT NOT NULL DEFAULT 0,

  note TEXT,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_service_transactions_customer_paid (customer_id, paid_at),
  INDEX idx_service_transactions_booking (booking_id),

  CONSTRAINT fk_service_transactions_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_service_transactions_customer
    FOREIGN KEY (customer_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_service_transactions_staff
    FOREIGN KEY (staff_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_time_blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_id INT NOT NULL,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL,
  reason VARCHAR(120) DEFAULT '此時段已滿',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_store_date_time (store_id, block_date, start_time),

  CONSTRAINT fk_time_blocks_store
    FOREIGN KEY (store_id) REFERENCES stores(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_time_blocks_user
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NULL,
  customer_id INT NOT NULL,
  service_id INT NULL,
  rating INT NOT NULL,
  comment TEXT,
  photo_url LONGTEXT,
  reply TEXT,
  replied_at TIMESTAMP NULL,
  status ENUM('visible', 'hidden') DEFAULT 'visible',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_reviews_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_reviews_customer
    FOREIGN KEY (customer_id) REFERENCES users(id),

  CONSTRAINT fk_reviews_service
    FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,

  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NULL,
  subject VARCHAR(150) NULL,
  message TEXT NOT NULL,

  status ENUM('new', 'read', 'closed') NOT NULL DEFAULT 'new',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_contact_messages_status (status),
  INDEX idx_contact_messages_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- =====================================================
-- Migration helpers for existing local XAMPP databases
-- =====================================================

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS dog_room_capacity INT NOT NULL DEFAULT 0;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS cat_room_capacity INT NOT NULL DEFAULT 0;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS daycare_capacity INT NOT NULL DEFAULT 0;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS target_pet_type ENUM('all', 'dog', 'cat') NOT NULL DEFAULT 'all';

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS summary VARCHAR(255) NULL AFTER category;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS start_date DATE NULL AFTER booking_date;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS end_date DATE NULL AFTER start_time;

-- 舊資料補值：讓舊預約也有 start_date/end_date。
UPDATE bookings
SET start_date = booking_date
WHERE start_date IS NULL;

UPDATE bookings
SET end_date = booking_date
WHERE end_date IS NULL;

-- 舊資料如果沒有 end_time，先用開始時間 + 2 小時補值，避免畫面空白。
UPDATE bookings
SET end_time = ADDTIME(start_time, '02:00:00')
WHERE end_time IS NULL
  AND start_time IS NOT NULL;
