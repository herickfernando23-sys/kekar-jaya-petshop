
# KEKAR JAYA

Website toko petshop dengan:
- Frontend: React + Vite
- Backend: Express
- Database: MySQL

## Jalankan di komputer lokal

1. Install dependency:

```powershell
npm install
```

2. Jalankan frontend:

```powershell
npm run dev
```

3. Jalankan backend (terminal terpisah):

```powershell
node server.js
```

4. Buka:
- Frontend: http://localhost:3000
- API: http://localhost:5000/health

## Cara paling mudah bikin jadi website online

### 1) Deploy backend dulu ke Render

Pakai file [render.yaml](render.yaml) di root project ini.

Di Render, pilih **New +** lalu **Blueprint**, kemudian connect repo ini.

Set environment backend:
- `NODE_ENV=production`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `CORS_ORIGIN` = domain Vercel kamu, contoh `https://nama-proyek.vercel.app`
- `PORT`

Setelah deploy, kamu akan dapat URL backend, contoh:
- `https://kekar-jaya-backend.onrender.com`

### 1a) Pasang database online dulu

Karena backend ini pakai MySQL, database-nya juga harus online. Opsi yang paling gampang biasanya Railway MySQL.

Langkahnya:
1. Buka Railway.
2. Buat project baru.
3. Tambahkan service database MySQL.
4. Setelah database jadi, salin detail koneksinya.
5. Isi environment Render dengan nilai dari database online itu:
   - `DB_HOST` = host MySQL dari Railway
   - `DB_PORT` = port MySQL dari Railway, biasanya `3306`
   - `DB_USER` = username MySQL
   - `DB_PASSWORD` = password MySQL
   - `DB_NAME` = nama database, biasanya `kekar_jaya_petshop`

Kalau Railway memberi port terpisah, biarkan backend tetap pakai default koneksi MySQL standar.

### 2) Deploy frontend ke Vercel/Netlify

Di setting Environment Variables frontend, isi:
- `VITE_API_BASE_URL` = URL backend kamu

Contoh:
- `VITE_API_BASE_URL=https://kekar-jaya-backend.onrender.com`

Build config frontend:
- Build command: `npm run build`
- Output folder: `build`

### 3) Test hasil akhir
- Buka website online kamu
- Pastikan katalog produk muncul
- Cek endpoint backend: `/health` dan `/products`

## Penting
Frontend sudah diset untuk membaca API dari `VITE_API_BASE_URL`.
Kalau variabel ini tidak diisi, frontend otomatis pakai `http://localhost:5000` (mode lokal).

## Checklist deploy cepat

1. Pastikan backend lokal berjalan dengan `node server.js` dan endpoint `/health` merespons.
2. Push project ini ke GitHub.
3. Di Render, buat **New + > Blueprint** lalu pilih repo ini.
4. Isi environment backend di Render:
   - `NODE_ENV=production`
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `CORS_ORIGIN` = domain Vercel kamu, contoh `https://nama-proyek.vercel.app`
5. Tunggu service Render selesai deploy, lalu salin URL backend-nya.
6. Di Vercel, set environment variable frontend:
   - `VITE_API_BASE_URL` = URL backend Render
7. Redeploy frontend di Vercel.
8. Buka website, cek katalog produk, lalu test endpoint `/health` dan `/products`.
  