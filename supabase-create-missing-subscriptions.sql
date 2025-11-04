-- Mevcut kullanıcılar için eksik subscription kayıtlarını oluştur
-- Bu script, user_subscriptions tablosunda kaydı olmayan tüm kullanıcılar için varsayılan subscription oluşturur

INSERT INTO public.user_subscriptions (user_id, plan_id, status, language, is_crm, is_campaign)
SELECT 
  u.id as user_id,
  'free' as plan_id,
  'active' as status,
  'tr' as language,
  false as is_crm,
  false as is_campaign
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.user_subscriptions us 
  WHERE us.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Oluşturulan kayıtları kontrol et
SELECT 
  u.email,
  u.id as user_id,
  us.plan_id,
  us.status,
  us.language
FROM public.users u
LEFT JOIN public.user_subscriptions us ON us.user_id = u.id
ORDER BY u.created_at DESC;

