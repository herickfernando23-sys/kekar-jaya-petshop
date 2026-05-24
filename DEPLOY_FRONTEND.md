# Deploy Frontend to Vercel (Free)

Panduan singkat untuk deploy frontend React (Vite) ke Vercel tanpa mengubah kode.

Prerequisites
- Repo sudah dipush ke GitHub (sepertinya sudah: `kekar-jaya-petshop`).
- Login ke https://vercel.com dengan akun GitHub.

Steps
1. Import repository
   - Di Vercel: "New Project" → pilih GitHub repo `kekar-jaya-petshop` → Import.

2. Build & Output
   - Build Command: `npm run build`
   - Output Directory: `build`

3. Environment Variable
   - Key: `VITE_API_BASE_URL`
   - Value: URL backend Render, misalnya `https://kekar-jaya-backend.onrender.com`
   - Jika dibiarkan kosong, frontend hanya akan mencoba `http://localhost:5000` dan itu tidak akan bekerja di web publik.

4. Deploy
   - Klik Deploy. Vercel akan membuat deployment dan menunjukkan URL gratis (subdomain `.vercel.app`).

5. Verifikasi cepat
   - Buka deployment URL yang diberikan Vercel — halaman statis harus tampil.
   - Jika katalog kosong, itu normal: backend belum terhubung.

Local build & test
1. Install deps and build locally:

```bash
cd "KEKAR JAYA"
npm install
npm run build
```

2. Serve built files locally (optional):

```bash
npx serve build -l 5000
# open http://localhost:5000
```

Notes & recommendations
- Backend sudah disiapkan untuk dijalankan di Render. Setelah deploy selesai, set `VITE_API_BASE_URL` di Vercel ke URL backend tersebut dan lakukan redeploy.
- Karena `upload-image.js` menyimpan ke disk lokal, upload gambar hanya akan bekerja jika backend di-host pada server dengan disk persistent (Render/Render Persistent Disk/VPS). Gunakan penyimpanan cloud jika perlu.
- Tunda aktivasi layanan berbayar sampai mendekati presentasi untuk menghindari trial terbuang.

Butuh saya pandu step-by-step saat kamu melakukan Import di Vercel? Ketik "iya" dan sebutkan apakah kamu sudah punya akun Vercel.
