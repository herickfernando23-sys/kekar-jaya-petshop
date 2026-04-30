# KEKAR JAYA PHP Backend

Backend API versi PHP (PDO + MySQL) untuk menggantikan backend Node.js.

## Jalankan API PHP

1. Masuk ke folder backend PHP:

```powershell
cd "c:\Users\heric\Downloads\KEKAR JAYAcc\KEKAR JAYA\backend-php"
```

2. Jalankan server bawaan PHP di port 5000 (pakai php.ini lokal agar driver MySQL aktif):

```powershell
php -c php.ini -S localhost:5000 index.php
```

3. Cek endpoint:

- Health: http://localhost:5000/health
- Products: http://localhost:5000/products

## Konfigurasi Database

API membaca kredensial dari file `.env` di folder root proyek (`KEKAR JAYA/.env`):

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## Endpoint yang tersedia

- `GET /health`
- `GET /products`
- `GET /products/:id`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id`
- `GET /categories`
- `DELETE /categories/:name`
- `POST /upload-image`
- `POST /orders`
- `GET /orders`
- `POST /orders/:id/confirm?token=...`

## Catatan Integrasi Frontend

Frontend saat ini sudah memakai `VITE_API_BASE_URL` dan default ke `http://localhost:5000`, jadi endpoint PHP ini bisa langsung dipakai jika Anda menjalankannya di port 5000.
