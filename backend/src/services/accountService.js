import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  createCustomerUser,
  findActiveUserByLoginId,
  findUserById,
  findUserByUsernameOrEmail,
} from '../repositories/accountRepository.js';
import { findOne } from '../repositories/dataRepository.js';

function clean(value) {
  return value === undefined || value === '' ? null : value;
}

function signUser(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      username: user.username,
      store_id: user.store_id || null,
      membership_tier: user.membership_tier,
    },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '8h' },
  );
}

async function getAnnualSpending(userId) {
  const row = await findOne(
    `
    SELECT COALESCE(SUM(final_amount), 0) AS annual_spending
    FROM service_transactions
    WHERE customer_id = ?
      AND paid_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `,
    [userId],
  );

  return Number(row?.annual_spending || 0);
}

async function formatUser(user) {
  const annualSpending =
    user.role === 'customer' ? await getAnnualSpending(user.id) : 0;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    store_id: user.store_id || null,
    membership_tier: user.membership_tier,
    membership_points: user.membership_points,
    vip_expires_at: user.vip_expires_at,
    annual_spending: annualSpending,
  };
}

export async function loginService({ account, username, email, password }) {
  const loginId = account || username || email;

  if (!loginId || !password) {
    const error = new Error('請輸入帳號與密碼');
    error.statusCode = 400;
    throw error;
  }

  const user = await findActiveUserByLoginId(loginId);

  if (!user) {
    const error = new Error('帳號或密碼錯誤');
    error.statusCode = 401;
    throw error;
  }

  const ok = user.password_hash?.startsWith('plain:')
    ? password === user.password_hash.slice(6)
    : await bcrypt.compare(password, user.password_hash);

  if (!ok) {
    const error = new Error('帳號或密碼錯誤');
    error.statusCode = 401;
    throw error;
  }

  return {
    token: signUser(user),
    user: await formatUser(user),
  };
}

export async function registerService({ name, email, username, password, phone }) {
  const finalName = String(name || '').trim();
  const finalEmail = String(email || '').trim().toLowerCase();
  const finalUsername = String(username || email || '').trim().toLowerCase();
  const finalPassword = String(password || '');

  if (!finalName) {
    const error = new Error('請輸入姓名');
    error.statusCode = 400;
    throw error;
  }

  if (!finalEmail) {
    const error = new Error('請輸入 Email');
    error.statusCode = 400;
    throw error;
  }

  if (!finalEmail.includes('@')) {
    const error = new Error('Email 格式不正確');
    error.statusCode = 400;
    throw error;
  }

  if (!finalPassword || finalPassword.length < 6) {
    const error = new Error('密碼至少需要 6 個字元');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await findUserByUsernameOrEmail(finalUsername, finalEmail);

  if (existingUser) {
    const error = new Error('此 Email 或帳號已被註冊');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(finalPassword, 10);

  const result = await createCustomerUser({
    name: finalName,
    email: finalEmail,
    username: finalUsername,
    passwordHash,
    phone: clean(phone),
  });

  const user = await findUserById(result.insertId);

  return {
    token: signUser(user),
    user: await formatUser(user),
  };
}

export async function meService(userId) {
  const user = await findUserById(userId);

  if (!user) {
    const error = new Error('找不到使用者資料');
    error.statusCode = 404;
    throw error;
  }

  return {
    user: await formatUser(user),
  };
}