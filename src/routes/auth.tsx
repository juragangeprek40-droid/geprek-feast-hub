import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Flame } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Masuk / Daftar — Juragan Geprek" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ email: "", password: "", full_name: "", phone: "" });

  useEffect(() => {
    if (!loading && user) navigate({ to: "/orders" });
  }, [user, loading, navigate]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(loginForm);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Selamat datang kembali!");
    navigate({ to: "/orders" });
  }

  async function signup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: signupForm.email,
      password: signupForm.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: signupForm.full_name, phone: signupForm.phone },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Akun dibuat! Silakan masuk.");
  }

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-12">
      <Link to="/" className="mb-6 flex items-center gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-warm shadow-warm">
          <Flame className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="font-display text-xl font-bold">Juragan Geprek</div>
      </Link>

      <Card className="w-full p-6 shadow-warm border-primary/20">
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger value="login">Masuk</TabsTrigger>
            <TabsTrigger value="signup">Daftar</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-5">
            <form onSubmit={login} className="space-y-4">
              <div><Label>Email</Label><Input type="email" required value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} /></div>
              <div><Label>Password</Label><Input type="password" required value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} /></div>
              <Button type="submit" disabled={busy} className="w-full bg-gradient-warm text-primary-foreground shadow-warm">{busy ? "Memproses..." : "Masuk"}</Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-5">
            <form onSubmit={signup} className="space-y-4">
              <div><Label>Nama Lengkap</Label><Input required value={signupForm.full_name} onChange={(e) => setSignupForm({ ...signupForm, full_name: e.target.value })} /></div>
              <div><Label>No. HP</Label><Input required value={signupForm.phone} onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" required value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} /></div>
              <div><Label>Password (min 6 karakter)</Label><Input type="password" required minLength={6} value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} /></div>
              <Button type="submit" disabled={busy} className="w-full bg-gradient-warm text-primary-foreground shadow-warm">{busy ? "Memproses..." : "Daftar Akun"}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
