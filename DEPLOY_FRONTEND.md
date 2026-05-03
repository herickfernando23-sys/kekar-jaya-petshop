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

3. Environment Variable (opsional sekarang)
   - Key: `VITE_API_BASE_URL`
   - Value: (kosong atau isi `https://your-backend-url` nanti)
   - Jika tidak ada backend produksi saat ini, biarkan kosong — frontend akan mencoba `http://localhost:5000` pada mesin pengunjung dan katalog tidak akan tampil sampai backend tersedia.

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
- Backend nanti bisa dideploy terpisah — setelah dapat URL backend, set `VITE_API_BASE_URL` di Vercel ke URL backend tersebut dan lakukan redeploy.
- Karena `upload-image.js` menyimpan ke disk lokal, upload gambar hanya akan bekerja jika backend di-host pada server dengan disk persistent (Render/Render Persistent Disk/VPS). Gunakan penyimpanan cloud jika perlu.
- Tunda aktivasi layanan berbayar sampai mendekati presentasi untuk menghindari trial terbuang.

Butuh saya pandu step-by-step saat kamu melakukan Import di Vercel? Ketik "iya" dan sebutkan apakah kamu sudah punya akun Vercel.
