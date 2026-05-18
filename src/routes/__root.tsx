import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">Yuk kembali pesan geprek favoritmu.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-gradient-warm px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-warm">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Juragan Geprek — E-Catering Ayam Geprek" },
      { name: "description", content: "Pesan catering ayam geprek otentik untuk acara, hajatan & keluarga. Pesan paket porsi banyak atau satuan dengan jadwal pengiriman fleksibel." },
      { property: "og:title", content: "Juragan Geprek — E-Catering Ayam Geprek" },
      { name: "twitter:title", content: "Juragan Geprek — E-Catering Ayam Geprek" },
      { property: "og:description", content: "Pesan catering ayam geprek otentik untuk acara, hajatan & keluarga. Pesan paket porsi banyak atau satuan dengan jadwal pengiriman fleksibel." },
      { name: "twitter:description", content: "Pesan catering ayam geprek otentik untuk acara, hajatan & keluarga. Pesan paket porsi banyak atau satuan dengan jadwal pengiriman fleksibel." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/230395b8-802e-44ed-8fab-d4dba5db2893" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/230395b8-802e-44ed-8fab-d4dba5db2893" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Juragan Geprek",
              url: "https://geprek-feast-hub.lovable.app/",
              logo: "https://geprek-feast-hub.lovable.app/favicon.ico",
            },
            {
              "@type": "WebSite",
              name: "Juragan Geprek",
              url: "https://geprek-feast-hub.lovable.app/",
              inLanguage: "id-ID",
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}
