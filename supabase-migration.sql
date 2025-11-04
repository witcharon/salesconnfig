-- users tablosunu oluştur (auth.users ile sync için)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  is_super_admin BOOLEAN DEFAULT FALSE,
  CONSTRAINT users_email_unique UNIQUE(email)
);

-- user_subscriptions tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'pro', 'team')),
  status TEXT NOT NULL CHECK (status IN ('active', 'deactive')),
  current_period_end TIMESTAMPTZ,
  language TEXT NOT NULL CHECK (language IN ('tr', 'en')) DEFAULT 'tr',
  logo TEXT,
  is_crm BOOLEAN DEFAULT FALSE,
  is_campaign BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_subscriptions_auth_id_unique UNIQUE(auth_id)
);

-- RLS (Row Level Security) politikaları
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- users tablosu için policy (sadece kendi kaydını görebilir veya super admin hepsini görebilir)
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_super_admin = TRUE
    )
  );

-- user_subscriptions için policy
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Super admins can view all subscriptions" ON public.user_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_super_admin = TRUE
    )
  );

-- Trigger: auth.users'dan public.users'a otomatik sync
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, last_sign_in_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.created_at,
    NEW.last_sign_in_at
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: auth.users güncellendiğinde public.users'ı güncelle
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    last_sign_in_at = NEW.last_sign_in_at,
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mevcut auth.users kayıtlarını public.users'a kopyala (ilk kurulum için)
INSERT INTO public.users (id, email, created_at, last_sign_in_at)
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON public.users(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_auth_id ON public.user_subscriptions(auth_id);

