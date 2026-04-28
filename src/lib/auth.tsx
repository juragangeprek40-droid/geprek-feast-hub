import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "kurir" | "pelanggan";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isKurir: boolean;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => fetchRoles(s.user.id), 0);
      } else {
        setRoles([]);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) fetchRoles(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchRoles(uid: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  }

  async function signOut() {
    await supabase.auth.signOut();
    setRoles([]);
  }

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        roles,
        loading,
        signOut,
        isAdmin: roles.includes("admin"),
        isKurir: roles.includes("kurir"),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}
