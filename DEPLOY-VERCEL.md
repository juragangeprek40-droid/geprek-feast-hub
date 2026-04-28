# Deploy Juragan Geprek ke Vercel

Project ini bisa dideploy ke Vercel sebagai **Single Page Application (SPA)**.
Backend (database, auth, storage) tetap menggunakan **Lovable Cloud (Supabase)** —
tidak perlu migrasi data.

## 1. Push project ke GitHub

Di Lovable, klik tombol **GitHub** (kanan atas) → **Connect to GitHub** →
buat repository baru. Lovable akan otomatis push semua kode.

## 2. Import ke Vercel

1. Buka https://vercel.com/new
2. Pilih repository GitHub yang baru dibuat
3. Vercel akan auto-detect sebagai **Vite project**
4. **JANGAN** ubah Build / Output settings — biarkan default. File `vercel.json`
   sudah mengatur:
   - Build Command: `vite build`
   - Output Directory: `dist/client`
   - Install Command: `bun install`
   - SPA rewrites (semua route → `index.html`)

## 3. Set Environment Variables di Vercel

Di halaman import Vercel, expand **Environment Variables** dan tambahkan:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://mauxbhbnjhnyfakbgyqd.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXhiaGJuamhueWZha2JneXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDYxNTUsImV4cCI6MjA5Mjg4MjE1NX0.9gm0fU8CEDHO-Y2sukPQ26-F_zvhIGNrSc625On93YU` |
| `VITE_SUPABASE_PROJECT_ID` | `mauxbhbnjhnyfakbgyqd` |

> Nilai di atas adalah **publishable/anon key** (aman ditaruh di browser). Service
> role key TIDAK boleh dipakai di Vercel SPA.

Klik **Deploy**. Tunggu ~1–2 menit.

## 4. Tambahkan domain Vercel ke Supabase Auth

Agar login/signup berfungsi di domain Vercel, tambahkan URL Vercel ke daftar
Redirect URL di Lovable Cloud:

1. Buka Lovable → **Cloud** → **Users** → **Auth Settings**
2. Di **Site URL** atau **Redirect URLs**, tambahkan:
   - `https://nama-project-anda.vercel.app`
   - `https://nama-project-anda.vercel.app/**`

## 5. Selesai 🎉

Akses aplikasi di: `https://nama-project-anda.vercel.app`

### Login Super Admin

- Email: `superadmin@juragangeprek.com`
- Password: `Gepr3k!Juragan#2026$Adm`

---

## Catatan teknis

- Project ini **tidak menggunakan server functions** — semua call ke Supabase
  langsung dari browser, jadi mode SPA cocok dan tidak butuh Vercel Functions.
- File `vercel.json` rewrites memastikan deep link (mis. `/admin`, `/menu`)
  tidak 404 saat di-refresh.
- Konfigurasi Cloudflare (`wrangler.jsonc`) tetap ada — itu hanya dipakai oleh
  preview Lovable, tidak mengganggu Vercel.
