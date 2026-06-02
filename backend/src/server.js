import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import bookingsRoutes from './routes/bookingsRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import petsRoutes from './routes/petsRoutes.js';
import reviewsRoutes from './routes/reviewsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN ||
      process.env.FRONTEND_ORIGIN ||
      'http://localhost:5173',
    credentials: true,
  }),
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'PawNest API' });
});

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('Server error:', err);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      message: '圖片檔案太大，請改用較小的圖片後再上傳。',
    });
  }

  return res.status(500).json({
    message: '伺服器發生錯誤，請稍後再試。',
  });
});

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  console.log(`PawNest API running on http://localhost:${port}`);
});