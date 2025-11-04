-- user_subscriptions tablosu için RLS politikalarını düzelt
-- Service role kullanıldığında RLS bypass edilir, ancak client-side sorgular için gerekli

-- Mevcut politikaları kaldır (varsa)
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON public.user_subscriptions;

-- Super admin'lerin tüm subscription'ları görebilmesi için policy
CREATE POLICY "Super admins can view all subscriptions" ON public.user_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_super_admin = TRUE
    )
  );

-- Kullanıcıların kendi subscription'larını görebilmesi için policy
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Not: Service role kullanıldığında bu politikalar bypass edilir
-- Bu politikalar sadece client-side (anon key) sorgular için geçerlidir

