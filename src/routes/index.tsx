import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Truck, CalendarCheck, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-geprek.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Juragan Geprek — Catering Ayam Geprek Otentik" },
      { name: "description", content: "Pesan catering ayam geprek untuk acara & keluarga. Paket porsi banyak, satuan, jadwal fleksibel, dan bumbu khas Juragan Geprek." },
      { property: "og:title", content: "Juragan Geprek — E-Catering" },
      { property: "og:description", content: "Catering ayam geprek otentik untuk segala acara." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-2 md:py-20 md:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Catering Resmi Juragan Geprek
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Pedasnya <span className="text-primary">menggugah selera</span>,
              <br />sajiannya <span className="text-spice">menghangatkan acara</span>.
            </h1>
            <p className="max-w-lg text-base text-muted-foreground md:text-lg">
              Pesan catering ayam geprek dari Juragan Geprek untuk hajatan, arisan, kantor, atau keluarga. Pilih paket porsi banyak atau satuan — kami antar tepat waktu.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/menu">
                <Button size="lg" className="bg-gradient-warm text-primary-foreground shadow-warm hover:opacity-95">
                  Lihat Menu <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/checkout">
                <Button size="lg" variant="outline" className="border-primary/40 text-primary hover:bg-primary/5">
                  Pesan Sekarang
                </Button>
              </Link>
            </div>
            <div className="flex gap-6 pt-2 text-sm text-muted-foreground">
              <div><div className="font-display text-2xl font-bold text-foreground">10K+</div>porsi terkirim</div>
              <div><div className="font-display text-2xl font-bold text-foreground">500+</div>acara sukses</div>
              <div><div className="font-display text-2xl font-bold text-foreground">4.9★</div>rating pelanggan</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-warm/20 blur-2xl" />
            <img src={heroImg} alt="Ayam geprek dengan sambal merah dan nasi hangat di atas daun pisang" width={1536} height={1024} className="relative rounded-3xl shadow-warm ring-1 ring-border/40 aspect-[3/2] object-cover" />
            <div className="absolute -bottom-5 -left-5 rounded-2xl bg-card p-4 shadow-warm ring-1 ring-border md:left-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-spice/15"><Flame className="h-5 w-5 text-spice" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Mulai dari</div>
                  <div className="font-display text-lg font-bold">Rp 18.000<span className="text-sm font-normal text-muted-foreground">/porsi</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Flame, title: "4 Level Pedas", desc: "Dari tidak pedas sampai extra pedas — bumbu khas juragan." },
            { icon: CalendarCheck, title: "Jadwal Fleksibel", desc: "Atur tanggal & jam pengiriman sesuai acaramu." },
            { icon: Truck, title: "Antar Tepat Waktu", desc: "Tim kurir kami pastikan sajian sampai hangat." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground"><f.icon className="h-5 w-5" /></div>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-12">
        <div className="rounded-3xl bg-gradient-sunset p-8 text-center shadow-warm md:p-14">
          <h2 className="font-display text-3xl font-extrabold text-primary-foreground md:text-4xl">Siap memesan untuk acaramu?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">Pilih paket sesuai jumlah tamu, kami siapkan dan antar fresh.</p>
          <Link to="/menu" className="mt-6 inline-flex">
            <Button size="lg" className="bg-card text-primary hover:bg-card/90">Mulai Pesan</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
