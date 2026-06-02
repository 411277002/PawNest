import { findMany } from './dataRepository.js';

export function listActiveServices({ limit } = {}) {
  const suffix = limit ? 'LIMIT ?' : '';
  const params = limit ? [limit] : [];

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
    params,
  );
}

export function listActiveActivities() {
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
      sort_order
    FROM activities
    WHERE status = 'active'
    ORDER BY sort_order ASC, id DESC
    `,
  );
}

export function listActiveStores({ limit } = {}) {
  const suffix = limit ? 'LIMIT ?' : '';
  const params = limit ? [limit] : [];

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
      daycare_capacity
    FROM stores
    WHERE status = 'active'
    ORDER BY id ASC
    ${suffix}
    `,
    params,
  );
}

export function listVisibleReviews({ limit = 50 } = {}) {
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
    LIMIT ?
    `,
    [limit],
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
      sort_order
    FROM activities
    WHERE id = ?
      AND status = 'active'
    LIMIT 1
    `,
    [id],
  ).then((rows) => rows[0] || null);
}