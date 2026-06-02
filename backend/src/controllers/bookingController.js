import { pool } from '../config/db.js';

const CUSTOMER_MODIFIABLE_STATUSES = ['pending', 'confirmed'];
const STAFF_ROLES = ['admin', 'staff', 'groomer', 'reception'];
const DEFAULT_TIMES = [
  '10:00',
  '10:30',
  '11:00',
  '13:30',
  '14:00',
  '15:30',
  '16:00',
  '18:30',
];
const SLOT_CAPACITY = 1;

function normalizeDate(value) {
  if (!value) return '';
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  return String(value).slice(0, 10);
}

function normalizeTime(value) {
  if (!value) return '';
  const text = String(value);
  return text.length === 5 ? `${text}:00` : text.slice(0, 8);
}

function toDisplayTime(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

function startDateTime(bookingDate, startTime) {
  return new Date(`${normalizeDate(bookingDate)}T${normalizeTime(startTime)}`);
}

function hasServiceStarted(bookingDate, startTime) {
  const start = startDateTime(bookingDate, startTime);
  return Number.isNaN(start.getTime()) || start.getTime() <= Date.now();
}

function canCustomerModify(bookingDate, startTime) {
  const start = startDateTime(bookingDate, startTime);
  const diffHours = (start.getTime() - Date.now()) / (1000 * 60 * 60);
  return diffHours >= 4;
}

function roleCanModify(req, booking) {
  const bookingStartDate = booking.start_date || booking.booking_date;

  if (req.user.role === 'customer') {
    return (
      CUSTOMER_MODIFIABLE_STATUSES.includes(booking.status) &&
      canCustomerModify(bookingStartDate, booking.start_time)
    );
  }

  if (STAFF_ROLES.includes(req.user.role)) {
    return !hasServiceStarted(bookingStartDate, booking.start_time);
  }

  return false;
}

function addCanModify(req) {
  return (row) => ({
    ...row,
    booking_date: normalizeDate(row.booking_date),
    start_date: normalizeDate(row.start_date || row.booking_date),
    start_time: toDisplayTime(row.start_time),
    end_date: normalizeDate(row.end_date || row.start_date || row.booking_date),
    end_time: toDisplayTime(row.end_time),
    can_modify: roleCanModify(req, row),
  });
}

async function findBookingById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM bookings WHERE id = ? LIMIT 1',
    [id],
  );

  return rows[0];
}

function ensureBookingOwnerOrStaff(req, booking) {
  if (!booking) return false;
  if (req.user.role === 'customer') {
    return Number(booking.customer_id) === Number(req.user.id);
  }

  return STAFF_ROLES.includes(req.user.role);
}

function normalizeServiceIds(serviceIds, fallbackServiceId) {
  const rawIds = Array.isArray(serviceIds)
    ? serviceIds
    : typeof serviceIds === 'string'
      ? serviceIds.split(',')
      : fallbackServiceId
        ? [fallbackServiceId]
        : [];

  return [...new Set(rawIds.map((id) => Number(id)).filter((id) => id > 0))];
}

function petTypeLabel(type) {
  if (type === 'dog') return '狗狗';
  if (type === 'cat') return '貓咪';
  return '毛孩';
}

function serviceTargetAllowed(service, petType) {
  if (!service.target_pet_type) return true;
  return service.target_pet_type === 'all' || service.target_pet_type === petType;
}

function needsBoardingCapacity(services) {
  return services.some((service) => service.category === 'boarding');
}

function needsDaycareCapacity(services) {
  return services.some((service) => service.category === 'daycare');
}

function getBoardingCapacityColumn(petType) {
  return petType === 'cat' ? 'cat_room_capacity' : 'dog_room_capacity';
}

function getBoardingFullMessage(petType) {
  if (petType === 'cat') return '此期間貓咪住宿房已滿';
  if (petType === 'dog') return '此期間狗狗住宿房已滿';
  return '此期間住宿房已滿';
}

function getBoardingNoCapacityMessage(petType) {
  if (petType === 'cat') return '此門市尚未設定貓咪住宿房數';
  if (petType === 'dog') return '此門市尚未設定狗狗住宿房數';
  return '此門市尚未設定住宿房數';
}

function getBookingRange({ booking_date, start_date, start_time, end_date, end_time }) {
  const finalStartDate = normalizeDate(start_date || booking_date);
  const finalEndDate = normalizeDate(end_date || start_date || booking_date);
  const finalStartTime = normalizeTime(start_time);
  const finalEndTime = end_time ? normalizeTime(end_time) : null;

  return {
    bookingDate: finalStartDate,
    startDate: finalStartDate,
    startTime: finalStartTime,
    endDate: finalEndDate || finalStartDate,
    endTime: finalEndTime,
  };
}

function validateBookingRange({ startDate, startTime, endDate, endTime, services }) {
  if (!startDate || !startTime) {
    return '請選擇開始日期與開始時間';
  }

  const hasBoarding = needsBoardingCapacity(services);
  const hasDaycare = needsDaycareCapacity(services);

  if ((hasBoarding || hasDaycare) && (!endDate || !endTime)) {
    return hasBoarding
      ? '住宿預約請選擇退房日期與退房時間'
      : '安親預約請選擇結束日期與結束時間';
  }

  if (endDate && endTime) {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return '預約起訖時間格式錯誤';
    }

    if (end <= start) {
      return '結束時間必須晚於開始時間';
    }
  }

  return '';
}

async function loadActiveServices(serviceIds, connection = pool) {
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) return [];

  const placeholders = serviceIds.map(() => '?').join(',');
  const [services] = await connection.execute(
    `
    SELECT
      id,
      name,
      category,
      price,
      duration_minutes,
      description,
      target_pet_type
    FROM services
    WHERE id IN (${placeholders})
      AND status = 'active'
    `,
    serviceIds,
  );

  return services;
}

async function loadPetForUser(petId, userId, connection = pool) {
  const [rows] = await connection.execute(
    'SELECT id, type FROM pets WHERE id = ? AND user_id = ? LIMIT 1',
    [petId, userId],
  );

  return rows[0];
}

async function loadPetById(petId, connection = pool) {
  const [rows] = await connection.execute(
    'SELECT id, type FROM pets WHERE id = ? LIMIT 1',
    [petId],
  );

  return rows[0];
}

async function loadStoreCapacity(storeId, connection = pool) {
  const [rows] = await connection.execute(
    `
    SELECT
      id,
      dog_room_capacity,
      cat_room_capacity,
      daycare_capacity
    FROM stores
    WHERE id = ?
    LIMIT 1
    `,
    [storeId],
  );

  return rows[0];
}

async function insertBookingServices(connection, bookingId, services) {
  for (const service of services) {
    await connection.execute(
      `
      INSERT INTO booking_services
        (booking_id, service_id, price_snapshot, duration_snapshot)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        price_snapshot = VALUES(price_snapshot),
        duration_snapshot = VALUES(duration_snapshot)
      `,
      [
        bookingId,
        service.id,
        Number(service.price || 0),
        Number(service.duration_minutes || 0),
      ],
    );
  }
}

async function getBoardingUsedCount({
  storeId,
  startDate,
  endDate,
  petType,
  excludeBookingId = null,
  connection = pool,
}) {
  const finalStartDate = normalizeDate(startDate);
  const finalEndDate = normalizeDate(endDate || startDate);

  const params = [storeId, petType, finalEndDate, finalStartDate];
  let extra = '';

  if (excludeBookingId) {
    extra = 'AND b.id <> ?';
    params.push(excludeBookingId);
  }

  const [rows] = await connection.execute(
    `
    SELECT COUNT(DISTINCT b.id) AS total
    FROM bookings b
    JOIN pets p ON p.id = b.pet_id
    JOIN booking_services bs ON bs.booking_id = b.id
    JOIN services svc ON svc.id = bs.service_id
    WHERE b.store_id = ?
      AND p.type = ?
      AND svc.category = 'boarding'
      AND b.status NOT IN ('cancelled', 'completed')
      AND COALESCE(b.start_date, b.booking_date) < ?
      AND COALESCE(b.end_date, b.booking_date) > ?
      ${extra}
    `,
    params,
  );

  return Number(rows[0]?.total || 0);
}

async function getDaycareUsedCount({
  storeId,
  startDate,
  startTime,
  endDate,
  endTime,
  excludeBookingId = null,
  connection = pool,
}) {
  const finalStartDate = normalizeDate(startDate);
  const finalEndDate = normalizeDate(endDate || startDate);
  const finalStartTime = normalizeTime(startTime);
  const finalEndTime = normalizeTime(endTime || startTime);

  const params = [
    storeId,
    finalStartDate,
    finalEndDate,
    finalEndTime,
    finalStartTime,
  ];

  let extra = '';

  if (excludeBookingId) {
    extra = 'AND b.id <> ?';
    params.push(excludeBookingId);
  }

  const [rows] = await connection.execute(
    `
    SELECT COUNT(DISTINCT b.id) AS total
    FROM bookings b
    JOIN booking_services bs ON bs.booking_id = b.id
    JOIN services svc ON svc.id = bs.service_id
    WHERE b.store_id = ?
      AND svc.category = 'daycare'
      AND b.status NOT IN ('cancelled', 'completed')
      AND COALESCE(b.start_date, b.booking_date) = ?
      AND COALESCE(b.end_date, b.booking_date) = ?
      AND b.start_time < ?
      AND COALESCE(b.end_time, b.start_time) > ?
      ${extra}
    `,
    params,
  );

  return Number(rows[0]?.total || 0);
}

async function checkCapacity({
  storeId,
  startDate,
  startTime,
  endDate,
  endTime,
  petType,
  services,
  excludeBookingId = null,
  connection = pool,
}) {
  const store = await loadStoreCapacity(storeId, connection);
  if (!store) return { unavailable: true, reason: '找不到門市資料' };

  if (needsBoardingCapacity(services)) {
    const capacityColumn = getBoardingCapacityColumn(petType);
    const capacity = Number(store[capacityColumn] || 0);

    if (capacity <= 0) {
      return {
        unavailable: true,
        reason: getBoardingNoCapacityMessage(petType),
      };
    }

    const used = await getBoardingUsedCount({
      storeId,
      startDate,
      endDate,
      petType,
      excludeBookingId,
      connection,
    });

    if (used >= capacity) {
      return {
        unavailable: true,
        reason: getBoardingFullMessage(petType),
      };
    }
  }

  if (needsDaycareCapacity(services)) {
    const capacity = Number(store.daycare_capacity || 0);

    if (capacity <= 0) {
      return { unavailable: true, reason: '此門市尚未設定安親名額' };
    }

    const used = await getDaycareUsedCount({
      storeId,
      startDate,
      startTime,
      endDate,
      endTime,
      excludeBookingId,
      connection,
    });

    if (used >= capacity) {
      return { unavailable: true, reason: '此時段安親名額已滿' };
    }
  }

  return { unavailable: false };
}

async function isSlotUnavailable({
  store_id,
  booking_date,
  start_time,
  excludeBookingId = null,
}) {
  const time = normalizeTime(start_time);
  const date = normalizeDate(booking_date);

  const [blocks] = await pool.execute(
    `
    SELECT id
    FROM booking_time_blocks
    WHERE store_id = ?
      AND block_date = ?
      AND start_time = ?
    LIMIT 1
    `,
    [store_id, date, time],
  );

  if (blocks[0]) {
    return { unavailable: true, reason: '此時段已關閉' };
  }

  const params = [store_id, date, time];
  let extra = '';

  if (excludeBookingId) {
    extra = 'AND id <> ?';
    params.push(excludeBookingId);
  }

  const [rows] = await pool.execute(
    `
    SELECT COUNT(*) AS total
    FROM bookings
    WHERE store_id = ?
      AND booking_date = ?
      AND start_time = ?
      AND status NOT IN ('cancelled', 'completed')
      ${extra}
    `,
    params,
  );

  if (Number(rows[0]?.total || 0) >= SLOT_CAPACITY) {
    return { unavailable: true, reason: '此時段已額滿' };
  }

  return { unavailable: false };
}

export async function getBookingOptions(req, res) {
  const [pets] = await pool.execute(
    `
    SELECT
      id,
      name,
      type,
      breed,
      gender,
      age,
      weight,
      note,
      photo_url
    FROM pets
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    `,
    [req.user.id],
  );

  const [services] = await pool.execute(
    `
    SELECT
      id,
      name,
      category,
      price,
      duration_minutes,
      description,
      target_pet_type
    FROM services
    WHERE status = 'active'
    ORDER BY FIELD(category, 'grooming', 'boarding', 'daycare', 'addon'), id ASC
    `,
  );

  const [stores] = await pool.execute(
    `
    SELECT
      id,
      name,
      area,
      address,
      phone,
      open_time,
      close_time,
      dog_room_capacity,
      cat_room_capacity,
      daycare_capacity
    FROM stores
    WHERE status = 'active'
    ORDER BY id ASC
    `,
  );

  res.json({ pets, services, stores });
}

export async function getAvailability(req, res) {
  const storeId = Number(req.query.store_id);
  const bookingDate = String(req.query.booking_date || '').slice(0, 10);
  const endDate = String(req.query.end_date || bookingDate).slice(0, 10);
  const petId = Number(req.query.pet_id || 0);

  const serviceIds = String(req.query.service_ids || '')
    .split(',')
    .map((id) => Number(id))
    .filter((id) => id > 0);

  if (!storeId || !bookingDate) {
    return res.status(400).json({ message: '請選擇門市與日期' });
  }

  const services = serviceIds.length > 0 ? await loadActiveServices(serviceIds) : [];
  const pet = petId ? await loadPetById(petId) : null;

  const hasBoarding = needsBoardingCapacity(services);
  const hasDaycare = needsDaycareCapacity(services);

  const [blocks] = await pool.execute(
    `
    SELECT start_time, reason
    FROM booking_time_blocks
    WHERE store_id = ?
      AND block_date = ?
    `,
    [storeId, bookingDate],
  );

  const blockMap = new Map(
    blocks.map((row) => [
      String(row.start_time).slice(0, 5),
      row.reason || '此時段已關閉',
    ]),
  );

  const slots = [];

  for (const time of DEFAULT_TIMES) {
    const start = new Date(`${bookingDate}T${time}:00`);

    if (start.getTime() <= Date.now()) {
      slots.push({
        time,
        available: false,
        reason: '已超過目前時間',
      });
      continue;
    }

    if (blockMap.has(time)) {
      slots.push({
        time,
        available: false,
        reason: blockMap.get(time),
      });
      continue;
    }

    if (hasBoarding && !pet) {
      slots.push({
        time,
        available: false,
        reason: '請先選擇寵物，系統才能檢查住宿房型容量',
      });
      continue;
    }

    if (hasBoarding && pet) {
      const store = await loadStoreCapacity(storeId);
      const capacityColumn = getBoardingCapacityColumn(pet.type);
      const capacity = Number(store?.[capacityColumn] || 0);

      if (capacity <= 0) {
        slots.push({
          time,
          available: false,
          reason: getBoardingNoCapacityMessage(pet.type),
        });
        continue;
      }

      const [rows] = await pool.execute(
        `
        SELECT COUNT(DISTINCT b.id) AS total
        FROM bookings b
        JOIN pets p ON p.id = b.pet_id
        JOIN booking_services bs ON bs.booking_id = b.id
        JOIN services svc ON svc.id = bs.service_id
        WHERE b.store_id = ?
          AND p.type = ?
          AND svc.category = 'boarding'
          AND b.status NOT IN ('cancelled', 'completed')
          AND TIMESTAMP(COALESCE(b.start_date, b.booking_date), b.start_time)
                < TIMESTAMP(?, COALESCE(?, '23:59:00'))
          AND TIMESTAMP(
                COALESCE(b.end_date, b.start_date, b.booking_date),
                COALESCE(b.end_time, '23:59:00')
              ) > TIMESTAMP(?, ?)
        `,
        [
          storeId,
          pet.type,
          endDate,
          req.query.end_time || '23:59:00',
          bookingDate,
          normalizeTime(time),
        ],
      );

      const used = Number(rows[0]?.total || 0);

      if (used >= capacity) {
        slots.push({
          time,
          available: false,
          reason: getBoardingFullMessage(pet.type),
        });
        continue;
      }
    }

    /**
     * 安親：用同一天時間區間判斷是否重疊。
     * 如果前端還沒選 end_time，這裡先不做安親容量檢查，
     * 等送出預約時 createBooking() 仍會做最終檢查。
     */
    if (hasDaycare && req.query.end_time) {
      const unavailableCapacity = await checkCapacity({
        storeId,
        startDate: bookingDate,
        startTime: time,
        endDate: bookingDate,
        endTime: String(req.query.end_time),
        petType: pet?.type || 'dog',
        services,
      });

      if (unavailableCapacity.unavailable) {
        slots.push({
          time,
          available: false,
          reason: unavailableCapacity.reason,
        });
        continue;
      }
    }

    /**
     * 一般美容：仍使用舊的單一時段容量。
     */
    if (!hasBoarding && !hasDaycare) {
      const [rows] = await pool.execute(
        `
        SELECT COUNT(*) AS total
        FROM bookings
        WHERE store_id = ?
          AND booking_date = ?
          AND start_time = ?
          AND status NOT IN ('cancelled', 'completed')
        `,
        [storeId, bookingDate, normalizeTime(time)],
      );

      if (Number(rows[0]?.total || 0) >= SLOT_CAPACITY) {
        slots.push({
          time,
          available: false,
          reason: '此時段已額滿',
        });
        continue;
      }
    }

    slots.push({
      time,
      available: true,
    });
  }

  res.json({ slots });
}

export async function listBookings(req, res) {
  const isCustomer = req.user.role === 'customer';

  const sql = `
    SELECT
      b.*,
      u.name AS customer_name,
      u.phone AS phone,
      p.name AS pet_name,
      p.type AS pet_type,
      s.name AS service_name,
      s.price AS service_price,
      s.duration_minutes,
      COALESCE(service_summary.service_ids, CAST(s.id AS CHAR)) AS service_ids,
      COALESCE(service_summary.service_names, s.name) AS service_names,
      COALESCE(service_summary.service_total_price, s.price, 0) AS service_total_price,
      COALESCE(service_summary.service_total_duration, s.duration_minutes, 0) AS service_total_duration,
      COALESCE(service_summary.requires_boarding, CASE WHEN s.category = 'boarding' THEN 1 ELSE 0 END) AS requires_boarding,
      COALESCE(service_summary.requires_daycare, CASE WHEN s.category = 'daycare' THEN 1 ELSE 0 END) AS requires_daycare,
      st.name AS store_name,
      st.dog_room_capacity AS store_dog_room_capacity,
      st.cat_room_capacity AS store_cat_room_capacity,
      st.daycare_capacity AS store_daycare_capacity,
      staff.name AS groomer_name
    FROM bookings b
    JOIN users u ON u.id = b.customer_id
    JOIN pets p ON p.id = b.pet_id
    JOIN services s ON s.id = b.service_id
    JOIN stores st ON st.id = b.store_id
    LEFT JOIN users staff ON staff.id = b.staff_id
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
    ${isCustomer ? 'WHERE b.customer_id = ?' : ''}
    ORDER BY COALESCE(b.start_date, b.booking_date) DESC, b.start_time DESC, b.id DESC
  `;

  const params = isCustomer ? [req.user.id] : [];
  const [rows] = await pool.execute(sql, params);

  res.json({
    bookings: rows.map(addCanModify(req)),
  });
}

export async function listMyBookings(req, res) {
  return listBookings(req, res);
}

export async function createBooking(req, res) {
  const {
    pet_id,
    service_id,
    service_ids,
    store_id,
    booking_date,
    start_date,
    start_time,
    end_date,
    end_time,
    note,
  } = req.body;

  const normalizedServiceIds = normalizeServiceIds(service_ids, service_id);

  if (
    !pet_id ||
    normalizedServiceIds.length === 0 ||
    !store_id ||
    !(start_date || booking_date) ||
    !start_time
  ) {
    return res.status(400).json({ message: '請填寫完整預約資料' });
  }

  const pet = await loadPetForUser(pet_id, req.user.id);

  if (!pet) {
    return res.status(403).json({ message: '這不是你的寵物資料' });
  }

  const services = await loadActiveServices(normalizedServiceIds);

  if (services.length !== normalizedServiceIds.length) {
    return res.status(400).json({ message: '部分服務項目不存在或已停用' });
  }

  const invalid = services.find(
    (service) => !serviceTargetAllowed(service, pet.type),
  );

  if (invalid) {
    return res.status(400).json({
      message: `${invalid.name} 不適用於${petTypeLabel(pet.type)}`,
    });
  }

  const bookingRange = getBookingRange({
    booking_date,
    start_date,
    start_time,
    end_date,
    end_time,
  });

  const rangeError = validateBookingRange({
    ...bookingRange,
    services,
  });

  if (rangeError) {
    return res.status(400).json({ message: rangeError });
  }

  const start = startDateTime(bookingRange.startDate, bookingRange.startTime);

  if (Number.isNaN(start.getTime())) {
    return res.status(400).json({ message: '預約日期或時間格式錯誤' });
  }

  if (start.getTime() <= Date.now()) {
    return res.status(400).json({ message: '不可預約過去的時間' });
  }

  const unavailableSlot = await isSlotUnavailable({
    store_id,
    booking_date: bookingRange.bookingDate,
    start_time: bookingRange.startTime,
  });

  if (unavailableSlot.unavailable) {
    return res.status(400).json({ message: unavailableSlot.reason });
  }

  const unavailableCapacity = await checkCapacity({
    storeId: store_id,
    startDate: bookingRange.startDate,
    startTime: bookingRange.startTime,
    endDate: bookingRange.endDate,
    endTime: bookingRange.endTime,
    petType: pet.type,
    services,
  });

  if (unavailableCapacity.unavailable) {
    return res.status(400).json({ message: unavailableCapacity.reason });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const serviceOrder = new Map(
      normalizedServiceIds.map((id, index) => [id, index]),
    );

    services.sort((a, b) => serviceOrder.get(a.id) - serviceOrder.get(b.id));

    const primaryServiceId = services[0].id;

    const [result] = await connection.execute(
      `
      INSERT INTO bookings
        (
          customer_id,
          pet_id,
          service_id,
          store_id,
          booking_date,
          start_date,
          start_time,
          end_date,
          end_time,
          note,
          status
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `,
      [
        req.user.id,
        pet_id,
        primaryServiceId,
        store_id,
        bookingRange.bookingDate,
        bookingRange.startDate,
        bookingRange.startTime,
        bookingRange.endDate,
        bookingRange.endTime,
        note || null,
      ],
    );

    await insertBookingServices(connection, result.insertId, services);

    await connection.commit();

    res.status(201).json({
      id: result.insertId,
      message: '預約已建立',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create booking error:', error);

    res.status(500).json({
      message: '建立預約失敗，請稍後再試',
    });
  } finally {
    connection.release();
  }
}

export async function updateBooking(req, res) {
  const { id } = req.params;

  const {
    pet_id,
    service_id,
    service_ids,
    store_id,
    booking_date,
    start_date,
    start_time,
    end_date,
    end_time,
    note,
  } = req.body;

  const booking = await findBookingById(id);

  if (!booking) {
    return res.status(404).json({ message: '找不到預約資料' });
  }

  if (!ensureBookingOwnerOrStaff(req, booking)) {
    return res.status(403).json({ message: '無權限修改此預約' });
  }

  if (['completed', 'cancelled'].includes(booking.status)) {
    return res.status(400).json({ message: '此預約狀態不可修改' });
  }

  if (!roleCanModify(req, booking)) {
    return res.status(400).json({
      message:
        req.user.role === 'customer'
          ? '服務開始前 4 小時內不可修改預約'
          : '服務開始後不可修改預約',
    });
  }

  const nextPetId = pet_id || booking.pet_id;
  const nextStoreId = store_id || booking.store_id;

  const nextBookingRange = getBookingRange({
    booking_date:
      booking_date ||
      start_date ||
      normalizeDate(booking.booking_date),
    start_date:
      start_date ||
      booking_date ||
      normalizeDate(booking.start_date || booking.booking_date),
    start_time: start_time || booking.start_time,
    end_date:
      end_date ||
      normalizeDate(
        booking.end_date || booking.start_date || booking.booking_date,
      ),
    end_time: end_time || booking.end_time,
  });

  const nextServiceIds = normalizeServiceIds(service_ids, service_id);

  const pet =
    req.user.role === 'customer'
      ? await loadPetForUser(nextPetId, req.user.id)
      : await loadPetById(nextPetId);

  if (!pet) {
    return res.status(req.user.role === 'customer' ? 403 : 404).json({
      message:
        req.user.role === 'customer'
          ? '這不是你的寵物資料'
          : '找不到寵物資料',
    });
  }

  let services = [];

  if (nextServiceIds.length > 0) {
    services = await loadActiveServices(nextServiceIds);

    if (services.length !== nextServiceIds.length) {
      return res.status(400).json({ message: '部分服務項目不存在或已停用' });
    }

    const invalid = services.find(
      (service) => !serviceTargetAllowed(service, pet.type),
    );

    if (invalid) {
      return res.status(400).json({
        message: `${invalid.name} 不適用於${petTypeLabel(pet.type)}`,
      });
    }
  } else {
    const [bookingServiceRows] = await pool.execute(
      `
      SELECT service_id
      FROM booking_services
      WHERE booking_id = ?
      ORDER BY id ASC
      `,
      [id],
    );

    const existingServiceIds = bookingServiceRows
      .map((row) => Number(row.service_id))
      .filter((item) => item > 0);

    services = await loadActiveServices(
      existingServiceIds.length > 0 ? existingServiceIds : [booking.service_id],
    );
  }

  const rangeError = validateBookingRange({
    ...nextBookingRange,
    services,
  });

  if (rangeError) {
    return res.status(400).json({ message: rangeError });
  }

  const start = startDateTime(
    nextBookingRange.startDate,
    nextBookingRange.startTime,
  );

  if (Number.isNaN(start.getTime())) {
    return res.status(400).json({ message: '預約日期或時間格式錯誤' });
  }

  if (start.getTime() <= Date.now()) {
    return res.status(400).json({ message: '不可修改為過去的時間' });
  }

  const unavailableSlot = await isSlotUnavailable({
    store_id: nextStoreId,
    booking_date: nextBookingRange.bookingDate,
    start_time: nextBookingRange.startTime,
    excludeBookingId: id,
  });

  if (unavailableSlot.unavailable) {
    return res.status(400).json({ message: unavailableSlot.reason });
  }

  const unavailableCapacity = await checkCapacity({
    storeId: nextStoreId,
    startDate: nextBookingRange.startDate,
    startTime: nextBookingRange.startTime,
    endDate: nextBookingRange.endDate,
    endTime: nextBookingRange.endTime,
    petType: pet.type,
    services,
    excludeBookingId: id,
  });

  if (unavailableCapacity.unavailable) {
    return res.status(400).json({ message: unavailableCapacity.reason });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let nextPrimaryServiceId = booking.service_id;

    if (nextServiceIds.length > 0) {
      const serviceOrder = new Map(
        nextServiceIds.map((serviceId, index) => [serviceId, index]),
      );

      services.sort(
        (a, b) => serviceOrder.get(a.id) - serviceOrder.get(b.id),
      );

      nextPrimaryServiceId = services[0].id;

      await connection.execute(
        'DELETE FROM booking_services WHERE booking_id = ?',
        [id],
      );

      await insertBookingServices(connection, id, services);
    }

    await connection.execute(
      `
      UPDATE bookings
      SET
        pet_id = ?,
        service_id = ?,
        store_id = ?,
        booking_date = ?,
        start_date = ?,
        start_time = ?,
        end_date = ?,
        end_time = ?,
        note = ?
      WHERE id = ?
      `,
      [
        nextPetId,
        nextPrimaryServiceId,
        nextStoreId,
        nextBookingRange.bookingDate,
        nextBookingRange.startDate,
        nextBookingRange.startTime,
        nextBookingRange.endDate,
        nextBookingRange.endTime,
        note ?? booking.note,
        id,
      ],
    );

    await connection.commit();

    res.json({ message: '預約已更新' });
  } catch (error) {
    await connection.rollback();
    console.error('Update booking error:', error);

    res.status(500).json({
      message: '更新預約失敗，請稍後再試',
    });
  } finally {
    connection.release();
  }
}

export async function deleteBooking(req, res) {
  const { id } = req.params;
  const booking = await findBookingById(id);
  if (!booking) return res.status(404).json({ message: '找不到預約資料' });
  if (!ensureBookingOwnerOrStaff(req, booking)) return res.status(403).json({ message: '無權限刪除此預約' });
  if (['completed', 'cancelled'].includes(booking.status)) return res.status(400).json({ message: '此預約狀態不可刪除' });
  if (!roleCanModify(req, booking)) {
    return res.status(400).json({ message: req.user.role === 'customer' ? '服務開始前 4 小時內不可刪除預約' : '服務開始後不可刪除預約' });
  }
  await pool.execute('DELETE FROM bookings WHERE id = ?', [id]);
  res.json({ message: '預約已刪除' });
}

export async function updateBookingStatus(req, res) {
  const { id } = req.params;
  const { status, staff_id, photo_url } = req.body;
  const allowedStatuses = ['pending', 'confirmed', 'checked_in', 'in_service', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(status)) return res.status(400).json({ message: '不支援的預約狀態' });
  const completedAt = status === 'completed' ? new Date() : null;
  await pool.execute(
    `UPDATE bookings SET status = ?, staff_id = COALESCE(?, staff_id), photo_url = COALESCE(?, photo_url), completed_at = COALESCE(?, completed_at) WHERE id = ?`,
    [status, staff_id || null, photo_url || null, completedAt, id],
  );
  res.json({ message: status === 'completed' ? '服務已完成，會員可查看完成照片與通知' : '預約狀態已更新' });
}

export async function listTimeBlocks(req, res) {
  const [rows] = await pool.execute(
    `SELECT tb.*, st.name AS store_name FROM booking_time_blocks tb JOIN stores st ON st.id = tb.store_id ORDER BY tb.block_date DESC, tb.start_time DESC, tb.id DESC`,
  );
  res.json({ blocks: rows.map((row) => ({ ...row, block_date: normalizeDate(row.block_date), start_time: String(row.start_time).slice(0, 5) })) });
}

export async function createTimeBlock(req, res) {
  const { store_id, block_date, start_time, reason } = req.body;
  if (!store_id || !block_date || !start_time) return res.status(400).json({ message: '請選擇門市、日期與時段' });
  const start = startDateTime(block_date, start_time);
  if (start.getTime() <= Date.now()) return res.status(400).json({ message: '不可關閉已過去的時段' });
  const [result] = await pool.execute(
    `INSERT INTO booking_time_blocks (store_id, block_date, start_time, reason, created_by) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE reason = VALUES(reason), created_by = VALUES(created_by)`,
    [store_id, normalizeDate(block_date), normalizeTime(start_time), reason || '此時段已滿', req.user.id],
  );
  res.status(201).json({ id: result.insertId, message: '時段已關閉' });
}

export async function deleteTimeBlock(req, res) {
  await pool.execute('DELETE FROM booking_time_blocks WHERE id = ?', [req.params.id]);
  res.json({ message: '時段已重新開放' });
}
