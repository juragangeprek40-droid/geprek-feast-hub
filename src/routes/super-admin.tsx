import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatRupiah } from "@/lib/cart-store";
import { logActivity } from "@/lib/activity-log";
import { validateImageFile, MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_EXTENSIONS } from "@/lib/file-validation";
import { isPromoActive } from "@/lib/promo";
import { toast } from "sonner";
import {
  ShieldAlert,
  Users,
  UtensilsCrossed,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Bike,
  User as UserIcon,
  History,
  Tag,
  Settings as SettingsIcon,
  Save,
  MessageSquareHeart,
  Star,
} from "lucide-react";
import {
  fetchSiteSettings,
  upsertSettingSection,
  DEFAULT_SETTINGS,
  type SiteSettings,
} from "@/lib/site-settings";

export const Route = createFileRoute("/super-admin")({
  head: () => ({ meta: [{ title: "Super Admin — Juragan Geprek" }] }),
  component: SuperAdminPage,
});

type AppRole = "admin" | "kurir" | "pelanggan";

interface UserRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  roles: AppRole[];
}

interface MenuRow {
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

function SuperAdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading) return <div className="container py-20 text-center">Memuat...</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive/50" />
        <h2 className="mt-3 font-display text-xl font-bold">Akses Ditolak</h2>
        <p className="text-muted-foreground">
          Halaman ini hanya untuk Super Admin.
        </p>
        <Link to="/" className="mt-4 inline-flex">
          <Button variant="outline">Kembali</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-warm shadow-warm">
          <ShieldCheck className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Super Admin</h1>
          <p className="text-muted-foreground">
            Kelola pengguna, peran, dan menu website Juragan Geprek.
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="mt-8">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-secondary">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> <span className="hidden sm:inline">Pengguna & Role</span><span className="sm:hidden">Pengguna</span>
          </TabsTrigger>
          <TabsTrigger value="menus" className="gap-2">
            <UtensilsCrossed className="h-4 w-4" /> <span className="hidden sm:inline">Kelola Menu</span><span className="sm:hidden">Menu</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="h-4 w-4" /> <span className="hidden sm:inline">Audit Log</span><span className="sm:hidden">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <SettingsIcon className="h-4 w-4" /> <span className="hidden sm:inline">Pengaturan Website</span><span className="sm:hidden">Pengaturan</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2">
            <MessageSquareHeart className="h-4 w-4" /> <span className="hidden sm:inline">Kritik & Saran</span><span className="sm:hidden">Saran</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UsersTab currentUserId={user.id} />
        </TabsContent>
        <TabsContent value="menus" className="mt-6">
          <MenusTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <AuditTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <SettingsTab userId={user.id} />
        </TabsContent>
        <TabsContent value="feedback" className="mt-6">
          <FeedbackTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- USERS TAB ---------------- */

function UsersTab({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    setBusy(true);
    const { data: profs, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, address, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    const ids = (profs ?? []).map((p) => p.id);
    let rolesMap: Record<string, AppRole[]> = {};
    if (ids.length) {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      (rolesData ?? []).forEach((r: any) => {
        rolesMap[r.user_id] = [...(rolesMap[r.user_id] ?? []), r.role];
      });
    }
    setUsers(
      (profs ?? []).map((p) => ({
        ...p,
        roles: rolesMap[p.id] ?? [],
      }))
    );
    setBusy(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(userId: string, userLabel: string, oldRole: AppRole, newRole: AppRole) {
    if (oldRole === newRole) return;
    const { error: delErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (delErr) return toast.error(delErr.message);
    const { error: insErr } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });
    if (insErr) return toast.error(insErr.message);
    await logActivity({
      action: "role_changed",
      entity_type: "user",
      entity_id: userId,
      entity_label: userLabel,
      details: { from: oldRole, to: newRole },
    });
    toast.success(`Role diubah menjadi ${newRole}`);
    load();
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.full_name?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Daftar Pengguna</h2>
          <p className="text-sm text-muted-foreground">
            Total {users.length} pengguna terdaftar.
          </p>
        </div>
        <Input
          placeholder="Cari nama / telepon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs"
        />
      </div>

      {busy ? (
        <p className="py-10 text-center text-muted-foreground">Memuat...</p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          Tidak ada pengguna ditemukan.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => {
            const primaryRole: AppRole = u.roles[0] ?? "pelanggan";
            const isSelf = u.id === currentUserId;
            return (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/30 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <RoleIcon role={primaryRole} />
                  </div>
                  <div>
                    <div className="font-semibold">
                      {u.full_name || "(tanpa nama)"}{" "}
                      {isSelf && (
                        <Badge variant="outline" className="ml-1 text-[10px]">
                          Anda
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {u.phone || "-"} · {new Date(u.created_at).toLocaleDateString("id-ID")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="capitalize">{primaryRole}</Badge>
                  <Select
                    value={primaryRole}
                    onValueChange={(v) => changeRole(u.id, u.full_name || u.id, primaryRole, v as AppRole)}
                    disabled={isSelf}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pelanggan">Pelanggan</SelectItem>
                      <SelectItem value="kurir">Kurir</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        * Anda tidak dapat mengubah role akun Anda sendiri untuk mencegah kehilangan akses admin.
      </p>
    </Card>
  );
}

function RoleIcon({ role }: { role: AppRole }) {
  if (role === "admin") return <ShieldCheck className="h-5 w-5" />;
  if (role === "kurir") return <Bike className="h-5 w-5" />;
  return <UserIcon className="h-5 w-5" />;
}

/* ---------------- MENUS TAB ---------------- */

const EMPTY_MENU: Omit<MenuRow, "id"> = {
  name: "",
  description: "",
  price: 0,
  category: "satuan",
  image_url: "",
  is_available: true,
  min_portion: 1,
  promo_price: null,
  promo_start_at: null,
  promo_end_at: null,
};

function MenusTab() {
  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuRow | null>(null);
  const [form, setForm] = useState<Omit<MenuRow, "id">>(EMPTY_MENU);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setBusy(true);
    const { data, error } = await supabase
      .from("menus")
      .select("*")
      .order("category", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setMenus((data ?? []) as MenuRow[]);
    setBusy(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_MENU);
    setOpen(true);
  }

  function openEdit(m: MenuRow) {
    setEditing(m);
    setForm({
      name: m.name,
      description: m.description ?? "",
      price: Number(m.price),
      category: m.category,
      image_url: m.image_url ?? "",
      is_available: m.is_available,
      min_portion: m.min_portion,
      promo_price: m.promo_price != null ? Number(m.promo_price) : null,
      promo_start_at: m.promo_start_at,
      promo_end_at: m.promo_end_at,
    });
    setOpen(true);
  }

  async function handleUpload(file: File) {
    const v = validateImageFile(file);
    if (!v.valid) {
      toast.error(v.error!);
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("menu-images")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
    toast.success("Gambar diunggah");
  }


  async function save() {
    if (!form.name.trim()) return toast.error("Nama menu wajib diisi");
    if (form.price <= 0) return toast.error("Harga harus lebih dari 0");
    if (form.promo_price != null && form.promo_price > 0) {
      if (form.promo_price >= form.price) {
        return toast.error("Harga promo harus lebih kecil dari harga normal");
      }
      if (form.promo_start_at && form.promo_end_at && new Date(form.promo_start_at) >= new Date(form.promo_end_at)) {
        return toast.error("Tanggal akhir promo harus setelah tanggal mulai");
      }
    }

    const payload: any = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      price: form.price,
      category: form.category,
      image_url: form.image_url?.trim() || null,
      is_available: form.is_available,
      min_portion: form.min_portion,
      promo_price: form.promo_price && form.promo_price > 0 ? form.promo_price : null,
      promo_start_at: form.promo_start_at || null,
      promo_end_at: form.promo_end_at || null,
    };

    if (editing) {
      const { error } = await supabase
        .from("menus")
        .update(payload)
        .eq("id", editing.id);
      if (error) return toast.error(error.message);
      await logActivity({
        action: "menu_updated",
        entity_type: "menu",
        entity_id: editing.id,
        entity_label: payload.name,
        details: { price: payload.price, promo_price: payload.promo_price },
      });
      toast.success("Menu diperbarui");
    } else {
      const { data, error } = await supabase.from("menus").insert(payload).select("id").single();
      if (error) return toast.error(error.message);
      await logActivity({
        action: "menu_created",
        entity_type: "menu",
        entity_id: data?.id,
        entity_label: payload.name,
        details: { price: payload.price, category: payload.category },
      });
      toast.success("Menu ditambahkan");
    }
    setOpen(false);
    load();
  }

  async function remove(id: string, name: string) {
    const { error } = await supabase.from("menus").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await logActivity({
      action: "menu_deleted",
      entity_type: "menu",
      entity_id: id,
      entity_label: name,
    });
    toast.success("Menu dihapus");
    load();
  }

  async function toggleAvailable(m: MenuRow) {
    const next = !m.is_available;
    const { error } = await supabase
      .from("menus")
      .update({ is_available: next })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    await logActivity({
      action: "menu_availability_toggled",
      entity_type: "menu",
      entity_id: m.id,
      entity_label: m.name,
      details: { is_available: next },
    });
    load();
  }

  return (
    <Card className="p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Daftar Menu</h2>
          <p className="text-sm text-muted-foreground">
            {menus.length} menu — {menus.filter((m) => m.is_available).length} tersedia
          </p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-warm text-primary-foreground shadow-warm">
          <Plus className="mr-1 h-4 w-4" /> Tambah Menu
        </Button>
      </div>

      {busy ? (
        <p className="py-10 text-center text-muted-foreground">Memuat...</p>
      ) : menus.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          Belum ada menu. Klik "Tambah Menu" untuk memulai.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {menus.map((m) => (
            <div
              key={m.id}
              className="flex gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3"
            >
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                {m.image_url ? (
                  <img src={m.image_url} alt={m.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <UtensilsCrossed className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{m.name}</span>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {m.category}
                      </Badge>
                    </div>
                    <div className="font-display text-base font-bold text-primary">
                      {formatRupiah(Number(m.price))}
                    </div>
                  </div>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {m.description || "-"}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-xs">
                    <Switch
                      checked={m.is_available}
                      onCheckedChange={() => toggleAvailable(m)}
                    />
                    {m.is_available ? "Tersedia" : "Habis"}
                  </label>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus menu ini?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{m.name}" akan dihapus permanen dari katalog.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => remove(m.id, m.name)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Menu" : "Tambah Menu Baru"}</DialogTitle>
            <DialogDescription>
              Isi detail menu yang akan ditampilkan di katalog.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div>
              <Label>Nama Menu</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Geprek Original"
              />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Deskripsi singkat menu"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Harga (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label>Kategori</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({ ...form, category: v as "paket" | "satuan" | "minuman" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="satuan">Satuan</SelectItem>
                    <SelectItem value="paket">Paket Catering</SelectItem>
                    <SelectItem value="minuman">Minuman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Minimum Porsi</Label>
              <Input
                type="number"
                min={1}
                value={form.min_portion}
                onChange={(e) =>
                  setForm({ ...form, min_portion: Number(e.target.value) || 1 })
                }
              />
            </div>
            <div>
              <Label>Gambar Menu</Label>
              <div className="flex items-center gap-3">
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt="preview"
                    className="h-16 w-16 rounded-md object-cover"
                  />
                )}
                <Input
                  type="file"
                  accept={ALLOWED_IMAGE_EXTENSIONS.map((e) => `.${e}`).join(",")}
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Format: {ALLOWED_IMAGE_EXTENSIONS.join(", ").toUpperCase()} · Maks {MAX_IMAGE_SIZE_MB} MB
              </p>
              {uploading && (
                <p className="mt-1 text-xs text-muted-foreground">Mengunggah...</p>
              )}
            </div>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <Tag className="h-4 w-4" /> Pengaturan Promo (opsional)
              </div>
              <div>
                <Label className="text-xs">Harga Promo (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Kosongkan jika tidak ada promo"
                  value={form.promo_price ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      promo_price: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Mulai Promo</Label>
                  <Input
                    type="datetime-local"
                    value={form.promo_start_at ? toLocalInput(form.promo_start_at) : ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        promo_start_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Akhir Promo</Label>
                  <Input
                    type="datetime-local"
                    value={form.promo_end_at ? toLocalInput(form.promo_end_at) : ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        promo_end_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Kosongkan tanggal untuk promo tanpa batas. Harga promo otomatis tampil di katalog selama aktif.
              </p>
            </div>

            <label className="flex items-center gap-2">
              <Switch
                checked={form.is_available}
                onCheckedChange={(v) => setForm({ ...form, is_available: v })}
              />
              <span className="text-sm">Tersedia untuk dipesan</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={save}
              className="bg-gradient-warm text-primary-foreground shadow-warm"
            >
              {editing ? "Simpan Perubahan" : "Tambah Menu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ---------------- HELPERS ---------------- */

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ---------------- AUDIT TAB ---------------- */

interface ActivityLog {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  details: any;
  created_at: string;
}

const ACTION_LABEL: Record<string, string> = {
  role_changed: "Mengubah role",
  menu_created: "Menambah menu",
  menu_updated: "Memperbarui menu",
  menu_deleted: "Menghapus menu",
  menu_availability_toggled: "Mengubah ketersediaan menu",
  settings_updated: "Memperbarui pengaturan",
};

function AuditTab() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [busy, setBusy] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  async function load() {
    setBusy(true);
    const { data, error } = await (supabase.from("activity_logs") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setLogs((data ?? []) as ActivityLog[]);
    setBusy(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = logs.filter((l) => {
    if (filter === "all") return true;
    if (filter === "user") return l.entity_type === "user";
    if (filter === "menu") return l.entity_type === "menu";
    return true;
  });

  return (
    <Card className="p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Riwayat Aktivitas</h2>
          <p className="text-sm text-muted-foreground">
            {logs.length} catatan terakhir (maks. 200). Audit trail siapa mengubah apa & kapan.
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua aktivitas</SelectItem>
            <SelectItem value="user">Perubahan Role</SelectItem>
            <SelectItem value="menu">Aktivitas Menu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {busy ? (
        <p className="py-10 text-center text-muted-foreground">Memuat...</p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">Belum ada aktivitas tercatat.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => (
            <div
              key={l.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {l.entity_type === "user" ? <UserIcon className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <div>
                    <span className="font-semibold">{l.actor_name || "Sistem"}</span>{" "}
                    <span className="text-muted-foreground">
                      {ACTION_LABEL[l.action] || l.action}
                    </span>{" "}
                    {l.entity_label && (
                      <span className="font-medium">"{l.entity_label}"</span>
                    )}
                  </div>
                  {l.details && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {formatDetails(l.action, l.details)}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(l.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function formatDetails(action: string, details: any): string {
  if (!details) return "";
  if (action === "role_changed") return `Dari "${details.from}" → "${details.to}"`;
  if (action === "menu_availability_toggled")
    return details.is_available ? "Diaktifkan kembali" : "Ditandai habis";
  if (action === "menu_created" || action === "menu_updated") {
    const parts: string[] = [];
    if (details.price) parts.push(`harga Rp ${Number(details.price).toLocaleString("id-ID")}`);
    if (details.promo_price) parts.push(`promo Rp ${Number(details.promo_price).toLocaleString("id-ID")}`);
    if (details.category) parts.push(details.category);
    return parts.join(" · ");
  }
  return "";
}

/* ---------------- SETTINGS TAB ---------------- */

function SettingsTab({ userId }: { userId: string }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [busy, setBusy] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchSiteSettings()
      .then(setSettings)
      .finally(() => setBusy(false));
  }, []);

  async function saveSection<K extends keyof SiteSettings>(key: K) {
    setSavingKey(key);
    try {
      await upsertSettingSection(key, settings[key], userId);
      await logActivity({
        action: "settings_updated",
        entity_type: "site_settings",
        entity_id: key,
        entity_label: key,
        details: settings[key] as any,
      });
      toast.success(`Pengaturan "${key}" disimpan`);
    } catch (e: any) {
      toast.error(e.message ?? "Gagal menyimpan");
    } finally {
      setSavingKey(null);
    }
  }

  function update<K extends keyof SiteSettings>(key: K, patch: Partial<SiteSettings[K]>) {
    setSettings((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
  }

  if (busy) return <p className="py-10 text-center text-muted-foreground">Memuat...</p>;

  return (
    <div className="space-y-5">
      {/* GENERAL */}
      <Card className="p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Informasi Umum</h3>
            <p className="text-xs text-muted-foreground">Nama, tagline, dan deskripsi situs.</p>
          </div>
          <Button onClick={() => saveSection("general")} disabled={savingKey === "general"} className="bg-gradient-warm text-primary-foreground shadow-warm">
            <Save className="mr-1 h-4 w-4" /> Simpan
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Nama Website</Label>
            <Input value={settings.general.site_name} onChange={(e) => update("general", { site_name: e.target.value })} />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input value={settings.general.tagline} onChange={(e) => update("general", { tagline: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Deskripsi (SEO)</Label>
            <Textarea rows={2} value={settings.general.description} onChange={(e) => update("general", { description: e.target.value })} />
          </div>
        </div>
      </Card>

      {/* HERO */}
      <Card className="p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Hero Beranda</h3>
            <p className="text-xs text-muted-foreground">Judul utama yang tampil di halaman depan.</p>
          </div>
          <Button onClick={() => saveSection("hero")} disabled={savingKey === "hero"} className="bg-gradient-warm text-primary-foreground shadow-warm">
            <Save className="mr-1 h-4 w-4" /> Simpan
          </Button>
        </div>
        <div className="grid gap-3">
          <div>
            <Label>Headline</Label>
            <Input value={settings.hero.headline} onChange={(e) => update("hero", { headline: e.target.value })} />
          </div>
          <div>
            <Label>Subheadline</Label>
            <Textarea rows={2} value={settings.hero.subheadline} onChange={(e) => update("hero", { subheadline: e.target.value })} />
          </div>
          <div>
            <Label>Teks Tombol CTA</Label>
            <Input value={settings.hero.cta_text} onChange={(e) => update("hero", { cta_text: e.target.value })} />
          </div>
          <HeroImageEditor
            value={settings.hero.image_url}
            onChange={(url) => update("hero", { image_url: url })}
          />
        </div>
      </Card>

      {/* CONTACT */}
      <Card className="p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Kontak</h3>
            <p className="text-xs text-muted-foreground">Informasi kontak yang tampil di footer.</p>
          </div>
          <Button onClick={() => saveSection("contact")} disabled={savingKey === "contact"} className="bg-gradient-warm text-primary-foreground shadow-warm">
            <Save className="mr-1 h-4 w-4" /> Simpan
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Nomor Telepon</Label>
            <Input value={settings.contact.phone} onChange={(e) => update("contact", { phone: e.target.value })} />
          </div>
          <div>
            <Label>WhatsApp (62...)</Label>
            <Input value={settings.contact.whatsapp} onChange={(e) => update("contact", { whatsapp: e.target.value })} placeholder="6281234567890" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={settings.contact.email} onChange={(e) => update("contact", { email: e.target.value })} />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input value={settings.contact.instagram} onChange={(e) => update("contact", { instagram: e.target.value })} placeholder="@username" />
          </div>
          <div className="md:col-span-2">
            <Label>Alamat</Label>
            <Textarea rows={2} value={settings.contact.address} onChange={(e) => update("contact", { address: e.target.value })} />
          </div>
        </div>
      </Card>

      {/* PAYMENT */}
      <Card className="p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Pembayaran (Transfer Bank)</h3>
            <p className="text-xs text-muted-foreground">Rekening tujuan transfer untuk checkout.</p>
          </div>
          <Button onClick={() => saveSection("payment")} disabled={savingKey === "payment"} className="bg-gradient-warm text-primary-foreground shadow-warm">
            <Save className="mr-1 h-4 w-4" /> Simpan
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Nama Bank</Label>
            <Input value={settings.payment.bank_name} onChange={(e) => update("payment", { bank_name: e.target.value })} />
          </div>
          <div>
            <Label>Nomor Rekening</Label>
            <Input value={settings.payment.account_number} onChange={(e) => update("payment", { account_number: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Atas Nama</Label>
            <Input value={settings.payment.account_holder} onChange={(e) => update("payment", { account_holder: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Instruksi Pembayaran</Label>
            <Textarea rows={3} value={settings.payment.instructions} onChange={(e) => update("payment", { instructions: e.target.value })} />
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- FEEDBACK TAB ---------------- */

interface FeedbackRow {
  id: string;
  name: string;
  email: string | null;
  rating: number;
  message: string;
  created_at: string;
  user_id: string | null;
}

function FeedbackTab() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [busy, setBusy] = useState(true);

  async function load() {
    setBusy(true);
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as FeedbackRow[]);
    setBusy(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Feedback dihapus");
    load();
  }

  const avg = items.length
    ? (items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1)
    : "—";

  if (busy) return <div className="py-10 text-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Total Masukan</div>
          <div className="font-display text-2xl font-bold">{items.length}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Rata-rata Rating</div>
          <div className="flex items-center gap-1 justify-end font-display text-2xl font-bold">
            <Star className="h-5 w-5 fill-primary text-primary" />
            {avg}
          </div>
        </div>
      </Card>

      {items.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Belum ada masukan.</Card>
      ) : (
        items.map((f) => (
          <Card key={f.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{f.name}</span>
                  {f.email && <span className="text-xs text-muted-foreground">· {f.email}</span>}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-3.5 w-3.5 ${n <= f.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{f.message}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {new Date(f.created_at).toLocaleString("id-ID")}
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus feedback ini?</AlertDialogTitle>
                    <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove(f.id)}>Hapus</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

