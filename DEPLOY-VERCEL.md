# Deploy ke Vercel

App ini dibangun dengan **TanStack Start** (SSR) dan dideploy ke Vercel sebagai **Edge Function** + static assets. Backend tetap di **Lovable Cloud** (Supabase).

## 1. Push ke GitHub
Hubungkan repo Lovable ini ke GitHub (tombol GitHub di pojok kanan atas Lovable), lalu push.

## 2. Import ke Vercel
1. Buka https://vercel.com/new
2. Import repo dari GitHub.
3. **Framework Preset**: Other (biarkan, sudah diatur via `vercel.json`).
4. **Build Command**, **Output Directory**, **Install Command**: biarkan kosong (dibaca dari `vercel.json`).

## 3. Environment Variables
Tambahkan di **Settings → Environment Variables** (untuk Production, Preview, Development):

```
VITE_SUPABASE_URL=https://mauxbhbnjhnyfakbgyqd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXhiaGJuamhueWZha2JneXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDYxNTUsImV4cCI6MjA5Mjg4MjE1NX0.9gm0fU8CEDHO-Y2sukPQ26-F_zvhIGNrSc625On93YU
VITE_SUPABASE_PROJECT_ID=mauxbhbnjhnyfakbgyqd
```

Klik **Deploy**.

## 4. Konfigurasi Supabase Auth (penting!)
Setelah dapat URL Vercel (mis. `https://geprek-feast.vercel.app`):
- Buka **Lovable → Connectors → Lovable Cloud → Auth Settings**
- Tambahkan URL Vercel ke **Site URL** dan **Redirect URLs**.

## Cara kerja
- `vercel.json` → routing semua request non-asset ke `api/index.ts` (Edge Function).
- `api/index.ts` → memuat worker bundle TanStack Start (`dist/server/index.js`) dan menjalankan SSR di Vercel Edge.
- Static assets (`/assets/*`, `/favicon.png`) dilayani langsung dari `dist/client`.
- Routing client-side (deep link `/menu`, `/admin`, dll.) ditangani oleh TanStack Router via SSR — tidak ada lagi 404 NOT_FOUND.

## Troubleshooting
- **404 NOT_FOUND di Vercel**: Pastikan `vercel.json` dan `api/index.ts` ter-commit, lalu redeploy.
- **Auth callback gagal**: pastikan URL Vercel sudah ditambahkan ke Supabase Redirect URLs.
- **Build gagal**: pastikan ENV vars di atas sudah diset di Vercel.
