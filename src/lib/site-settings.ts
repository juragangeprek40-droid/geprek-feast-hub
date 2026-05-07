import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GeneralSettings {
  site_name: string;
  tagline: string;
  description: string;
}
export interface ContactSettings {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
}
export interface PaymentSettings {
  bank_name: string;
  account_number: string;
  account_holder: string;
  instructions: string;
}
export interface HeroSettings {
  headline: string;
  subheadline: string;
  cta_text: string;
  image_url: string;
}

export interface SiteSettings {
  general: GeneralSettings;
  contact: ContactSettings;
  payment: PaymentSettings;
  hero: HeroSettings;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    site_name: "Juragan Geprek",
    tagline: "E-Catering Ayam Geprek Otentik",
    description: "Pesan catering ayam geprek untuk acara, hajatan & keluarga.",
  },
  contact: {
    phone: "0812-3456-7890",
    whatsapp: "6281234567890",
    email: "halo@juragangeprek.com",
    address: "Jl. Merdeka No. 17, Kota Anda",
    instagram: "@juragangeprek",
  },
  payment: {
    bank_name: "BCA",
    account_number: "1234567890",
    account_holder: "Juragan Geprek",
    instructions: "Transfer ke rekening di atas, lalu unggah bukti transfer.",
  },
  hero: {
    headline: "Catering Ayam Geprek Otentik untuk Acaramu",
    subheadline: "Bumbu meresap, sambal nampar, porsi puas untuk hajatan & keluarga.",
    cta_text: "Pesan Sekarang",
  },
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data } = await (supabase.from("site_settings") as any)
    .select("key, value");
  const out: any = { ...DEFAULT_SETTINGS };
  for (const row of data ?? []) {
    out[row.key] = { ...(out[row.key] ?? {}), ...(row.value ?? {}) };
  }
  return out as SiteSettings;
}

export async function upsertSettingSection<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K],
  userId: string | null
) {
  const { error } = await (supabase.from("site_settings") as any).upsert(
    { key, value, updated_by: userId, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) throw error;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchSiteSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);
  return { settings, loading };
}
