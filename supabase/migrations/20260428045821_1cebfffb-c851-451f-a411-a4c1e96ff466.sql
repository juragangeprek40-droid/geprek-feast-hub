
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'kurir', 'pelanggan');
CREATE TYPE public.order_type AS ENUM ('paket', 'satuan');
CREATE TYPE public.order_status AS ENUM ('pending', 'dibayar', 'diproses', 'dikirim', 'selesai', 'dibatalkan');
CREATE TYPE public.spice_level AS ENUM ('tidak_pedas', 'sedang', 'pedas', 'extra_pedas');
CREATE TYPE public.menu_category AS ENUM ('paket', 'satuan');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- ============ MENUS ============
CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  category menu_category NOT NULL DEFAULT 'satuan',
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  min_portion INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('EG-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random()*10000)::text, 4, '0')),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_phone TEXT,
  order_type order_type NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_time TIME,
  delivery_address TEXT NOT NULL,
  notes TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  payment_proof_url TEXT,
  courier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ============ ORDER ITEMS ============
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL,
  menu_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  spice_level spice_level NOT NULL DEFAULT 'sedang',
  extras TEXT,
  subtotal NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_menus_updated BEFORE UPDATE ON public.menus FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto create profile + default pelanggan role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'pelanggan')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============
-- Profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Menus: public read, admin manage
CREATE POLICY "Anyone view menus" ON public.menus FOR SELECT USING (true);
CREATE POLICY "Admin manage menus" ON public.menus FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Orders: customers see own, admin sees all, courier sees assigned, guests can insert
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT USING (
  auth.uid() = customer_id
  OR public.has_role(auth.uid(),'admin')
  OR (public.has_role(auth.uid(),'kurir') AND auth.uid() = courier_id)
);
CREATE POLICY "Anyone insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Courier update assigned orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(),'kurir') AND auth.uid() = courier_id) WITH CHECK (public.has_role(auth.uid(),'kurir') AND auth.uid() = courier_id);
CREATE POLICY "Customers update own pending orders" ON public.orders FOR UPDATE USING (auth.uid() = customer_id AND status IN ('pending','dibayar')) WITH CHECK (auth.uid() = customer_id);

-- Order items
CREATE POLICY "View order items via order" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (
    o.customer_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR (public.has_role(auth.uid(),'kurir') AND o.courier_id = auth.uid())
  ))
);
CREATE POLICY "Anyone insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- ============ STORAGE: payment-proofs ============
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true);

CREATE POLICY "Anyone upload payment proof" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');
CREATE POLICY "Anyone view payment proof" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');

-- Menu images bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);
CREATE POLICY "Anyone view menu images" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "Admin upload menu images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND public.has_role(auth.uid(),'admin'));

-- ============ SEED MENUS ============
INSERT INTO public.menus (name, description, price, category, min_portion) VALUES
('Geprek Original', 'Ayam geprek sambal bawang khas Juragan Geprek dengan nasi hangat', 18000, 'satuan', 1),
('Geprek Keju', 'Ayam geprek lumer dengan topping keju mozzarella', 25000, 'satuan', 1),
('Geprek Sambal Matah', 'Ayam geprek dengan sambal matah segar khas Bali', 22000, 'satuan', 1),
('Paket Hemat 10 Porsi', 'Paket catering 10 porsi geprek original lengkap dengan nasi & lalapan', 165000, 'paket', 10),
('Paket Spesial 25 Porsi', 'Paket 25 porsi mix geprek original & keju, cocok untuk acara keluarga', 475000, 'paket', 25),
('Paket Acara 50 Porsi', 'Paket besar 50 porsi untuk hajatan & arisan, free es teh', 900000, 'paket', 50);
