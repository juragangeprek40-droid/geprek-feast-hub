import logo from "@/assets/logo.png";
import { useSiteSettings } from "@/lib/site-settings";

export function Footer() {
  const { settings } = useSiteSettings();
  return (
    <footer className="border-t border-border/60 bg-cream/60 mt-16">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Juragan Geprek" className="h-10 w-10 object-contain" />
            <div className="font-display text-lg font-bold">Juragan Geprek</div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            Catering ayam geprek otentik untuk acara, hajatan, dan keluarga.
          </p>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold mb-2">Kontak</h4>
          <p className="text-muted-foreground">WA: 0812-3456-7890</p>
          <p className="text-muted-foreground">Email: order@juragangeprek.id</p>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold mb-2">Pembayaran</h4>
          <p className="text-muted-foreground">BCA 1234567890</p>
          <p className="text-muted-foreground">a.n. Juragan Geprek</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Juragan Geprek. Sedap kapan saja.
      </div>
    </footer>
  );
}
