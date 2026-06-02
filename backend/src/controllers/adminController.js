import { pool } from '../config/db.js';
import { completeBookingPaymentService } from '../services/bookingService.js';

function clean(value) {
  return value === undefined || value === '' ? null : value;
}

function isStoreScopedRole(role) {
  return ['staff', 'groomer', 'reception'].includes(role || '');
}

function getScopedStoreId(req) {
  if (!req.user || !isStoreScopedRole(req.user.role)) return null;
  return Number(req.user.store_id || 0) || null;
}

function requireStoreAccess(req, res, storeId) {
  const scopedStoreId = getScopedStoreId(req);

  if (!scopedStoreId) return true;

  if (Number(storeId) !== scopedStoreId) {
    res.status(403).json({ message: '只能管理所屬門市的資料' });
    return false;
  }

  return true;
}

function buildStoreFilter(req, alias = 'b') {
  const scopedStoreId = getScopedStoreId(req);

  if (!scopedStoreId) {
    return { clause: '', params: [] };
  }

  return { clause: `WHERE ${alias}.store_id = ?`, params: [scopedStoreId] };
}

async function createStaffAccountForStore(connection, storeId, storeName) {
  const username = `staff_store_${storeId}`;
  const email = `${username}@pawnest.local`;

  await connection.execute(
    `
    INSERT INTO users
      (name, email, username, password_hash, phone, role, store_id, membership_tier, membership_points, vip_expires_at, status)
    VALUES (?, ?, ?, 'plain:123456', NULL, 'staff', ?, 'general', 0, NULL, 'active')
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      store_id = VALUES(store_id),
      role = 'staff',
      status = 'active'
    `,
    [`${storeName} 門市帳號`, email, username, storeId],
  );

  return {
    username,
    password: '123456',
  };
}

function toDateOnly(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toTimeOnly(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

function hasServiceStarted(bookingDate, startTime) {
  const date = toDateOnly(bookingDate);
  const time = toTimeOnly(startTime);

  if (!date || !time) return false;

  const serviceStart = new Date(`${date}T${time}:00`);
  const now = new Date();

  return now >= serviceStart;
}

function calculatePoints(finalAmount) {
  return Math.floor(Number(finalAmount || 0) / 100);
}

async function refreshMembershipTier(customerId, connection = pool) {
  const [[spendingRow]] = await connection.execute(
    `
    SELECT COALESCE(SUM(final_amount), 0) AS annual_spending
    FROM service_transactions
    WHERE customer_id = ?
      AND paid_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `,
    [customerId],
  );

  const annualSpending = Number(spendingRow?.annual_spending || 0);

  if (annualSpending >= 10000) {
    await connection.execute(
      `
      UPDATE users
      SET
        membership_tier = 'vip',
        vip_expires_at = DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
      WHERE id = ?
      `,
      [customerId],
    );

    return {
      membership_tier: 'vip',
      vip_expires_at: null,
      annual_spending: annualSpending,
    };
  }

  await connection.execute(
    `
    UPDATE users
    SET
      membership_tier = 'general',
      vip_expires_at = NULL
    WHERE id = ?
    `,
    [customerId],
  );

  return {
    membership_tier: 'general',
    vip_expires_at: null,
    annual_spending: annualSpending,
  };
}

export async function getDashboard(req, res) {
  const storeId = getScopedStoreId(req);

  const bookingWhere = storeId ? 'WHERE store_id = ?' : '';
  const bookingParams = storeId ? [storeId] : [];

  const pendingWhere = storeId
    ? "WHERE status = 'pending' AND store_id = ?"
    : "WHERE status = 'pending'";
  const pendingParams = storeId ? [storeId] : [];

  const revenueWhere = storeId
    ? `
      JOIN bookings b ON b.id = tx.booking_id
      WHERE DATE(tx.paid_at) = CURDATE()
        AND b.store_id = ?
      `
    : `
      WHERE DATE(tx.paid_at) = CURDATE()
      `;
  const revenueParams = storeId ? [storeId] : [];

  const recentWhere = storeId ? 'WHERE b.store_id = ?' : '';
  const recentParams = storeId ? [storeId] : [];

  const [[todayBookings]] = await pool.execute(
    `
    SELECT COUNT(*) AS count
    FROM bookings
    ${bookingWhere}
    ${storeId ? 'AND' : 'WHERE'} booking_date = CURDATE()
    `,
    bookingParams,
  );

  const [[members]] = await pool.execute(
    `
    SELECT COUNT(*) AS count
    FROM users
    WHERE role = 'customer'
      AND status = 'active'
    `,
  );

  const [[pets]] = await pool.execute(
    `
    SELECT COUNT(*) AS count
    FROM pets
    `,
  );

  const [[pending]] = await pool.execute(
    `
    SELECT COUNT(*) AS count
    FROM bookings
    ${pendingWhere}
    `,
    pendingParams,
  );

  const [[revenue]] = await pool.execute(
    `
    SELECT COALESCE(SUM(tx.final_amount), 0) AS total
    FROM service_transactions tx
    ${revenueWhere}
    `,
    revenueParams,
  );

  const [recentBookings] = await pool.execute(
    `
    SELECT
      b.id,
      b.booking_date,
      b.start_time,
      b.status,
      u.name AS customer_name,
      p.name AS pet_name,
      COALESCE(service_summary.service_names, s.name) AS service_name,
      st.name AS store_name
    FROM bookings b
    JOIN users u ON u.id = b.customer_id
    JOIN pets p ON p.id = b.pet_id
    JOIN services s ON s.id = b.service_id
    JOIN stores st ON st.id = b.store_id
    LEFT JOIN (
      SELECT
        bs.booking_id,
        GROUP_CONCAT(svc.name ORDER BY bs.id SEPARATOR '、') AS service_names
      FROM booking_services bs
      JOIN services svc ON svc.id = bs.service_id
      GROUP BY bs.booking_id
    ) service_summary ON service_summary.booking_id = b.id
    ${recentWhere}
    ORDER BY b.created_at DESC
    LIMIT 5
    `,
    recentParams,
  );

  res.json({
    stats: {
      todayBookings: Number(todayBookings.count || 0),
      members: Number(members.count || 0),
      pets: Number(pets.count || 0),
      pending: Number(pending.count || 0),
      todayRevenue: Number(revenue.total || 0),
    },
    recentBookings,
  });
}

export async function getAdminBookings(req, res) {
  const [rows] = await pool.execute(
    `
    SELECT
      b.id,
      b.customer_id,
      b.pet_id,
      b.service_id,
      b.store_id,
      b.staff_id,
      b.booking_date,
      b.start_time,
      b.end_time,
      b.status,
      b.note,
      b.photo_url,
      b.actual_amount,
      b.discount_points_used,
      b.final_amount,
      b.payment_note,
      b.completed_at,
      b.created_at,

      u.name AS customer_name,
      u.phone AS phone,
      u.email AS customer_email,
      u.membership_tier AS customer_membership_tier,
      u.membership_points AS customer_membership_points,

      p.name AS pet_name,
      p.type AS pet_type,
      p.breed AS pet_breed,
      p.photo_url AS pet_photo_url,

      s.name AS service_name,
      s.category AS service_category,
      s.price AS service_price,
      s.duration_minutes AS duration_minutes,

      COALESCE(service_summary.service_ids, CAST(s.id AS CHAR)) AS service_ids,
      COALESCE(service_summary.service_names, s.name) AS service_names,
      COALESCE(service_summary.service_total_price, s.price, 0) AS service_total_price,
      COALESCE(service_summary.service_total_duration, s.duration_minutes, 0) AS service_total_duration,
      COALESCE(service_summary.requires_boarding, CASE WHEN s.category = 'boarding' THEN 1 ELSE 0 END) AS requires_boarding,
      COALESCE(service_summary.requires_daycare, CASE WHEN s.category = 'daycare' THEN 1 ELSE 0 END) AS requires_daycare,

      st.name AS store_name,
      st.area AS store_area,
      st.address AS store_address,
      st.dog_room_capacity AS store_dog_room_capacity,
      st.cat_room_capacity AS store_cat_room_capacity,
      st.daycare_capacity AS store_daycare_capacity,

      staff.name AS staff_name,

      tx.id AS transaction_id,
      tx.original_amount AS transaction_original_amount,
      tx.discount_points_used AS transaction_discount_points_used,
      tx.discount_amount AS transaction_discount_amount,
      tx.final_amount AS transaction_final_amount,
      tx.points_earned AS transaction_points_earned,
      tx.note AS transaction_note,
      tx.paid_at AS transaction_paid_at
    FROM bookings b
    JOIN users u ON u.id = b.customer_id
    JOIN pets p ON p.id = b.pet_id
    JOIN services s ON s.id = b.service_id
    JOIN stores st ON st.id = b.store_id
    LEFT JOIN users staff ON staff.id = b.staff_id
    LEFT JOIN service_transactions tx ON tx.booking_id = b.id
    LEFT JOIN (
      SELECT
        bs.booking_id,
        GROUP_CONCAT(bs.service_id ORDER BY bs.id SEPARATOR ',') AS service_ids,
        GROUP_CONCAT(svc.name ORDER BY bs.id SEPARATOR '、') AS service_names,
        SUM(bs.price_snapshot) AS service_total_price,
        SUM(bs.duration_snapshot) AS service_total_duration,
        MAX(CASE WHEN svc.category = 'boarding' THEN 1 ELSE 0 END) AS requires_boarding,
        MAX(CASE WHEN svc.category = 'daycare' THEN 1 ELSE 0 END) AS requires_daycare
      FROM booking_services bs
      JOIN services svc ON svc.id = bs.service_id
      GROUP BY bs.booking_id
    ) service_summary ON service_summary.booking_id = b.id
    ${buildStoreFilter(req, 'b').clause}
    ORDER BY b.booking_date DESC, b.start_time DESC, b.id DESC
    `,
    buildStoreFilter(req, 'b').params,
  );

  res.json({ bookings: rows });
}

export async function updateBookingStatus(req, res) {
  const id = Number(req.params.id);
  const { status, photo_url } = req.body;

  const allowedStatuses = [
    'pending',
    'confirmed',
    'checked_in',
    'in_service',
    'completed',
    'cancelled',
  ];

  if (!id) {
    return res.status(400).json({ message: '預約編號不正確' });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: '不支援的預約狀態' });
  }

  const [rows] = await pool.execute(
    `
    SELECT id, store_id
    FROM bookings
    WHERE id = ?
    `,
    [id],
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: '找不到預約資料' });
  }

  if (!requireStoreAccess(req, res, rows[0].store_id)) return;

  await pool.execute(
    `
    UPDATE bookings
    SET
      status = ?,
      photo_url = CASE
        WHEN ? IS NOT NULL THEN ?
        ELSE photo_url
      END,
      completed_at = CASE
        WHEN ? = 'completed' THEN NOW()
        WHEN ? != 'completed' THEN NULL
        ELSE completed_at
      END
    WHERE id = ?
    `,
    [
      status,
      clean(photo_url),
      clean(photo_url),
      status,
      status,
      id,
    ],
  );

  res.json({ message: '預約狀態已更新' });
}

export async function completeBookingPayment(req, res) {
  const bookingId = Number(req.params.id);
  const {
    original_amount,
    discount_points_used = 0,
    note,
    photo_url,
  } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: '預約編號不正確' });
  }

  const originalAmount = Number(original_amount || 0);
  const pointsUsed = Number(discount_points_used || 0);

  if (!originalAmount || originalAmount <= 0) {
    return res.status(400).json({ message: '請輸入實際消費金額' });
  }

  if (pointsUsed < 0) {
    return res.status(400).json({ message: '折抵點數不可小於 0' });
  }

  const [[bookingRow]] = await pool.execute(
    'SELECT id, store_id FROM bookings WHERE id = ? LIMIT 1',
    [bookingId],
  );

  if (!bookingRow) {
    return res.status(404).json({ message: '找不到預約資料' });
  }

  if (!requireStoreAccess(req, res, bookingRow.store_id)) return;

  try {
    const result = await completeBookingPaymentService({
      bookingId,
      originalAmount,
      pointsUsed,
      note,
      photoUrl: photo_url,
      staffId: req.user?.id || null,
    });

    return res.json({
      message: '服務已完成並已紀錄實際消費',
      ...result,
    });
  } catch (error) {
    console.error('Complete booking payment error:', error);

    return res.status(error.statusCode || 500).json({
      message: error.message || '完成結帳失敗，請稍後再試',
    });
  }
}

export async function deleteAdminBooking(req, res) {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: '預約編號不正確' });
  }

  const [rows] = await pool.execute(
    `
    SELECT id, store_id, booking_date, start_time
    FROM bookings
    WHERE id = ?
    `,
    [id],
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: '找不到預約資料' });
  }

  const booking = rows[0];

  if (!requireStoreAccess(req, res, booking.store_id)) return;

  if (hasServiceStarted(booking.booking_date, booking.start_time)) {
    return res.status(400).json({
      message: '服務時間已開始，管理員與員工不可刪除此預約。',
    });
  }

  await pool.execute('DELETE FROM bookings WHERE id = ?', [id]);

  res.json({ message: '預約已刪除' });
}

export async function getTimeBlocks(req, res) {
  const filter = buildStoreFilter(req, 'tb');

  const [rows] = await pool.execute(
    `
    SELECT
      tb.id,
      tb.store_id,
      tb.block_date,
      tb.start_time,
      tb.reason,
      tb.created_at,
      st.name AS store_name
    FROM booking_time_blocks tb
    JOIN stores st ON st.id = tb.store_id
    ${filter.clause}
    ORDER BY tb.block_date DESC, tb.start_time ASC, tb.id DESC
    `,
    filter.params,
  );

  res.json({ blocks: rows });
}

export async function createTimeBlock(req, res) {
  const { store_id, block_date, start_time, reason } = req.body;
  const storeId = Number(store_id);

  if (!storeId || !block_date || !start_time) {
    return res.status(400).json({ message: '請選擇門市、日期與時間' });
  }

  if (!requireStoreAccess(req, res, storeId)) return;

  const [result] = await pool.execute(
    `
    INSERT INTO booking_time_blocks
      (store_id, block_date, start_time, reason, created_by)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      reason = VALUES(reason),
      created_by = VALUES(created_by)
    `,
    [
      storeId,
      block_date,
      start_time,
      reason || '此時段已滿',
      req.user.id,
    ],
  );

  res.status(201).json({
    id: result.insertId,
    message: '時段已關閉',
  });
}

export async function deleteTimeBlock(req, res) {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: '時段編號不正確' });
  }

  const [[block]] = await pool.execute(
    'SELECT id, store_id FROM booking_time_blocks WHERE id = ? LIMIT 1',
    [id],
  );

  if (!block) {
    return res.status(404).json({ message: '找不到時段資料' });
  }

  if (!requireStoreAccess(req, res, block.store_id)) return;

  await pool.execute('DELETE FROM booking_time_blocks WHERE id = ?', [id]);

  res.json({ message: '時段已重新開放' });
}

export async function getMembers(req, res) {
  const [rows] = await pool.execute(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      u.username,
      u.phone,
      u.role,
      u.store_id,
      u.membership_tier,
      u.membership_points,
      u.vip_expires_at,
      u.status,
      u.created_at,

      COALESCE((
        SELECT COUNT(*)
        FROM pets p
        WHERE p.user_id = u.id
      ), 0) AS pet_count,

      COALESCE((
        SELECT SUM(tx.final_amount)
        FROM service_transactions tx
        WHERE tx.customer_id = u.id
          AND tx.paid_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
      ), 0) AS annual_spending

    FROM users u
    WHERE u.role = 'customer'
    ORDER BY u.created_at DESC, u.id DESC
    `,
  );

  res.json({ members: rows });
}

export async function getMemberTransactions(req, res) {
  const memberId = Number(req.params.id);

  if (!memberId) {
    return res.status(400).json({ message: '會員編號不正確' });
  }

  // staff 可以查看會員消費紀錄，不依門市過濾。
  const [rows] = await pool.execute(
    `
    SELECT
      tx.id,
      tx.booking_id,
      tx.customer_id,
      tx.staff_id,
      tx.original_amount,
      tx.discount_points_used,
      tx.discount_amount,
      tx.final_amount,
      tx.points_earned,
      tx.note,
      tx.paid_at,
      tx.created_at,

      b.booking_date,
      b.start_time,
      b.status AS booking_status,

      p.name AS pet_name,
      COALESCE(service_summary.service_names, s.name) AS service_name,
      st.name AS store_name,
      staff.name AS staff_name
    FROM service_transactions tx
    JOIN bookings b ON b.id = tx.booking_id
    LEFT JOIN pets p ON p.id = b.pet_id
    LEFT JOIN services s ON s.id = b.service_id
    LEFT JOIN stores st ON st.id = b.store_id
    LEFT JOIN users staff ON staff.id = tx.staff_id
    LEFT JOIN (
      SELECT
        bs.booking_id,
        GROUP_CONCAT(svc.name ORDER BY bs.id SEPARATOR '、') AS service_names
      FROM booking_services bs
      JOIN services svc ON svc.id = bs.service_id
      GROUP BY bs.booking_id
    ) service_summary ON service_summary.booking_id = b.id
    WHERE tx.customer_id = ?
    ORDER BY tx.paid_at DESC, tx.id DESC
    `,
    [memberId],
  );

  const [[summary]] = await pool.execute(
    `
    SELECT
      COALESCE(SUM(tx.final_amount), 0) AS annual_spending
    FROM service_transactions tx
    WHERE tx.customer_id = ?
      AND tx.paid_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `,
    [memberId],
  );

  res.json({
    transactions: rows,
    summary: {
      annual_spending: Number(summary?.annual_spending || 0),
      vip_threshold: 10000,
      remaining_to_vip: Math.max(10000 - Number(summary?.annual_spending || 0), 0),
    },
  });
}

export async function createMember(req, res) {
  const {
    name,
    email,
    username,
    password,
    phone,
    membership_tier,
    membership_points,
    vip_expires_at,
    status,
  } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ message: '請填寫姓名、帳號與密碼' });
  }

  const [result] = await pool.execute(
    `
    INSERT INTO users
      (name, email, username, password_hash, phone, role, membership_tier, membership_points, vip_expires_at, status)
    VALUES (?, ?, ?, ?, ?, 'customer', ?, ?, ?, ?)
    `,
    [
      name,
      clean(email),
      username,
      `plain:${password}`,
      clean(phone),
      membership_tier || 'general',
      Number(membership_points || 0),
      clean(vip_expires_at),
      status || 'active',
    ],
  );

  res.status(201).json({ id: result.insertId, message: '會員已新增' });
}

export async function updateMember(req, res) {
  const {
    name,
    email,
    username,
    phone,
    membership_tier,
    membership_points,
    vip_expires_at,
    status,
    password,
  } = req.body;

  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: '會員編號不正確' });
  }

  if (password) {
    await pool.execute(
      `
      UPDATE users
      SET
        name = ?,
        email = ?,
        username = ?,
        phone = ?,
        membership_tier = ?,
        membership_points = ?,
        vip_expires_at = ?,
        status = ?,
        password_hash = ?
      WHERE id = ? AND role = 'customer'
      `,
      [
        name,
        clean(email),
        username,
        clean(phone),
        membership_tier || 'general',
        Number(membership_points || 0),
        clean(vip_expires_at),
        status || 'active',
        `plain:${password}`,
        id,
      ],
    );
  } else {
    await pool.execute(
      `
      UPDATE users
      SET
        name = ?,
        email = ?,
        username = ?,
        phone = ?,
        membership_tier = ?,
        membership_points = ?,
        vip_expires_at = ?,
        status = ?
      WHERE id = ? AND role = 'customer'
      `,
      [
        name,
        clean(email),
        username,
        clean(phone),
        membership_tier || 'general',
        Number(membership_points || 0),
        clean(vip_expires_at),
        status || 'active',
        id,
      ],
    );
  }

  await refreshMembershipTier(id);

  res.json({ message: '會員已更新' });
}

export async function deleteMember(req, res) {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: '會員編號不正確' });
  }

  await pool.execute("DELETE FROM users WHERE id = ? AND role = 'customer'", [
    id,
  ]);

  res.json({ message: '會員已刪除' });
}

export async function getActivities(req, res) {
  const [rows] = await pool.execute(
    'SELECT * FROM activities ORDER BY sort_order ASC, id DESC',
  );

  res.json({ activities: rows });
}

export async function createActivity(req, res) {
  const {
    title,
    category,
    summary,
    description,
    start_date,
    end_date,
    image_url,
    cta_label,
    cta_link,
    is_banner,
    sort_order,
    status,
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: '請填寫活動標題' });
  }

  const [result] = await pool.execute(
    `
    INSERT INTO activities
      (title, category, summary, description, start_date, end_date, image_url, cta_label, cta_link, is_banner, sort_order, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      title,
      clean(category),
      clean(summary),
      clean(description),
      clean(start_date),
      clean(end_date),
      clean(image_url),
      clean(cta_label),
      clean(cta_link),
      is_banner ? 1 : 0,
      Number(sort_order || 0),
      status || 'active',
    ],
  );

  res.status(201).json({ id: result.insertId, message: '活動已新增' });
}

export async function updateActivity(req, res) {
  const id = Number(req.params.id);

  const {
    title,
    category,
    summary,
    description,
    start_date,
    end_date,
    image_url,
    cta_label,
    cta_link,
    is_banner,
    sort_order,
    status,
  } = req.body;

  await pool.execute(
    `
    UPDATE activities
    SET
      title = ?,
      category = ?,
      summary = ?,
      description = ?,
      start_date = ?,
      end_date = ?,
      image_url = ?,
      cta_label = ?,
      cta_link = ?,
      is_banner = ?,
      sort_order = ?,
      status = ?
    WHERE id = ?
    `,
    [
      title,
      clean(category),
      clean(summary),
      clean(description),
      clean(start_date),
      clean(end_date),
      clean(image_url),
      clean(cta_label),
      clean(cta_link),
      is_banner ? 1 : 0,
      Number(sort_order || 0),
      status || 'active',
      id,
    ],
  );

  res.json({ message: '活動已更新' });
}

export async function deleteActivity(req, res) {
  await pool.execute('DELETE FROM activities WHERE id = ?', [
    Number(req.params.id),
  ]);

  res.json({ message: '活動已刪除' });
}

export async function getServices(req, res) {
  const [rows] = await pool.execute(
    `
    SELECT *
    FROM services
    ORDER BY FIELD(category, "grooming", "boarding", "daycare", "addon"), id ASC
    `,
  );

  res.json({ services: rows });
}

export async function createService(req, res) {
  const {
    name,
    category,
    price,
    duration_minutes,
    description,
    target_pet_type,
    image_url,
    badge,
    status,
  } = req.body;

  if (!name || !category || price === undefined || price === null) {
    return res.status(400).json({ message: '請填寫服務名稱、類別與價格' });
  }

  try {
    const [result] = await pool.execute(
      `
      INSERT INTO services
        (
          name,
          category,
          price,
          duration_minutes,
          description,
          target_pet_type,
          image_url,
          badge,
          status
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        category || 'grooming',
        Number(price || 0),
        Number(duration_minutes || 0),
        description || null,
        target_pet_type || 'all',
        image_url || null,
        badge || null,
        status || 'active',
      ],
    );

    res.status(201).json({
      id: result.insertId,
      message: '服務已新增',
    });
  } catch (error) {
    console.error('Create service error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '服務名稱已存在' });
    }

    return res.status(500).json({
      message: '新增服務失敗，請稍後再試',
    });
  }
}

export async function updateService(req, res) {
  const {
    name,
    category,
    price,
    duration_minutes,
    description,
    image_url,
    badge,
    target_pet_type,
    status,
  } = req.body;

  await pool.execute(
    `
    UPDATE services
    SET
      name = ?,
      category = ?,
      price = ?,
      duration_minutes = ?,
      description = ?,
      target_pet_type = ?,
      image_url = ?,
      badge = ?,
      status = ?
    WHERE id = ?
    `,
    [
      name,
      category,
      Number(price),
      Number(duration_minutes || 0),
      clean(description),
      target_pet_type || 'all',
      clean(image_url),
      clean(badge),
      status || 'active',
      Number(req.params.id),
    ],
  );

  res.json({ message: '服務已更新' });
}

export async function deleteService(req, res) {
  await pool.execute('DELETE FROM services WHERE id = ?', [
    Number(req.params.id),
  ]);

  res.json({ message: '服務已刪除' });
}

export async function getStores(req, res) {
  const scopedStoreId = getScopedStoreId(req);

  const [rows] = await pool.execute(
    scopedStoreId
      ? 'SELECT * FROM stores WHERE id = ? ORDER BY id ASC'
      : 'SELECT * FROM stores ORDER BY id ASC',
    scopedStoreId ? [scopedStoreId] : [],
  );

  res.json({ stores: rows });
}

export async function createStore(req, res) {
  const {
    name,
    area,
    address,
    phone,
    open_time,
    close_time,
    image_url,
    description,
    dog_room_capacity,
    cat_room_capacity,
    daycare_capacity,
    status,
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: '請填寫門市名稱' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `
      INSERT INTO stores
        (name, area, address, phone, open_time, close_time, image_url, description, dog_room_capacity, cat_room_capacity, daycare_capacity, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        clean(area),
        clean(address),
        clean(phone),
        clean(open_time),
        clean(close_time),
        clean(image_url),
        clean(description),
        Number(dog_room_capacity || 0),
        Number(cat_room_capacity || 0),
        Number(daycare_capacity || 0),
        status || 'active',
      ],
    );

    const storeId = result.insertId;
    const staffAccount = await createStaffAccountForStore(connection, storeId, name);

    await connection.commit();

    res.status(201).json({
      id: storeId,
      message: `門市已新增，已自動建立門市帳號 ${staffAccount.username}，預設密碼 123456`,
      staff_account: staffAccount,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create store error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '門市名稱或門市帳號已存在' });
    }

    return res.status(500).json({ message: '新增門市失敗，請稍後再試' });
  } finally {
    connection.release();
  }
}

export async function updateStore(req, res) {
  const {
    name,
    area,
    address,
    phone,
    open_time,
    close_time,
    image_url,
    description,
    dog_room_capacity,
    cat_room_capacity,
    daycare_capacity,
    status,
  } = req.body;

  await pool.execute(
    `
    UPDATE stores
    SET
      name = ?,
      area = ?,
      address = ?,
      phone = ?,
      open_time = ?,
      close_time = ?,
      image_url = ?,
      description = ?,
      dog_room_capacity = ?,
      cat_room_capacity = ?,
      daycare_capacity = ?,
      status = ?
    WHERE id = ?
    `,
    [
      name,
      clean(area),
      clean(address),
      clean(phone),
      clean(open_time),
      clean(close_time),
      clean(image_url),
      clean(description),
      Number(dog_room_capacity || 0),
      Number(cat_room_capacity || 0),
      Number(daycare_capacity || 0),
      status || 'active',
      Number(req.params.id),
    ],
  );

  res.json({ message: '門市已更新' });
}

export async function deleteStore(req, res) {
  await pool.execute('DELETE FROM stores WHERE id = ?', [
    Number(req.params.id),
  ]);

  res.json({ message: '門市已刪除' });
}

export async function getReviews(req, res) {
  const [rows] = await pool.execute(
    `
    SELECT
      r.id,
      r.booking_id,
      r.customer_id,
      r.service_id,
      r.rating,
      r.comment,
      r.photo_url,
      r.reply,
      r.replied_at,
      r.status,
      r.created_at,
      u.name AS customer_name,
      s.name AS service_name
    FROM reviews r
    JOIN users u ON u.id = r.customer_id
    LEFT JOIN services s ON s.id = r.service_id
    LEFT JOIN bookings b ON b.id = r.booking_id
    ${getScopedStoreId(req) ? 'WHERE b.store_id = ? OR r.booking_id IS NULL' : ''}
    ORDER BY r.created_at DESC, r.id DESC
    `,
    getScopedStoreId(req) ? [getScopedStoreId(req)] : [],
  );

  res.json({ reviews: rows });
}

export async function replyReview(req, res) {
  const { reply, status } = req.body;

  await pool.execute(
    `
    UPDATE reviews
    SET
      reply = ?,
      replied_at = NOW(),
      status = ?
    WHERE id = ?
    `,
    [clean(reply), status || 'visible', Number(req.params.id)],
  );

  res.json({ message: '評論回覆已更新' });
}

export async function deleteReview(req, res) {
  await pool.execute('DELETE FROM reviews WHERE id = ?', [
    Number(req.params.id),
  ]);

  res.json({ message: '評論已刪除' });
}

export async function getContactMessages(req, res) {
  const status = clean(req.query.status);

  const allowedStatuses = ['new', 'read', 'closed'];

  let whereClause = '';
  const params = [];

  if (status && allowedStatuses.includes(status)) {
    whereClause = 'WHERE status = ?';
    params.push(status);
  }

  const [rows] = await pool.execute(
    `
    SELECT
      id,
      name,
      email,
      phone,
      subject,
      message,
      status,
      created_at,
      updated_at
    FROM contact_messages
    ${whereClause}
    ORDER BY
      CASE status
        WHEN 'new' THEN 1
        WHEN 'read' THEN 2
        WHEN 'closed' THEN 3
        ELSE 4
      END ASC,
      created_at DESC,
      id DESC
    `,
    params,
  );

  res.json({ messages: rows });
}

export async function updateContactMessageStatus(req, res) {
  const id = Number(req.params.id);
  const { status } = req.body;

  const allowedStatuses = ['new', 'read', 'closed'];

  if (!id) {
    return res.status(400).json({ message: '留言編號不正確' });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: '不支援的留言狀態' });
  }

  const [result] = await pool.execute(
    `
    UPDATE contact_messages
    SET status = ?
    WHERE id = ?
    `,
    [status, id],
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: '找不到留言資料' });
  }

  res.json({ message: '留言狀態已更新' });
}