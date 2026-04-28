-- 1. Promo fields on menus
ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS promo_price numeric,
  ADD COLUMN IF NOT EXISTS promo_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS promo_end_at timestamptz;

-- 2. Activity logs table for audit trail
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  entity_label text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin view activity logs"
  ON public.activity_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = actor_id);