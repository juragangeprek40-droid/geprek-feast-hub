import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/cart-store";
import { CalendarDays, MapPin, Package } from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Pesanan Saya — Juragan Geprek" },
      { name: "description", content: "Lihat riwayat dan pantau status pesanan catering ayam geprekmu di Juragan Geprek." },
      { property: "og:title", content: "Pesanan Saya — Juragan Geprek" },
      { property: "og:description", content: "Pantau status pesanan catering ayam geprekmu." },
      { property: "og:url", content: "https://geprek-feast-hub.lovable.app/orders" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://geprek-feast-hub.lovable.app/orders" },
    ],
  }),
  component: OrdersPage,
});

const statusColor: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  dibayar: "bg-amber-100 text-amber-800",
  diproses: "bg-blue-100 text-blue-800",
  dikirim: "bg-orange-100 text-orange-800",
  selesai: "bg-green-100 text-green-800",
  dibatalkan: "bg-red-100 text-red-800",
};

interface OrderRow {
  id: string;
  order_number: string;
  delivery_date: string;
  delivery_address: string;
  total: number;
  status: string;
  created_at: string;
  order_type: string;
  order_items: { menu_name: string; quantity: number }[];
}

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id, order_number, delivery_date, delivery_address, total, status, created_at, order_type, order_items(menu_name, quantity)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as OrderRow[]);
        setBusy(false);
      });
  }, [user]);

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Pesanan Saya</h1>
      <p className="text-muted-foreground">Pantau status pesanan catering kamu di sini.</p>

      {busy ? (
        <p className="py-20 text-center text-muted-foreground">Memuat pesanan...</p>
      ) : orders.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 text-muted-foreground">Belum ada pesanan.</p>
          <Link to="/menu" className="mt-4 inline-flex"><Button className="bg-gradient-warm text-primary-foreground">Mulai Pesan</Button></Link>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4">
          {orders.map((o) => (
            <Card key={o.id} className="p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{o.order_number}</span>
                    <Badge className={`${statusColor[o.status]} capitalize`}>{o.status}</Badge>
                    <Badge variant="outline" className="capitalize">{o.order_type}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(o.delivery_date).toLocaleDateString("id-ID", { dateStyle: "long" })}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{o.delivery_address.slice(0, 40)}...</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-bold text-primary">{formatRupiah(o.total)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("id-ID")}</div>
                </div>
              </div>
              <div className="mt-3 border-t border-border pt-3 text-sm">
                {o.order_items.map((it, i) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>{it.menu_name}</span><span>×{it.quantity}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
