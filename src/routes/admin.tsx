import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatRupiah } from "@/lib/cart-store";
import { toast } from "sonner";
import { ShieldAlert, CalendarDays, MapPin, Phone, Eye } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Dashboard Admin — Juragan Geprek" }] }),
  component: AdminPage,
});

interface OrderFull {
  id: string;
  order_number: string;
  guest_name: string | null;
  guest_phone: string | null;
  delivery_date: string;
  delivery_time: string | null;
  delivery_address: string;
  total: number;
  status: string;
  order_type: string;
  payment_proof_url: string | null;
  notes: string | null;
  courier_id: string | null;
  created_at: string;
  order_items: { menu_name: string; quantity: number; spice_level: string; extras: string | null; subtotal: number }[];
}

interface Courier { id: string; full_name: string | null; }

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderFull[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  async function load() {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(menu_name, quantity, spice_level, extras, subtotal)")
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as OrderFull[]);

    const { data: rolesData } = await supabase.from("user_roles").select("user_id").eq("role", "kurir");
    if (rolesData?.length) {
      const ids = rolesData.map((r) => r.user_id);
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setCouriers((profs ?? []).map((p) => ({ id: p.id, full_name: p.full_name })));
    }
    setBusy(false);
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status diperbarui");
    load();
  }

  async function assignCourier(id: string, courier_id: string) {
    const { error } = await supabase.from("orders").update({ courier_id }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Kurir ditugaskan");
    load();
  }

  if (loading) return <div className="container py-20 text-center">Memuat...</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive/50" />
        <h2 className="mt-3 font-display text-xl font-bold">Akses Ditolak</h2>
        <p className="text-muted-foreground">Halaman ini hanya untuk admin.</p>
        <Link to="/" className="mt-4 inline-flex"><Button variant="outline">Kembali</Button></Link>
      </div>
    );
  }

  const filtered = (status: string) => status === "semua" ? orders : orders.filter((o) => o.status === status);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Dashboard Admin</h1>
      <p className="text-muted-foreground">Kelola seluruh pesanan catering.</p>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Stat label="Total Pesanan" value={orders.length} />
        <Stat label="Menunggu Verifikasi" value={orders.filter((o) => o.status === "dibayar").length} />
        <Stat label="Sedang Diproses" value={orders.filter((o) => o.status === "diproses" || o.status === "dikirim").length} />
        <Stat label="Pendapatan" value={formatRupiah(orders.filter((o) => o.status === "selesai").reduce((s, o) => s + Number(o.total), 0))} />
      </div>

      <Tabs defaultValue="semua" className="mt-8">
        <TabsList className="bg-secondary flex-wrap h-auto">
          {["semua", "pending", "dibayar", "diproses", "dikirim", "selesai"].map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>
          ))}
        </TabsList>

        {["semua", "pending", "dibayar", "diproses", "dikirim", "selesai"].map((s) => (
          <TabsContent key={s} value={s} className="mt-5 space-y-4">
            {busy ? <p className="text-center py-10 text-muted-foreground">Memuat...</p> :
              filtered(s).length === 0 ? <p className="text-center py-10 text-muted-foreground">Tidak ada pesanan.</p> :
              filtered(s).map((o) => (
                <OrderCard key={o.id} order={o} couriers={couriers} onStatus={updateStatus} onAssign={assignCourier} />
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <Card className="p-4 shadow-soft">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-primary">{value}</div>
    </Card>
  );
}

function OrderCard({ order: o, couriers, onStatus, onAssign }: { order: OrderFull; couriers: Courier[]; onStatus: (id: string, s: string) => void; onAssign: (id: string, c: string) => void }) {
  return (
    <Card className="p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">{o.order_number}</span>
            <Badge variant="outline" className="capitalize">{o.order_type}</Badge>
            <Badge className="capitalize">{o.status}</Badge>
          </div>
          <div className="mt-2 grid gap-1 text-sm md:grid-cols-2">
            <div className="text-muted-foreground"><Phone className="inline mr-1 h-3.5 w-3.5" />{o.guest_name} — {o.guest_phone}</div>
            <div className="text-muted-foreground"><CalendarDays className="inline mr-1 h-3.5 w-3.5" />{new Date(o.delivery_date).toLocaleDateString("id-ID", { dateStyle: "long" })} {o.delivery_time}</div>
            <div className="text-muted-foreground md:col-span-2"><MapPin className="inline mr-1 h-3.5 w-3.5" />{o.delivery_address}</div>
            {o.notes && <div className="md:col-span-2 italic text-xs">"{o.notes}"</div>}
          </div>

          <div className="mt-3 rounded-lg bg-secondary/50 p-3 text-sm">
            {o.order_items.map((it, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span>{it.menu_name} <span className="text-xs text-muted-foreground">({it.spice_level}{it.extras ? `, ${it.extras}` : ""})</span></span>
                <span>×{it.quantity} — {formatRupiah(it.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-right space-y-2 min-w-[200px]">
          <div className="font-display text-xl font-bold text-primary">{formatRupiah(o.total)}</div>
          {o.payment_proof_url && (
            <a href={o.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
              <Eye className="h-3 w-3" />Lihat bukti transfer
            </a>
          )}
          <Select value={o.status} onValueChange={(v) => onStatus(o.id, v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["pending", "dibayar", "diproses", "dikirim", "selesai", "dibatalkan"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={o.courier_id ?? ""} onValueChange={(v) => onAssign(o.id, v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tugaskan kurir" /></SelectTrigger>
            <SelectContent>
              {couriers.length === 0 ? <div className="px-2 py-1.5 text-xs text-muted-foreground">Belum ada kurir</div> :
                couriers.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name || "Kurir"}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
