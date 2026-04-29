import { Link } from "@tanstack/react-router";
import { ShoppingCart, User, LogOut, LayoutDashboard, Bike, ShieldCheck } from "lucide-react";
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

export function Navbar() {
  const { user, isAdmin, isKurir, signOut } = useAuth();
  const cart = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Juragan Geprek" className="h-10 w-10 object-contain" />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold text-foreground">Juragan Geprek</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">E-Catering</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary" activeProps={{ className: "text-primary" }}>
            Beranda
          </Link>
          <Link to="/menu" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary" activeProps={{ className: "text-primary" }}>
            Menu
          </Link>
          <Link to="/checkout" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary" activeProps={{ className: "text-primary" }}>
            Pesan
          </Link>
          {user && (
            <Link to="/orders" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary" activeProps={{ className: "text-primary" }}>
              Pesanan Saya
            </Link>
          )}
          <Link to="/feedback" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary" activeProps={{ className: "text-primary" }}>
            Kritik & Saran
          </Link>
        </nav>

        <div className="flex items-center gap-2">
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
            <Link to="/auth">
              <Button className="bg-gradient-warm text-primary-foreground shadow-warm hover:opacity-95">Masuk</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
