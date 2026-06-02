# PawNest Backend API

這是可以接 MySQL 的 Node.js + Express 後端雛形，適合接目前的 React 前端。

## 啟動方式

1. 建立 MySQL 資料庫與資料表

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

2. 設定環境變數

```bash
cp .env.example .env
```

修改 `.env` 裡的 MySQL 密碼。

3. 安裝與啟動

```bash
npm install
npm run dev
```

API 會跑在：

```text
http://localhost:3000
```

## 測試帳號

密碼皆為：`123456`

- 管理員：admin
- 員工：staff
- 會員：customer

## 主要 API

```text
POST /api/auth/login
GET  /api/auth/me
GET  /api/bookings
POST /api/bookings
PATCH /api/bookings/:id/status
```
