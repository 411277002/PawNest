import { findOne, execute } from './dataRepository.js';

export function findActiveUserByLoginId(loginId, connection) {
  return findOne(
    `
    SELECT *
    FROM users
    WHERE (username = ? OR email = ?)
      AND status = 'active'
    LIMIT 1
    `,
    [loginId, loginId],
    connection,
  );
}

export function findUserById(id, connection) {
  return findOne(
    `
    SELECT
      id,
      name,
      username,
      email,
      phone,
      role,
      store_id,
      membership_tier,
      membership_points,
      vip_expires_at,
      status,
      created_at
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [id],
    connection,
  );
}

export function findUserByUsernameOrEmail(username, email, connection) {
  return findOne(
    `
    SELECT id
    FROM users
    WHERE username = ? OR email = ?
    LIMIT 1
    `,
    [username, email],
    connection,
  );
}

export function createCustomerUser(
  { name, email, username, passwordHash, phone },
  connection,
) {
  return execute(
    `
    INSERT INTO users
      (
        name,
        email,
        username,
        password_hash,
        phone,
        role,
        membership_tier,
        membership_points,
        vip_expires_at,
        status
      )
    VALUES
      (?, ?, ?, ?, ?, 'customer', 'general', 0, NULL, 'active')
    `,
    [name, email, username, passwordHash, phone || null],
    connection,
  );
}
