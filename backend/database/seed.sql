USE pawnest;

INSERT INTO users (name, email, username, password_hash, phone, role, store_id, membership_tier, membership_points, vip_expires_at) VALUES
('系統管理員', 'admin@pawnest.demo', 'admin', 'plain:123456', '02-2720-8899', 'admin', NULL, 'general', 0, NULL),
('櫃台員工', 'staff@pawnest.demo', 'staff', 'plain:123456', '02-2720-8899', 'staff', 1, 'general', 0, NULL),
('美容師 Amy', 'groomer@pawnest.demo', 'groomer', 'plain:123456', '02-2720-8899', 'groomer', 1, 'general', 0, NULL),
('王小美', 'customer@pawnest.demo', 'customer', 'plain:123456', '0912-345-678', 'customer', NULL, 'vip', 3680, '2026-12-31')
ON DUPLICATE KEY UPDATE
  name = VALUES(name), email = VALUES(email), password_hash = VALUES(password_hash), phone = VALUES(phone), role = VALUES(role), store_id = VALUES(store_id),
  membership_tier = VALUES(membership_tier), membership_points = VALUES(membership_points), vip_expires_at = VALUES(vip_expires_at), status = 'active';

INSERT INTO stores (name, area, address, phone, open_time, close_time, image_url, description, dog_room_capacity, cat_room_capacity, daycare_capacity, status) VALUES
('台北信義旗艦店', '台北市', '台北市信義區松仁路 88 號', '02-2720-8899', '10:00:00', '21:00:00', 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=1200&auto=format&fit=crop', '獨立美容室、住宿房與貓狗分區照護。', 6, 4, 8, 'active'),
('台北中山生活店', '台北市', '台北市中山區南京東路二段 120 號', '02-2508-1688', '09:30:00', '20:30:00', 'https://images.unsplash.com/photo-1560743641-3914f2c45636?w=1200&auto=format&fit=crop', '交通便利，適合日間安親與基礎美容。', 2, 2, 6, 'active'),
('新北板橋寵物會館', '新北市', '新北市板橋區文化路一段 66 號', '02-2255-7788', '10:00:00', '21:00:00', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&auto=format&fit=crop', '大型犬友善空間，住宿與放風區完整。', 8, 3, 10, 'active'),
('桃園藝文溫柔店', '桃園市', '桃園市桃園區中正路 101 號', '03-331-8899', '10:00:00', '20:30:00', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=1200&auto=format&fit=crop', '社區型門市，提供親切的日常照護。', 2, 1, 4, 'active')
ON DUPLICATE KEY UPDATE area = VALUES(area), address = VALUES(address), phone = VALUES(phone), open_time = VALUES(open_time), close_time = VALUES(close_time), image_url = VALUES(image_url), description = VALUES(description), dog_room_capacity = VALUES(dog_room_capacity), cat_room_capacity = VALUES(cat_room_capacity), daycare_capacity = VALUES(daycare_capacity), status = VALUES(status);

INSERT INTO users (name, email, username, password_hash, phone, role, store_id, membership_tier, membership_points, vip_expires_at, status)
SELECT CONCAT(st.name, ' 門市帳號'), CONCAT('staff_store_', st.id, '@pawnest.local'), CONCAT('staff_store_', st.id), 'plain:123456', NULL, 'staff', st.id, 'general', 0, NULL, 'active'
FROM stores st
ON DUPLICATE KEY UPDATE name = VALUES(name), store_id = VALUES(store_id), role = 'staff', status = 'active';


INSERT INTO services (name, category, price, duration_minutes, description, target_pet_type, image_url, badge, status) VALUES
('基礎洗護美容', 'grooming', 800, 60, '洗澡、耳朵清潔、指甲修剪與足底毛整理。', 'all', 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=1200&auto=format&fit=crop', '美容人氣', 'active'),
('精緻造型修剪', 'grooming', 1600, 120, '依毛孩毛量、體型與生活習慣客製造型。', 'dog', 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1200&auto=format&fit=crop', '造型推薦', 'active'),
('貓咪舒壓洗護', 'grooming', 1500, 90, '低壓力洗護流程，適合怕生與敏感貓咪。', 'cat', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&auto=format&fit=crop', '貓咪專屬', 'active'),
('安心住宿房', 'boarding', 900, 1440, '24 小時照護與照片回報，依體型安排舒適房型。', 'all', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=1200&auto=format&fit=crop', '住宿熱門', 'active'),
('日間安親照護', 'daycare', 600, 480, '白天陪伴、放風與基本照護，適合上班日托。', 'all', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&auto=format&fit=crop', '日托方案', 'active'),
('藥浴與皮膚護理', 'addon', 450, 30, '依照皮膚狀況加強清潔與護理，可加購於美容服務。', 'all', 'https://images.unsplash.com/photo-1601758063541-d2f50b4aafb2?w=1200&auto=format&fit=crop', '加購護理', 'active')
ON DUPLICATE KEY UPDATE category = VALUES(category), price = VALUES(price), duration_minutes = VALUES(duration_minutes), description = VALUES(description), target_pet_type = VALUES(target_pet_type), image_url = VALUES(image_url), badge = VALUES(badge), status = VALUES(status);

INSERT INTO activities (title, category, summary, description, start_date, end_date, image_url, cta_label, cta_link, is_banner, sort_order, status) VALUES
('健康保健月', '保健活動', '指定美容與住宿方案享限定優惠，讓毛孩從清潔到休息都被溫柔照顧。', '健康保健月期間，PawNest 推出美容與住宿指定方案優惠，陪伴毛孩從日常清潔、皮膚照護到安心休息，都能獲得更完整的照顧。\n\n活動適合準備換季整理、需要深層清潔，或近期有住宿需求的毛孩。門市人員會依毛孩的體型、毛量、皮膚狀況與生活習慣，協助安排合適的服務組合。\n\n線上預約僅顯示參考價格，實際服務內容與金額將以現場評估為準。優惠數量有限，建議提前預約合適時段。', '2026-05-13', '2026-06-09', 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=1800&auto=format&fit=crop&q=85', '查看活動', '/activities', 1, 1, 'active'),
('換季洗護專案', '美容優惠', '低敏洗劑搭配梳毛整理，陪毛孩舒適度過換季時刻。', '換季時毛孩容易出現掉毛、皮膚敏感、搔癢或毛髮打結等狀況。PawNest 推出換季洗護專案，透過溫和清潔、基礎梳理與皮膚狀態確認，幫助毛孩維持清爽舒適。\n\n本專案適合需要定期洗澡、換毛期毛量較多，或皮膚較敏感的狗狗與貓咪。美容師會依毛孩毛況與膚況，選擇合適的洗護方式。\n\n若現場評估需要加購藥浴、深層護毛或局部修剪，門市人員會先與飼主確認後再進行服務。', '2026-05-01', '2026-05-31', 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=1800&auto=format&fit=crop&q=85', '預約美容', '/booking', 1, 2, 'active'),
('住宿買三送一', '住宿優惠', '連續住宿享加贈優惠，讓毛孩在熟悉環境中安心過夜。', '外出旅遊、出差或臨時有事時，讓毛孩住得安心是最重要的事。活動期間預約指定住宿方案，即可享有買三送一優惠，讓毛孩在 PawNest 的舒適空間中安心休息。\n\n住宿期間門市人員會協助日常照護、餵食與狀態觀察，並依毛孩個性安排合適的休息環境。若毛孩較容易緊張，也可以在預約備註中提前告知。\n\n住宿名額依門市狗狗房、貓咪房數量為準，建議提早預約。實際入住天數、優惠適用方式與照護需求，將由門市人員現場確認。', '2026-05-10', '2026-06-15', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=1800&auto=format&fit=crop&q=85', '了解住宿', '/services', 1, 3, 'active'),
('新會員首約禮', '會員限定', '首次完成線上預約，即可獲得專屬入會優惠。', '歡迎第一次來到 PawNest 的毛孩與家長。新會員完成線上預約後，即可享有首約禮，讓第一次體驗美容、安親或住宿服務時更加安心。\n\n首約禮可依門市活動內容套用於指定服務，適合第一次體驗基礎美容、換季清潔或短時間安親的毛孩。門市人員會協助了解毛孩個性、照護習慣與注意事項，讓後續服務安排更貼近毛孩需求。\n\n每位新會員限使用一次，實際優惠內容與適用服務以門市現場公告為準。', '2026-05-01', NULL, 'https://images.unsplash.com/photo-1601758063541-d2f50b4aafb2?w=1800&auto=format&fit=crop&q=85', '加入會員', '/login', 1, 4, 'active')
ON DUPLICATE KEY UPDATE category = VALUES(category), summary = VALUES(summary), description = VALUES(description), start_date = VALUES(start_date), end_date = VALUES(end_date), image_url = VALUES(image_url), cta_label = VALUES(cta_label), cta_link = VALUES(cta_link), is_banner = VALUES(is_banner), sort_order = VALUES(sort_order), status = VALUES(status);

INSERT INTO pets (user_id, name, type, breed, gender, age, weight, note, photo_url)
SELECT id, '小白', 'dog', '柴犬', '男生', 3, 10.5, '怕吹風機，需慢慢安撫', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop' FROM users WHERE username = 'customer'
ON DUPLICATE KEY UPDATE type = VALUES(type), breed = VALUES(breed), gender = VALUES(gender), age = VALUES(age), weight = VALUES(weight), note = VALUES(note), photo_url = VALUES(photo_url);

INSERT INTO pets (user_id, name, type, breed, gender, age, weight, note, photo_url)
SELECT id, '咪咪', 'cat', '米克斯', '女生', 2, 4.8, '怕陌生人，洗護前需要先安撫', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=900&auto=format&fit=crop' FROM users WHERE username = 'customer'
ON DUPLICATE KEY UPDATE type = VALUES(type), breed = VALUES(breed), gender = VALUES(gender), age = VALUES(age), weight = VALUES(weight), note = VALUES(note), photo_url = VALUES(photo_url);

INSERT INTO reviews (customer_id, service_id, rating, comment, photo_url, reply, status)
SELECT u.id, s.id, 5, '第一次住宿就收到照片回報，很安心，店員也很溫柔。', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop', '謝謝你的分享，我們會持續提供安心照護。', 'visible' FROM users u JOIN services s ON s.name = '安心住宿房' WHERE u.username = 'customer' LIMIT 1;

INSERT INTO booking_time_blocks (store_id, block_date, start_time, reason, created_by)
SELECT st.id, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:30:00', '美容師排班已滿', u.id
FROM stores st CROSS JOIN users u
WHERE st.name = '台北信義旗艦店' AND u.username = 'admin'
ON DUPLICATE KEY UPDATE reason = VALUES(reason), created_by = VALUES(created_by);
