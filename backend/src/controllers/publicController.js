import { pool } from '../config/db.js';
import {
  getHomeInformationService,
  getPublicActivitiesService,
  getPublicActivityService,
  getPublicReviewsService,
  getPublicServicesService,
  getPublicStoresService,
} from '../services/informationService.js';

function respondWithError(res, error, fallbackMessage) {
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: fallbackMessage });
}

function clean(value) {
  return value === undefined || value === '' ? null : String(value).trim();
}

export async function getServices(req, res) {
  try {
    const services = await getPublicServicesService();
    return res.json({ services });
  } catch (error) {
    return respondWithError(res, error, '讀取服務資料失敗');
  }
}

export async function getActivities(req, res) {
  try {
    const activities = await getPublicActivitiesService();
    return res.json({ activities });
  } catch (error) {
    return respondWithError(res, error, '讀取活動資料失敗');
  }
}

export async function getActivity(req, res) {
  try {
    const activity = await getPublicActivityService(Number(req.params.id));
    if (!activity) return res.status(404).json({ message: '找不到活動資料' });
    return res.json({ activity });
  } catch (error) {
    return respondWithError(res, error, '讀取活動資料失敗');
  }
}

export async function getStores(req, res) {
  try {
    const stores = await getPublicStoresService();
    return res.json({ stores });
  } catch (error) {
    return respondWithError(res, error, '讀取門市資料失敗');
  }
}

export async function getReviews(req, res) {
  try {
    const reviews = await getPublicReviewsService();
    return res.json({ reviews });
  } catch (error) {
    return respondWithError(res, error, '讀取評論資料失敗');
  }
}

export async function getHome(req, res) {
  try {
    const home = await getHomeInformationService();
    return res.json(home);
  } catch (error) {
    return respondWithError(res, error, '讀取首頁資料失敗');
  }
}

export async function submitContactMessage(req, res) {
  try {
    const name = clean(req.body.name);
    const email = clean(req.body.email);
    const phone = clean(req.body.phone);
    const subject = clean(req.body.subject);
    const message = clean(req.body.message);

    if (!name) {
      return res.status(400).json({ message: '請填寫姓名' });
    }

    if (!email) {
      return res.status(400).json({ message: '請填寫 Email，方便我們回覆您' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Email 格式不正確' });
    }

    if (!message) {
      return res.status(400).json({ message: '請填寫留言內容' });
    }

    const [result] = await pool.execute(
      `
      INSERT INTO contact_messages
        (name, email, phone, subject, message, status)
      VALUES (?, ?, ?, ?, ?, 'new')
      `,
      [name, email, phone, subject, message],
    );

    return res.status(201).json({
      id: result.insertId,
      message: '留言已送出，我們會盡快與您聯繫',
    });
  } catch (error) {
    return respondWithError(res, error, '送出留言失敗');
  }
}