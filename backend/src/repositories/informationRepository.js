import { findMany } from './dataRepository.js';

function createLimitClause(limit) {
  const value = Number(limit);

  if (!Number.isInteger(value) || value <= 0) {
    return '';
  }

  return `LIMIT ${value}`;
}

export function listActiveServices({ limit } = {}) {
  const suffix = createLimitClause(limit);

  return findMany(
    `
    SELECT
      id,
      name,
      category,
      price,
      duration_minutes,
      description,
      target_pet_type,
      image_url,
      badge,
      status
    FROM services
    WHERE status = 'active'
    ORDER BY FIELD(category, 'grooming', 'boarding', 'daycare', 'addon'), id ASC
    ${suffix}
    `,
  );
}

export function listActiveActivities({ limit } = {}) {
  const suffix = createLimitClause(limit);

  return findMany(
    `
    SELECT
      id,
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
      status
    FROM activities
    WHERE status = 'active'
    ORDER BY sort_order ASC, id DESC
    ${suffix}
    `,
  );
}

export function listActiveStores({ limit } = {}) {
  const suffix = createLimitClause(limit);

  return findMany(
    `
    SELECT
      id,
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
      status
    FROM stores
    WHERE status = 'active'
    ORDER BY id ASC
    ${suffix}
    `,
  );
}

export function listVisibleReviews({ limit = 50 } = {}) {
  const suffix = createLimitClause(limit);

  return findMany(
    `
    SELECT
      r.id,
      r.rating,
      r.comment,
      r.photo_url,
      r.reply,
      r.replied_at,
      r.created_at,
      u.name AS customer_name,
      s.name AS service_name
    FROM reviews r
    JOIN users u ON u.id = r.customer_id
    LEFT JOIN services s ON s.id = r.service_id
    WHERE r.status = 'visible'
    ORDER BY r.created_at DESC, r.id DESC
    ${suffix}
    `,
  );
}

export function findActiveActivityById(id) {
  return findMany(
    `
    SELECT
      id,
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
      status
    FROM activities
    WHERE id = ? AND status = 'active'
    LIMIT 1
    `,
    [id],
  ).then((rows) => rows[0] || null);
}