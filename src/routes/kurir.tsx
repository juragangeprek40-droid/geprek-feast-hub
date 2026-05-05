import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRupiah } from "@/lib/cart-store";
import { toast } from "sonner";
import {
  ShieldAlert,
  CalendarDays,
  MapPin,
  Phone,
  Bike,
  Package,
  CheckCircle2,
  Clock,
  RefreshCw,
  Wallet,
} from "lucide-react";

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

const STATUS_COLOR: Record<string, string> = {
  diproses: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  dikirim: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  selesai: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  dibatalkan: "bg-destructive/15 text-destructive border-destructive/30",
  pending: "bg-muted text-muted-foreground border-border",
  dibayar: "bg-primary/15 text-primary border-primary/30",
};

function KurirPage() {
  const { user, isKurir, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  async function load(silent = false) {
    if (!user) return;
    if (!silent) setRefreshing(true);
    const { data } = await supabase
      .from("orders")
      .select(
        "id, order_number, guest_name, guest_phone, delivery_date, delivery_time, delivery_address, total, status, notes"
      )
      .eq("courier_id", user.id)
      .order("delivery_date", { ascending: true });
    setOrders((data ?? []) as DeliveryOrder[]);
    setBusy(false);
    setRefreshing(false);
  }

  useEffect(() => {
    if (!isKurir || !user) return;
    load();
    // Realtime subscription untuk perubahan order yang ditugaskan
    const channel = supabase
      .channel(`courier-orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `courier_id=eq.${user.id}`,
        },
        () => load(true)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isKurir, user]);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status: status as any })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status pengantaran diperbarui");
    load(true);
  }

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: orders.length,
      hariIni: orders.filter((o) => o.delivery_date === today && o.status !== "selesai").length,
      aktif: orders.filter((o) => o.status === "diproses" || o.status === "dikirim").length,
      selesai: orders.filter((o) => o.status === "selesai").length,
      pendapatan: orders
        .filter((o) => o.status === "selesai")
        .reduce((s, o) => s + Number(o.total), 0),
    };
  }, [orders]);

  if (loading) return <div className="container py-20 text-center">Memuat...</div>;
  if (!user) return null;
  if (!isKurir) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive/50" />
        <h2 className="mt-3 font-display text-xl font-bold">Akses Ditolak</h2>
        <p className="text-muted-foreground">Halaman ini hanya untuk kurir.</p>
        <Link to="/" className="mt-4 inline-flex">
          <Button variant="outline">Kembali</Button>
        </Link>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayList = orders.filter(
    (o) => o.delivery_date === today && o.status !== "selesai" && o.status !== "dibatalkan"
  );
  const aktif = orders.filter(
    (o) => o.status !== "selesai" && o.status !== "dibatalkan"
  );
  const selesai = orders.filter((o) => o.status === "selesai");

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-warm shadow-warm">
            <Bike className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">Dashboard Kurir</h1>
            <p className="text-sm text-muted-foreground">
              Daftar pengantaran yang ditugaskan untukmu.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => load()}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Hari Ini" value={stats.hariIni} accent />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Pengantaran Aktif" value={stats.aktif} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Selesai" value={stats.selesai} />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Total Diantar"
          value={formatRupiah(stats.pendapatan)}
          small
        />
      </div>

      <Tabs defaultValue="today" className="mt-8">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-secondary">
          <TabsTrigger value="today">
            Hari Ini <Badge className="ml-2">{todayList.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="aktif">
            Semua Aktif <Badge className="ml-2">{aktif.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="selesai">
            Selesai <Badge className="ml-2 bg-emerald-500">{selesai.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <OrderList list={todayList} busy={busy} onUpdate={updateStatus} emptyText="Tidak ada pengantaran hari ini." />
        </TabsContent>
        <TabsContent value="aktif" className="mt-4">
          <OrderList list={aktif} busy={busy} onUpdate={updateStatus} emptyText="Tidak ada pengantaran aktif." />
        </TabsContent>
        <TabsContent value="selesai" className="mt-4">
          <OrderList list={selesai} busy={busy} onUpdate={updateStatus} emptyText="Belum ada riwayat pengantaran selesai." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <Card className={`p-4 shadow-soft ${accent ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            accent ? "bg-gradient-warm text-primary-foreground" : "bg-secondary text-primary"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={`font-display font-bold ${small ? "text-base" : "text-2xl"}`}>{value}</div>
        </div>
      </div>
    </Card>
  );
}

function OrderList({
  list,
  busy,
  onUpdate,
  emptyText,
}: {
  list: DeliveryOrder[];
  busy: boolean;
  onUpdate: (id: string, s: string) => void;
  emptyText: string;
}) {
  if (busy) return <p className="py-10 text-center text-muted-foreground">Memuat...</p>;
  if (list.length === 0)
    return (
      <Card className="p-10 text-center text-muted-foreground">
        <Package className="mx-auto h-10 w-10 opacity-40" />
        <p className="mt-2">{emptyText}</p>
      </Card>
    );
  return (
    <div className="space-y-3">
      {list.map((o) => (
        <DeliveryCard key={o.id} order={o} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

function DeliveryCard({
  order: o,
  onUpdate,
}: {
  order: DeliveryOrder;
  onUpdate: (id: string, s: string) => void;
}) {
  const statusClass = STATUS_COLOR[o.status] ?? "bg-muted text-muted-foreground";
  return (
    <Card className="p-5 shadow-soft transition hover:shadow-warm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">{o.order_number}</span>
            <Badge variant="outline" className={`capitalize ${statusClass}`}>
              {o.status}
            </Badge>
          </div>
          <div className="text-sm space-y-1">
            <div>
              <Phone className="inline mr-1 h-3.5 w-3.5 text-muted-foreground" />
              {o.guest_name} —{" "}
              <a href={`tel:${o.guest_phone}`} className="text-primary hover:underline">
                {o.guest_phone}
              </a>
            </div>
            <div>
              <CalendarDays className="inline mr-1 h-3.5 w-3.5 text-muted-foreground" />
              {new Date(o.delivery_date).toLocaleDateString("id-ID", { dateStyle: "full" })}{" "}
              {o.delivery_time}
            </div>
            <div className="flex gap-1">
              <MapPin className="inline mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>{o.delivery_address}</span>
            </div>
            {o.notes && (
              <div className="italic text-xs text-muted-foreground">Catatan: "{o.notes}"</div>
            )}
          </div>
        </div>
        <div className="w-full space-y-2 text-right sm:w-auto sm:min-w-[180px]">
          <div className="font-display text-lg font-bold text-primary">{formatRupiah(o.total)}</div>
          <Select value={o.status} onValueChange={(v) => onUpdate(o.id, v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diproses">Diproses</SelectItem>
              <SelectItem value="dikirim">Sedang Diantar</SelectItem>
              <SelectItem value="selesai">Selesai</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(o.delivery_address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" size="sm" className="w-full">
                <MapPin className="mr-1 h-3.5 w-3.5" />
                Maps
              </Button>
            </a>
            {o.guest_phone && (
              <a href={`https://wa.me/${o.guest_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Phone className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
