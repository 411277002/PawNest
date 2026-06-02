import { pool } from '../config/db.js';

export async function listMyPets(req, res) {
  const [rows] = await pool.execute(
    `SELECT id, name, type, breed, gender, age, weight, note, photo_url, created_at
     FROM pets
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC`,
    [req.user.id],
  );
  res.json({ pets: rows });
}

export async function createPet(req, res) {
  const { name, type = 'dog', breed, gender, age, weight, note, photo_url } = req.body;
  if (!name) return res.status(400).json({ message: '請輸入寵物名稱' });

  const [result] = await pool.execute(
    `INSERT INTO pets (user_id, name, type, breed, gender, age, weight, note, photo_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, name, type, breed || null, gender || null, age || null, weight || null, note || null, photo_url || null],
  );
  res.status(201).json({ id: result.insertId, message: '寵物資料已建立' });
}

export async function updatePet(req, res) {
  const { id } = req.params;
  const { name, type = 'dog', breed, gender, age, weight, note, photo_url } = req.body;
  if (!name) return res.status(400).json({ message: '請輸入寵物名稱' });

  const [result] = await pool.execute(
    `UPDATE pets
     SET name = ?, type = ?, breed = ?, gender = ?, age = ?, weight = ?, note = ?, photo_url = ?
     WHERE id = ? AND user_id = ?`,
    [name, type, breed || null, gender || null, age || null, weight || null, note || null, photo_url || null, id, req.user.id],
  );
  if (result.affectedRows === 0) return res.status(404).json({ message: '找不到寵物資料' });
  res.json({ message: '寵物資料已更新' });
}

export async function deletePet(req, res) {
  const { id } = req.params;
  const [used] = await pool.execute('SELECT id FROM bookings WHERE pet_id = ? LIMIT 1', [id]);
  if (used[0]) return res.status(400).json({ message: '此寵物已有預約紀錄，不能直接刪除' });

  const [result] = await pool.execute('DELETE FROM pets WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (result.affectedRows === 0) return res.status(404).json({ message: '找不到寵物資料' });
  res.json({ message: '寵物資料已刪除' });
}
