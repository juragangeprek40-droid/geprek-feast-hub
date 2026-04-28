-- Site settings: key-value singleton table for website-wide configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete site settings"
  ON public.site_settings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Seed default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('general', jsonb_build_object(
    'site_name', 'Juragan Geprek',
    'tagline', 'E-Catering Ayam Geprek Otentik',
    'description', 'Pesan catering ayam geprek untuk acara, hajatan & keluarga.'
  )),
  ('contact', jsonb_build_object(
    'phone', '0812-3456-7890',
    'whatsapp', '6281234567890',
    'email', 'halo@juragangeprek.com',
    'address', 'Jl. Merdeka No. 17, Kota Anda',
    'instagram', '@juragangeprek'
  )),
  ('payment', jsonb_build_object(
    'bank_name', 'BCA',
    'account_number', '1234567890',
    'account_holder', 'Juragan Geprek',
    'instructions', 'Transfer ke rekening di atas, lalu unggah bukti transfer.'
  )),
  ('hero', jsonb_build_object(
    'headline', 'Catering Ayam Geprek Otentik untuk Acaramu',
    'subheadline', 'Bumbu meresap, sambal nampar, porsi puas untuk hajatan & keluarga.',
    'cta_text', 'Pesan Sekarang'
  ))
ON CONFLICT (key) DO NOTHING;