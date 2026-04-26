# KEKAR JAYA Petshop Backend

Backend API untuk Toko Kekar Jaya yang connect ke MySQL database.

## 1) Install dependencies
```powershell
npm install express mysql2 cors dotenv
```

## 2) Setup environment (.env sudah ada di folder ini)
File `.env` sudah disiapkan dengan konfigurasi default.
Jika MySQL password-nya beda, ubah di `.env`.

## 3) Jalankan MySQL & seed data terlebih dahulu
```powershell
# Jalankan schema dan seed dari database folder
mysql -u root -p < database/mysql/01_schema.sql
mysql -u root -p < database/mysql/02_seed.sql
```

## 4) Jalankan backend server
```powershell
node server.js
```

Seharusnya tampil:
```
🚀 KEKAR JAYA Backend API running on http://localhost:5000
📊 Health check: http://localhost:5000/health
📦 Products endpoint: http://localhost:5000/products
```

## 5) Test endpoint di browser
- Health: http://localhost:5000/health
- Products: http://localhost:5000/products
- Categories: http://localhost:5000/categories
- Single product: http://localhost:5000/products/7

## 6) Frontend sudah diupdate
ProductCatalog.tsx sekarang fetch dari `http://localhost:5000/products` bukan dari localStorage.

Jadi workflow sekarang:
1. npm run dev (frontend Vite di port 3000)
2. node server.js (backend Express di port 5000)
3. Data produk dari MySQL via REST API

## Endpoints tersedia

### GET /products
Ambil semua produk aktif + variants
Response: Array of products

### GET /categories
Ambil semua kategori

### GET /products/:id
Ambil 1 produk + variants

### POST /orders (WIP)
Buat pesanan (akan di-implement nanti)

## Trouble Shooting

**Port 5000 sudah terpakai?**
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**MySQL connection error?**
- Pastikan MySQL running
- Cek `.env` - DB_PASSWORD dan DB_NAME sudah benar?
- Cek database `kekar_jaya_petshop` sudah dibuat

**Image loading error?**
- Pastikan folder `public/images/` ada dengan file gambar
- Atau update `image_url` di database sesuai lokasi real gambar
