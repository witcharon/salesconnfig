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

-- RLS (Row Level Security) politikaları
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

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

-- Trigger: auth.users'dan public.users'a otomatik sync
-- Bu trigger hem INSERT hem UPDATE işlemlerini handle eder
CREATE OR REPLACE FUNCTION public.handle_auth_user_sync()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, last_sign_in_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.created_at, NOW()),
    NEW.last_sign_in_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    last_sign_in_at = COALESCE(EXCLUDED.last_sign_in_at, public.users.last_sign_in_at),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mevcut trigger'ı kaldır (varsa)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Yeni trigger'ı oluştur (hem INSERT hem UPDATE için)
CREATE TRIGGER on_auth_user_sync
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_sync();

-- Mevcut auth.users kayıtlarını public.users'a kopyala (ilk kurulum için)
-- Bu sorgu migration çalıştırıldığında mevcut tüm auth.users kayıtlarını public.users'a kopyalar
INSERT INTO public.users (id, email, created_at, last_sign_in_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(created_at, NOW()) as created_at, 
  last_sign_in_at,
  NOW() as updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  last_sign_in_at = COALESCE(EXCLUDED.last_sign_in_at, public.users.last_sign_in_at),
  updated_at = NOW();

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON public.users(is_super_admin);

