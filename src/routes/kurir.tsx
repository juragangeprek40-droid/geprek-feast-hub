import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRupiah } from "@/lib/cart-store";
import { toast } from "sonner";
import { ShieldAlert, CalendarDays, MapPin, Phone, Bike } from "lucide-react";

export const Route = createFileRoute("/kurir")({
  head: () => ({ meta: [{ title: "Dashboard Kurir — Juragan Geprek" }] }),
  component: KurirPage,
});

interface DeliveryOrder {
  id: string;
  order_number: string;
  guest_name: string | null;
  guest_phone: string | null;
  delivery_date: string;
  delivery_time: string | null;
  delivery_address: string;
  total: number;
  status: string;
  notes: string | null;
}

function KurirPage() {
  const { user, isKurir, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, guest_name, guest_phone, delivery_date, delivery_time, delivery_address, total, status, notes")
      .eq("courier_id", user.id)
      .order("delivery_date", { ascending: true });
    setOrders((data ?? []) as DeliveryOrder[]);
    setBusy(false);
  }

  useEffect(() => { if (isKurir) load(); }, [isKurir, user]);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status pengantaran diperbarui");
    load();
  }

  if (loading) return <div className="container py-20 text-center">Memuat...</div>;
  if (!user) return null;
  if (!isKurir) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive/50" />
        <h2 className="mt-3 font-display text-xl font-bold">Akses Ditolak</h2>
        <p className="text-muted-foreground">Halaman ini hanya untuk kurir.</p>
        <Link to="/" className="mt-4 inline-flex"><Button variant="outline">Kembali</Button></Link>
      </div>
    );
  }

  const aktif = orders.filter((o) => o.status !== "selesai" && o.status !== "dibatalkan");
  const selesai = orders.filter((o) => o.status === "selesai");

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-warm shadow-warm"><Bike className="h-5 w-5 text-primary-foreground" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Dashboard Kurir</h1>
          <p className="text-sm text-muted-foreground">Daftar pengantaran yang ditugaskan untukmu.</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-bold mb-3">Pengantaran Aktif <Badge className="ml-2">{aktif.length}</Badge></h2>
        {busy ? <p className="text-muted-foreground py-6">Memuat...</p> :
          aktif.length === 0 ? <Card className="p-8 text-center text-muted-foreground">Tidak ada pengantaran aktif.</Card> :
          <div className="space-y-3">{aktif.map((o) => <DeliveryCard key={o.id} order={o} onUpdate={updateStatus} />)}</div>
        }
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-bold mb-3 text-muted-foreground">Riwayat Selesai ({selesai.length})</h2>
        <div className="space-y-3">{selesai.map((o) => <DeliveryCard key={o.id} order={o} onUpdate={updateStatus} />)}</div>
      </div>
    </div>
  );
}

function DeliveryCard({ order: o, onUpdate }: { order: DeliveryOrder; onUpdate: (id: string, s: string) => void }) {
  return (
    <Card className="p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">{o.order_number}</span>
            <Badge className="capitalize">{o.status}</Badge>
          </div>
          <div className="text-sm space-y-1">
            <div><Phone className="inline mr-1 h-3.5 w-3.5 text-muted-foreground" />{o.guest_name} — <a href={`tel:${o.guest_phone}`} className="text-primary hover:underline">{o.guest_phone}</a></div>
            <div><CalendarDays className="inline mr-1 h-3.5 w-3.5 text-muted-foreground" />{new Date(o.delivery_date).toLocaleDateString("id-ID", { dateStyle: "full" })} {o.delivery_time}</div>
            <div className="flex gap-1"><MapPin className="inline mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0" /><span>{o.delivery_address}</span></div>
            {o.notes && <div className="italic text-xs text-muted-foreground">Catatan: "{o.notes}"</div>}
          </div>
        </div>
        <div className="text-right space-y-2 min-w-[180px]">
          <div className="font-display text-lg font-bold text-primary">{formatRupiah(o.total)}</div>
          <Select value={o.status} onValueChange={(v) => onUpdate(o.id, v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="diproses">Diproses</SelectItem>
              <SelectItem value="dikirim">Sedang Diantar</SelectItem>
              <SelectItem value="selesai">Selesai</SelectItem>
            </SelectContent>
          </Select>
          <a href={`https://maps.google.com/?q=${encodeURIComponent(o.delivery_address)}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="w-full"><MapPin className="mr-1 h-3.5 w-3.5" />Buka Maps</Button>
          </a>
        </div>
      </div>
    </Card>
  );
}
