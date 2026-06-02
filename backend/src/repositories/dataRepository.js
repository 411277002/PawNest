import { pool } from '../config/db.js';

export async function findMany(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function findOne(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}

export async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

export async function withTransaction(callback) {
  let connection;

  try {
    connection = await pool.getConnection();

    // 避免拿到已經被 MySQL 關掉的舊連線
    await connection.ping();

    await connection.beginTransaction();

    const result = await callback(connection);

    await connection.commit();

    return result;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }

    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}