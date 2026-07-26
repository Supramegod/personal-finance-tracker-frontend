# Deploy Frontend ke Cloudflare Pages

Frontend ini SPA (Vite + React Router). Panduan deploy ke Cloudflare Pages
lewat integrasi Git, memakai subdomain bawaan `*.pages.dev` untuk sementara.

Berkas yang sudah disiapkan di repo:
- `public/_redirects` — SPA fallback (semua path → index.html 200). WAJIB, tanpa
  ini refresh di `/installments`, `/members`, dll akan 404.
- `.env.production` — `VITE_API_BASE_URL` untuk build produksi (di-bake ke bundle).
- `.node-version` (20) — memaksa Node 20 di build Cloudflare (Vite 8 butuh Node ≥20;
  default Pages bisa lebih lama).

## 1. Pengaturan project di Cloudflare Pages

Dashboard Cloudflare → **Workers & Pages** → **Create** → **Pages** →
**Connect to Git** → pilih repo.

Isi build settings:

| Setting | Nilai |
|---|---|
| Framework preset | Vite (atau None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `frontend` **(jika repo berisi backend + frontend / monorepo)**. Kosongkan kalau repo ini hanya berisi isi folder frontend. |

Node sudah diatur lewat `.node-version`; tidak perlu env `NODE_VERSION` manual.

## 2. Environment variable (opsional)

`VITE_API_BASE_URL` sudah ada di `.env.production`, jadi build jalan tanpa setting
tambahan. Kalau API pindah host, ubah `.env.production` **atau** set di dashboard:
Pages → project → **Settings** → **Environment variables** → Production →
`VITE_API_BASE_URL = https://<host-api>/api/v1`. Nilai dashboard menang saat build
di Cloudflare. Setelah ubah env, **redeploy**.

## 3. Deploy

Klik **Save and Deploy**. Cloudflare build (`npm run build`) lalu terbitkan ke
`https://<nama-project>.pages.dev`. Tiap push ke branch produksi memicu build baru.

## 4. WAJIB — daftarkan domain Pages ke CORS backend

Frontend memanggil API lintas-origin. Setelah tahu URL `*.pages.dev`, tambahkan ke
`CORS_ORIGINS` di `.env` server backend, lalu recreate container (ingat: `restart`
tidak baca `.env`):

```bash
# di server backend
cd /shelter/jalu/self/finance-backend
# .env: CORS_ORIGINS=http://localhost:5173,https://<nama-project>.pages.dev
nano .env
docker compose -f docker-compose.prod.yml up -d --force-recreate api
```

Tanpa ini, browser memblokir semua request API dari frontend (error CORS), dan
login gagal tanpa pesan jelas. Pisahkan beberapa origin dengan koma, tanpa spasi.

## 5. Verifikasi

Buka `https://<nama-project>.pages.dev`:
- Halaman login tampil, favicon muncul.
- Login dengan akun admin → masuk dashboard, data tampil (bukti API + CORS jalan).
- Refresh di `/installments` atau `/members` → tetap di halaman itu (bukti
  `_redirects` bekerja), bukan 404.
- DevTools → Console: `[API] baseURL = https://jalu-finance.shelterdev.online/api/v1`.

## Kalau bermasalah

| Gejala | Penyebab |
|--------|----------|
| Build gagal di `tsc`/`vite` | Cek log build Pages; pastikan Root directory = `frontend` (monorepo) |
| Halaman putih, Console error CORS | Domain `*.pages.dev` belum masuk `CORS_ORIGINS` backend (langkah 4) |
| Refresh URL dalam → 404 | `public/_redirects` tidak ikut ter-deploy (pastikan file ada & output dir `dist`) |
| Login "Failed to fetch" | `VITE_API_BASE_URL` salah, atau API backend tidak jalan/HTTPS bermasalah |
| API dipanggil ke `localhost:8080` | `.env.production` tidak terbaca — cek Root directory & bahwa file ter-commit |

## Catatan

- Bundle > 500 kB (warning, bukan error). Kalau mau lebih ringan nanti,
  pertimbangkan code-splitting per route (`React.lazy`) — opsional.
- Domain kustom bisa ditambahkan nanti di Pages → Custom domains; jangan lupa
  update `CORS_ORIGINS` backend dengan domain baru itu juga.
