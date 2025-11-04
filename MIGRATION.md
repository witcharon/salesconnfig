# Migration Rehberi

## Önemli Notlar

⚠️ **Migration mutlaka çalıştırılmalıdır!** `public.users` tablosu otomatik oluşturulmaz.

Migration dosyası (`supabase-migration.sql`) şunları yapar:

1. ✅ `public.users` tablosunu oluşturur
2. ✅ `public.user_subscriptions` tablosunu oluşturur  
3. ✅ Trigger oluşturur (auth.users'dan public.users'a otomatik sync)
4. ✅ RLS politikalarını ayarlar
5. ✅ Mevcut auth.users kayıtlarını public.users'a kopyalar

## Migration Adımları

### 1. Supabase Dashboard'a Gidin

https://supabase.com/dashboard adresine gidin ve projenizi seçin.

### 2. SQL Editor'ı Açın

Sol menüden **SQL Editor** seçeneğine tıklayın.

### 3. Migration SQL'ini Çalıştırın

`supabase-migration.sql` dosyasının tüm içeriğini kopyalayın ve SQL Editor'a yapıştırın. Sonra **Run** butonuna tıklayın.

### 4. Sonuçları Kontrol Edin

Migration başarılı olduysa şunları görmelisiniz:

- ✅ `public.users` tablosu oluşturuldu
- ✅ `public.user_subscriptions` tablosu oluşturuldu
- ✅ Trigger'lar oluşturuldu
- ✅ RLS politikaları ayarlandı
- ✅ Mevcut auth.users kayıtları public.users'a kopyalandı

### 5. İlk Super Admin Kullanıcısını Oluşturun

Migration'dan sonra, bir kullanıcıyı super admin yapmak için:

```sql
UPDATE public.users 
SET is_super_admin = TRUE 
WHERE email = 'your-admin-email@example.com';
```

**Not:** Eğer auth.users'da henüz kullanıcı yoksa, önce Supabase Dashboard'dan veya uygulama üzerinden bir kullanıcı oluşturun. Trigger otomatik olarak public.users'a ekleyecektir.

## Trigger Nasıl Çalışır?

Migration'dan sonra:

- ✅ Yeni bir kullanıcı `auth.users`'a eklendiğinde → Otomatik olarak `public.users`'a da eklenir
- ✅ Bir kullanıcı `auth.users`'da güncellendiğinde → `public.users`'da da güncellenir
- ✅ Email ve last_sign_in_at bilgileri otomatik sync edilir

## Sorun Giderme

### Migration başarısız oldu

1. SQL Editor'da hata mesajını kontrol edin
2. Tablolar zaten varsa `IF NOT EXISTS` sayesinde sorun olmamalı
3. Trigger'lar varsa `DROP TRIGGER IF EXISTS` ile kaldırılır

### public.users tablosu boş

1. Migration'daki INSERT sorgusunu tekrar çalıştırın:
```sql
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
```

### Trigger çalışmıyor

1. Trigger'ın varlığını kontrol edin:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_sync';
```

2. Function'ın varlığını kontrol edin:
```sql
SELECT * FROM pg_proc WHERE proname = 'handle_auth_user_sync';
```

3. Gerekirse trigger'ı yeniden oluşturun (migration dosyasındaki trigger bölümünü tekrar çalıştırın)

## Vercel Deployment Sonrası

Vercel'de build aldıktan sonra:

1. ✅ Supabase Dashboard'a gidin
2. ✅ SQL Editor'da migration'ı çalıştırın
3. ✅ İlk super admin kullanıcısını oluşturun
4. ✅ Uygulamayı test edin

Migration'ı çalıştırmadan uygulama çalışmayacaktır çünkü `public.users` tablosu olmadan middleware ve sayfalar hata verecektir.

