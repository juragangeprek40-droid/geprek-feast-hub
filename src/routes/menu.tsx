import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cartStore, formatRupiah, type SpiceLevel } from "@/lib/cart-store";
import { isPromoActive, effectivePrice, discountPercent } from "@/lib/promo";
import { Flame, Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import menuGeprekImg from "@/assets/menu-geprek.jpg";
import menuPaketImg from "@/assets/menu-paket.jpg";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu Catering — Juragan Geprek" },
      { name: "description", content: "Pilih menu paket catering atau satuan ayam geprek. Harga mulai Rp 18.000 per porsi." },
    ],
  }),
  component: MenuPage,
});

interface Menu {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: "paket" | "satuan" | "minuman";
  image_url: string | null;
  is_available: boolean;
  min_portion: number;
  promo_price: number | null;
  promo_start_at: string | null;
  promo_end_at: string | null;
}

const fallbackImg = (cat: string) => (cat === "paket" ? menuPaketImg : menuGeprekImg);

function MenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("menus").select("*").eq("is_available", true).order("category").then(({ data }) => {
      setMenus((data ?? []) as Menu[]);
      setLoading(false);
    });
  }, []);

  const paket = menus.filter((m) => m.category === "paket");
  const satuan = menus.filter((m) => m.category === "satuan");
  const minuman = menus.filter((m) => m.category === "minuman");

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-extrabold md:text-5xl">Menu Catering Kami</h1>
        <p className="mt-2 text-muted-foreground">Pilih sesuai kebutuhan acaramu — paket porsi banyak atau satuan.</p>
      </div>

      <Tabs defaultValue="paket" className="w-full">
        <TabsList className="mx-auto grid w-full max-w-xl grid-cols-3 bg-secondary">
          <TabsTrigger value="paket">Paket Catering</TabsTrigger>
          <TabsTrigger value="satuan">Per Porsi</TabsTrigger>
          <TabsTrigger value="minuman">Minuman</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Memuat menu...</div>
        ) : (
          <>
            <TabsContent value="paket" className="mt-8">
              <Grid items={paket} />
            </TabsContent>
            <TabsContent value="satuan" className="mt-8">
              <Grid items={satuan} />
            </TabsContent>
            <TabsContent value="minuman" className="mt-8">
              <Grid items={minuman} />
            </TabsContent>
          </>
        )}
      </Tabs>

      <div className="mt-10 text-center">
        <Link to="/checkout"><Button size="lg" className="bg-gradient-warm text-primary-foreground shadow-warm">Lanjut ke Checkout</Button></Link>
      </div>
    </div>
  );
}

function Grid({ items }: { items: Menu[] }) {
  if (!items.length) return <p className="text-center text-muted-foreground py-10">Belum ada menu di kategori ini.</p>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((m) => <MenuCard key={m.id} menu={m} />)}
    </div>
  );
}

function MenuCard({ menu }: { menu: Menu }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(menu.min_portion);
  const [spice, setSpice] = useState<SpiceLevel>("sedang");
  const [extras, setExtras] = useState("");

  const onPromo = isPromoActive(menu);
  const unitPrice = effectivePrice(menu);
  const discount = discountPercent(menu);

  function add() {
    cartStore.add({
      menuId: menu.id,
      name: menu.name,
      price: unitPrice,
      category: menu.category,
      quantity: qty,
      spiceLevel: spice,
      extras,
      minPortion: menu.min_portion,
    });
    toast.success(`${menu.name} ditambahkan ke pesanan`);
    setOpen(false);
    setQty(menu.min_portion);
    setExtras("");
  }

  return (
    <Card className="group overflow-hidden border-border/60 bg-card shadow-soft transition hover:shadow-warm">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={menu.image_url || fallbackImg(menu.category)} alt={menu.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        {onPromo && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground shadow-warm">
            <Tag className="h-3 w-3" /> -{discount}%
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold leading-tight">{menu.name}</h3>
          <Badge variant="secondary" className="shrink-0 capitalize">{menu.category}</Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{menu.description}</p>
        <div className="flex items-center justify-between pt-2">
          <div>
            {onPromo ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-xl font-bold text-primary">{formatRupiah(unitPrice)}</span>
                  <span className="text-xs text-muted-foreground line-through">{formatRupiah(menu.price)}</span>
                </div>
                {menu.promo_end_at && (
                  <div className="text-[10px] text-destructive font-medium">
                    Promo s/d {new Date(menu.promo_end_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </div>
                )}
              </>
            ) : (
              <div className="font-display text-xl font-bold text-primary">{formatRupiah(menu.price)}</div>
            )}
            {menu.category === "paket" && <div className="text-xs text-muted-foreground">min. {menu.min_portion} porsi</div>}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-warm text-primary-foreground shadow-warm"><Plus className="mr-1 h-4 w-4" />Pesan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{menu.name}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {onPromo && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-2 text-xs text-destructive flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" /> Harga promo aktif — hemat {discount}%
                  </div>
                )}
                <div>
                  <Label>Jumlah porsi (min. {menu.min_portion})</Label>
                  <Input type="number" min={menu.min_portion} value={qty} onChange={(e) => setQty(Math.max(menu.min_portion, Number(e.target.value)))} />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-spice" />Level Pedas</Label>
                  <Select value={spice} onValueChange={(v) => setSpice(v as SpiceLevel)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tidak_pedas">Tidak Pedas</SelectItem>
                      <SelectItem value="sedang">Sedang 🌶</SelectItem>
                      <SelectItem value="pedas">Pedas 🌶🌶</SelectItem>
                      <SelectItem value="extra_pedas">Extra Pedas 🌶🌶🌶</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tambahan / Catatan (opsional)</Label>
                  <Textarea placeholder="Contoh: tambah keju, tanpa lalapan..." value={extras} onChange={(e) => setExtras(e.target.value)} maxLength={300} />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                  <span className="text-sm">Subtotal</span>
                  <span className="font-display text-lg font-bold text-primary">{formatRupiah(unitPrice * qty)}</span>
                </div>
              </div>
              <DialogFooter><Button onClick={add} className="bg-gradient-warm text-primary-foreground">Tambah ke Pesanan</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}
