import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MIDTRANS_SNAP_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";

export const createMidtransPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ orderId: z.string().uuid(), origin: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    const serverKey = process.env["MIDTRANS_SERVER_KEY"]?.trim();
    if (!serverKey) return { error: "Midtrans belum dikonfigurasi" as const, redirectUrl: null };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total, status, guest_name, guest_phone")
      .eq("id", data.orderId)
      .single();
    if (!order || order.status !== "pending") {
      return { error: "Pesanan tidak valid" as const, redirectUrl: null };
    }
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("menu_id, menu_name, quantity, unit_price")
      .eq("order_id", order.id);

    const body = {
      transaction_details: {
        order_id: `${order.id}__${Date.now().toString(36)}`,
        gross_amount: Math.round(Number(order.total)),
      },
      item_details: (items ?? []).map((i) => ({
        id: i.menu_id ?? "item",
        name: String(i.menu_name).slice(0, 50),
        price: Math.round(Number(i.unit_price)),
        quantity: i.quantity,
      })),
      customer_details: { first_name: order.guest_name ?? "Pelanggan", phone: order.guest_phone ?? "" },
      callbacks: { finish: `${data.origin}/?paid=${order.order_number}` },
    };

    const doFetch = (url: string) => fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Basic " + btoa(serverKey + ":"),
      },
      body: JSON.stringify(body),
    });
    // Try sandbox first, fall back to production if key is not a sandbox key
    let res = await doFetch(MIDTRANS_SNAP_URL);
    if (res.status === 401) res = await doFetch("https://app.midtrans.com/snap/v1/transactions");
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || !json.redirect_url) {
      console.error("Midtrans error", res.status, json);
      return { error: "Gagal membuat pembayaran Midtrans" as const, redirectUrl: null };
    }
    return { error: null, redirectUrl: json.redirect_url as string };
  });
