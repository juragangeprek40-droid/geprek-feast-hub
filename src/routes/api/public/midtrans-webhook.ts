import { createFileRoute } from "@tanstack/react-router";

async function sha512(text: string) {
  const buf = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/api/public/midtrans-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const serverKey = process.env["MIDTRANS_SERVER_KEY"]?.trim();
        if (!serverKey) return new Response("not configured", { status: 500 });
        const n: any = await request.json().catch(() => null);
        if (!n?.order_id || !n?.signature_key) return new Response("bad request", { status: 400 });

        const expected = await sha512(`${n.order_id}${n.status_code}${n.gross_amount}${serverKey}`);
        if (expected !== n.signature_key) {
          console.error("Midtrans webhook invalid signature", n.order_id);
          return new Response("invalid signature", { status: 401 });
        }

        const orderId = String(n.order_id).split("__")[0];
        // Midtrans dashboard "Test notification" uses a dummy order_id — acknowledge it.
        if (!/^[0-9a-f-]{36}$/i.test(orderId)) return new Response("ok (test)");
        const ts = n.transaction_status;
        const paid = (ts === "capture" && n.fraud_status !== "deny") || ts === "settlement";
        const failed = ["deny", "cancel", "expire"].includes(ts);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (paid) {
          await supabaseAdmin.from("orders").update({ status: "dibayar" }).eq("id", orderId).eq("status", "pending");
        } else if (failed) {
          await supabaseAdmin.from("orders").update({ status: "dibatalkan" as any }).eq("id", orderId).eq("status", "pending");
        }
        return new Response("ok");
      },
    },
  },
});
