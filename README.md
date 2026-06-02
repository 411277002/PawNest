# PawNest 寵物美容 / 住宿預約系統

這版已把前台與後台的視覺風格統一為同一套品牌：奶油底色、橘色重點、深色主按鈕、圓角卡片與柔和陰影。

## 頁面入口

- 顧客前台：http://localhost:5173/
- 會員登入：http://localhost:5173/login
- 員工 / 管理員後台：http://localhost:5173/admin

## 測試帳號

後台登入：

- 管理員：admin / admin123
- 員工：staff / staff123

## 啟動前端

```bash
pnpm install
pnpm dev
```

如果 pnpm 又提示 build scripts 被擋住，請執行：

```bash
pnpm approve-builds
```

看到 `Do you approve? (y/N)` 時輸入 `y` 再按 Enter。

## 後端雛形

`backend/` 裡面保留 Node.js + Express + MySQL 的 API 雛形，包含：

- 登入 API 範例
- 預約 API 範例
- MySQL schema
- seed 測試資料

正式開發時建議先完成：會員註冊 / 登入、員工登入、服務項目、毛孩資料、預約資料表與後台 CRUD。
