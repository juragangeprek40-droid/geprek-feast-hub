ALTER TYPE menu_category ADD VALUE IF NOT EXISTS 'minuman';

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback"
ON public.feedback FOR INSERT TO public
WITH CHECK (char_length(message) BETWEEN 1 AND 2000 AND char_length(name) BETWEEN 1 AND 100);

CREATE POLICY "Admin view feedback"
ON public.feedback FOR SELECT TO public
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete feedback"
ON public.feedback FOR DELETE TO public
USING (has_role(auth.uid(), 'admin'::app_role));