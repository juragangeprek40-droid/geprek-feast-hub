import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const INSTRUCTIONS = `Kamu adalah ahli integrasi pembayaran Midtrans untuk website catering "Juragan Geprek".
Arsitektur webhook: endpoint POST /api/public/midtrans-webhook. Verifikasi signature_key = SHA512(order_id + status_code + gross_amount + ServerKey). order_id berformat "<uuid>__<timestamp>" lalu di-split "__" untuk mencari pesanan. Status: capture/settlement -> "dibayar", deny/cancel/expire -> "dibatalkan", lainnya tetap pending. Respons 401 = tanda tangan salah, 404 = pesanan tidak ditemukan.
Admin akan menempelkan log notifikasi Midtrans (JSON body, status HTTP, pesan error). Analisis dan jawab dalam Bahasa Indonesia dengan format Markdown:
## Ringkasan
## Kemungkinan Penyebab (urutkan dari paling mungkin)
## Langkah Perbaikan (bernomor, konkret)
## Cara Verifikasi
Perhatikan: mismatch sandbox vs production key, gross_amount berdesimal (".00"), URL notifikasi salah, order_id tidak cocok, status_code. Jangan pernah meminta atau menampilkan Server Key. Jawab maksimal ~400 kata.`;

export const Route = createFileRoute("/api/midtrans-diagnose")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return Response.json({ error: "Harus login." }, { status: 401 });
        const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false },
        });
        const { data: u } = await sb.auth.getUser(token);
        if (!u.user) return Response.json({ error: "Sesi tidak valid." }, { status: 401 });
        const { data: isAdmin } = await sb.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
        if (!isAdmin) return Response.json({ error: "Hanya admin." }, { status: 403 });

        const body = (await request.json().catch(() => ({}))) as { log?: string };
        const log = (body.log ?? "").trim().slice(0, 20000);
        if (!log) return Response.json({ error: "Log kosong." }, { status: 400 });

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "AI belum dikonfigurasi." }, { status: 500 });
        const masked = log.replace(/(SB-)?Mid-server-[A-Za-z0-9_-]+/g, "[SERVER_KEY_DISEMBUNYIKAN]");

        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });
        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          instructions: INSTRUCTIONS,
          messages: [{ role: "user", content: `Log notifikasi Midtrans:\n\n${masked}` }],
          abortSignal: request.signal,
          maxRetries: 0,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        } as Parameters<typeof streamText>[0]);
        return result.toTextStreamResponse();
      },
    },
  },
});
