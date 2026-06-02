import { pool } from '../config/db.js';

export async function createReview(req, res) {
  const { booking_id, service_id, rating, comment, photo_url } = req.body;
  const numericRating = Number(rating);
  if (!numericRating || numericRating < 1 || numericRating > 5) return res.status(400).json({ message: '請選擇 1 到 5 星評分' });
  if (!comment || !comment.trim()) return res.status(400).json({ message: '請填寫評論內容' });

  if (booking_id) {
    const [rows] = await pool.execute('SELECT id FROM bookings WHERE id = ? AND customer_id = ? LIMIT 1', [booking_id, req.user.id]);
    if (!rows[0]) return res.status(403).json({ message: '只能評論自己的預約' });
  }

  const [result] = await pool.execute(
    `INSERT INTO reviews (booking_id, customer_id, service_id, rating, comment, photo_url, status)
     VALUES (?, ?, ?, ?, ?, ?, 'visible')`,
    [booking_id || null, req.user.id, service_id || null, numericRating, comment.trim(), photo_url || null],
  );
  res.status(201).json({ id: result.insertId, message: '評論已送出' });
}
