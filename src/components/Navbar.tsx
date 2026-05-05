import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingCart, User, LogOut, LayoutDashboard, Bike, ShieldCheck, Menu as MenuIcon } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { to: "/", label: "Beranda" },
  { to: "/menu", label: "Menu" },
  { to: "/checkout", label: "Pesan" },
  { to: "/feedback", label: "Kritik & Saran" },
] as const;

export function Navbar() {
  const { user, isAdmin, isKurir, signOut } = useAuth();
  const cart = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-3 sm:px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src={logo} alt="Juragan Geprek" className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10" />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-base font-bold text-foreground sm:text-lg">Juragan Geprek</div>
            <div className="hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:block">E-Catering</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary" activeProps={{ className: "text-primary" }}>
              {l.label}
            </Link>
          ))}
          {user && (
            <Link to="/orders" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary" activeProps={{ className: "text-primary" }}>
              Pesanan Saya
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/checkout" className="relative">
            <Button variant="ghost" size="icon" className="text-foreground">
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {cart.length}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                <DropdownMenuSeparator />
                <Link to="/orders">
                  <DropdownMenuItem><User className="mr-2 h-4 w-4" />Pesanan Saya</DropdownMenuItem>
                </Link>
                {isAdmin && (
                  <>
                    <Link to="/admin">
                      <DropdownMenuItem><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard Admin</DropdownMenuItem>
                    </Link>
                    <Link to="/super-admin">
                      <DropdownMenuItem><ShieldCheck className="mr-2 h-4 w-4" />Super Admin</DropdownMenuItem>
                    </Link>
                  </>
                )}
                {isKurir && (
                  <Link to="/kurir">
                    <DropdownMenuItem><Bike className="mr-2 h-4 w-4" />Dashboard Kurir</DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Keluar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" className="hidden sm:inline-flex">
              <Button className="bg-gradient-warm text-primary-foreground shadow-warm hover:opacity-95">Masuk</Button>
            </Link>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Buka menu">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-primary"
                    activeProps={{ className: "bg-secondary text-primary" }}
                  >
                    {l.label}
                  </Link>
                ))}
                {user && (
                  <Link to="/orders" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-primary" activeProps={{ className: "bg-secondary text-primary" }}>
                    Pesanan Saya
                  </Link>
                )}
                {isAdmin && (
                  <>
                    <Link to="/admin" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-primary">
                      Dashboard Admin
                    </Link>
                    <Link to="/super-admin" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-primary">
                      Super Admin
                    </Link>
                  </>
                )}
                {isKurir && (
                  <Link to="/kurir" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-primary">
                    Dashboard Kurir
                  </Link>
                )}
                {!user && (
                  <Link to="/auth" onClick={() => setMobileOpen(false)} className="mt-2">
                    <Button className="w-full bg-gradient-warm text-primary-foreground shadow-warm">Masuk / Daftar</Button>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
