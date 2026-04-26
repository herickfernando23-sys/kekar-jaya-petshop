
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

### 1) Deploy backend dulu
Paling gampang pakai Railway/Render.

Set environment backend:
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `PORT`

Setelah deploy, kamu akan dapat URL backend, contoh:
- `https://kekar-api-production.up.railway.app`

### 2) Deploy frontend ke Vercel/Netlify

Di setting Environment Variables frontend, isi:
- `VITE_API_BASE_URL` = URL backend kamu

Contoh:
- `VITE_API_BASE_URL=https://kekar-api-production.up.railway.app`

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
  