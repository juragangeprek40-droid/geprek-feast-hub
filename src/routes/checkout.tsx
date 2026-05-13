import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useCart, cartStore, cartTotal, formatRupiah } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, ShoppingBag, Flame } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Juragan Geprek" }] }),
  component: CheckoutPage,
});

const spiceLabel: Record<string, string> = {
  tidak_pedas: "Tidak Pedas", sedang: "Sedang 🌶", pedas: "Pedas 🌶🌶", extra_pedas: "Extra Pedas 🌶🌶🌶",
};

const orderSchema = z.object({
  guest_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  guest_phone: z.string().trim().min(8, "Nomor HP tidak valid").max(20),
  delivery_address: z.string().trim().min(5, "Alamat terlalu pendek").max(500),
  delivery_date: z.string().min(1, "Pilih tanggal"),
  delivery_time: z.string().optional(),
  notes: z.string().max(500).optional(),
});

function CheckoutPage() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    guest_name: "",
    guest_phone: "",
    delivery_address: "",
    delivery_date: "",
    delivery_time: "",
    notes: "",
  });

  const total = cartTotal(cart);
  const today = new Date().toISOString().split("T")[0];

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/40" />
        <h2 className="mt-4 font-display text-2xl font-bold">Pesananmu masih kosong</h2>
        <p className="mt-2 text-muted-foreground">Yuk pilih menu favoritmu dulu.</p>
        <Link to="/menu" className="mt-6 inline-flex">
          <Button size="lg" className="bg-gradient-warm text-primary-foreground shadow-warm">Lihat Menu</Button>
        </Link>
      </div>
    );
  }

  async function handleSubmit() {
    const parsed = orderSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!proofFile) {
      toast.error("Silakan upload bukti transfer");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Insert order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: user?.id ?? null,
          guest_name: parsed.data.guest_name,
          guest_phone: parsed.data.guest_phone,
          order_type: cart.some((c) => c.category === "paket") ? "paket" : "satuan",
          delivery_date: parsed.data.delivery_date,
          delivery_time: parsed.data.delivery_time || null,
          delivery_address: parsed.data.delivery_address,
          notes: parsed.data.notes || null,
          subtotal: total,
          total: total,
          status: "pending",
        })
        .select()
        .single();

      if (orderErr || !order) throw orderErr ?? new Error("Gagal buat pesanan");

      // 2. Insert items
      const items = cart.map((c) => ({
        order_id: order.id,
        menu_id: c.menuId,
        menu_name: c.name,
        quantity: c.quantity,
        unit_price: c.price,
        spice_level: c.spiceLevel,
        extras: c.extras || null,
        subtotal: c.price * c.quantity,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(items);
      if (itemsErr) throw itemsErr;

      // 3. Upload proof
      const ext = proofFile.name.split(".").pop();
      const path = `${order.id}/bukti-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, proofFile);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("payment-proofs").getPublicUrl(path);

      // 4. Update order with proof
      await supabase.from("orders").update({ payment_proof_url: pub.publicUrl, status: "dibayar" }).eq("id", order.id);

      cartStore.clear();
      toast.success(`Pesanan ${order.order_number} berhasil dibuat!`);
      navigate({ to: user ? "/orders" : "/" });
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal memproses pesanan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto grid gap-6 px-4 py-10 lg:grid-cols-3">
      {/* CART */}
      <div className="lg:col-span-2 space-y-4">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Pesananmu</h1>
        <div className="space-y-3">
          {cart.map((item, idx) => (
            <Card key={idx} className="p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    <Badge variant="secondary" className="capitalize">{item.category}</Badge>
                    {item.category !== "minuman" && (
                      <Badge variant="outline" className="border-spice/50 text-spice"><Flame className="mr-1 h-3 w-3" />{spiceLabel[item.spiceLevel]}</Badge>
                    )}
                  </div>
                  {item.extras && <p className="mt-1 text-xs text-muted-foreground">Catatan: {item.extras}</p>}
                  <div className="mt-3 flex items-center gap-2">
                    <Label className="text-xs">Porsi:</Label>
                    <Input type="number" min={item.minPortion} value={item.quantity} onChange={(e) => cartStore.update(idx, { quantity: Math.max(item.minPortion, Number(e.target.value)) })} className="h-8 w-20" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-primary">{formatRupiah(item.price * item.quantity)}</div>
                  <button onClick={() => cartStore.remove(idx)} className="mt-2 text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"><Trash2 className="h-3 w-3" />Hapus</button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* DELIVERY */}
        <Card className="p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold mb-4">Detail Pengiriman</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Nama Pemesan *</Label><Input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} placeholder="Nama lengkap" /></div>
            <div><Label>No. HP / WhatsApp *</Label><Input value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} placeholder="0812..." /></div>
            <div><Label>Tanggal Acara *</Label><Input type="date" min={today} value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} /></div>
            <div><Label>Jam Pengiriman</Label><Input type="time" value={form.delivery_time} onChange={(e) => setForm({ ...form, delivery_time: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Alamat Pengiriman *</Label><Textarea value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} placeholder="Alamat lengkap dengan patokan" /></div>
            <div className="md:col-span-2"><Label>Catatan untuk Juragan</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan (opsional)" /></div>
          </div>
        </Card>
      </div>

      {/* SUMMARY */}
      <div>
        <Card className="sticky top-20 p-5 shadow-warm border-primary/20">
          <h2 className="font-display text-lg font-bold">Ringkasan</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total porsi</span><span>{cart.reduce((s, c) => s + c.quantity, 0)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatRupiah(total)}</span></div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between font-display text-lg font-bold">
              <span>Total</span><span className="text-primary">{formatRupiah(total)}</span>
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-secondary p-3 text-xs">
            <div className="font-semibold mb-1">Transfer ke:</div>
            <div>BCA <span className="font-mono">1234567890</span></div>
            <div>a.n. Juragan Geprek</div>
          </div>

          <div className="mt-4">
            <Label className="flex items-center gap-1"><Upload className="h-3.5 w-3.5" />Bukti Transfer *</Label>
            <Input type="file" accept="image/*,application/pdf" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
            {proofFile && <p className="mt-1 text-xs text-muted-foreground truncate">{proofFile.name}</p>}
          </div>

          <Button onClick={handleSubmit} disabled={submitting} size="lg" className="mt-5 w-full bg-gradient-warm text-primary-foreground shadow-warm">
            {submitting ? "Memproses..." : "Konfirmasi Pesanan"}
          </Button>
          {!user && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              <Link to="/auth" className="text-primary hover:underline">Masuk</Link> untuk pantau riwayat pesananmu
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
