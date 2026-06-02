import {
  loginService,
  meService,
  registerService,
} from '../services/accountService.js';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

function respondWithError(res, error, fallbackMessage) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(fallbackMessage, error);
  }

  return res.status(statusCode).json({
    message: error.message || fallbackMessage,
  });
}

export async function login(req, res) {
  try {
    const result = await loginService(req.body);
    return res.json(result);
  } catch (error) {
    return respondWithError(res, error, '登入失敗，請稍後再試');
  }
}

export async function register(req, res) {
  try {
    const result = await registerService(req.body);

    return res.status(201).json({
      ...result,
      message: '註冊成功',
    });
  } catch (error) {
    return respondWithError(res, error, '註冊失敗，請稍後再試');
  }
}

export async function me(req, res) {
  try {
    const result = await meService(req.user.id);
    return res.json(result);
  } catch (error) {
    return respondWithError(res, error, '讀取使用者資料失敗');
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { name, email, phone, address } = req.body;

    if (!userId) {
      return res.status(401).json({ message: '請先登入' });
    }

    if (!name || !email) {
      return res.status(400).json({ message: '姓名與 Email 為必填' });
    }

    await pool.query(
      `
      UPDATE users
      SET name = ?, email = ?, phone = ?, address = ?
      WHERE id = ?
      `,
      [name, email, phone || null, address || null, userId],
    );

    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        username,
        email,
        phone,
        address,
        role,
        membership_tier,
        membership_points,
        vip_expires_at,
        status
      FROM users
      WHERE id = ?
      `,
      [userId],
    );

    return res.json({
      message: '會員資料已更新',
      user: rows[0],
    });
  } catch (error) {
    console.error('更新會員資料失敗', error);
    return res.status(500).json({ message: '更新會員資料失敗' });
  }
}

export async function changePassword(req, res) {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: '請先登入' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '請輸入目前密碼與新密碼' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: '新密碼至少需要 6 個字元' });
    }

    const [rows] = await pool.query(
      'SELECT id, password FROM users WHERE id = ?',
      [userId],
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: '找不到會員資料' });
    }

    const passwordOk = await bcrypt.compare(currentPassword, user.password);

    if (!passwordOk) {
      return res.status(400).json({ message: '目前密碼不正確' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId],
    );

    return res.json({ message: '密碼已修改，請下次使用新密碼登入' });
  } catch (error) {
    console.error('修改密碼失敗', error);
    return res.status(500).json({ message: '修改密碼失敗' });
  }
}