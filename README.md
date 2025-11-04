# Connfig Sales

Connfig uygulaması için kullanıcı yönetim ve demo süresi takip uygulaması.

## Özellikler

- 🔐 Super admin girişi (sadece `is_super_admin=true` olan kullanıcılar giriş yapabilir)
- 👥 Kullanıcı listesi ve detaylı görüntüleme
- 📊 Kullanıcı abonelik bilgileri yönetimi
- ➕ Yeni kullanıcı oluşturma (mail onaylı)
- ✏️ Abonelik bilgilerini düzenleme
- 🌓 Dark/Light mode desteği
- 📱 Responsive tasarım

## Teknolojiler

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Supabase** - Database & Authentication
- **TanStack Table** - Data table

## Kurulum

### 1. Bağımlılıkları yükleyin

```bash
npm install
```

### 2. Environment Variables

`.env.local` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret
```

### 3. Supabase Migration (ÖNEMLİ!)

**Migration mutlaka çalıştırılmalıdır!** `public.users` tablosu otomatik oluşturulmaz.

#### Yöntem 1: Supabase SQL Editor (Önerilen)

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden **SQL Editor**'ı açın
4. `supabase-migration.sql` dosyasının içeriğini kopyalayın
5. SQL Editor'a yapıştırın ve **Run** butonuna tıklayın

Bu işlem:
- `public.users` tablosunu oluşturur (auth.users ile sync için)
- `public.user_subscriptions` tablosunu oluşturur
- Trigger'ları ayarlar (auth.users'dan public.users'a otomatik sync)
- RLS politikalarını ayarlar
- Mevcut auth.users kayıtlarını public.users'a kopyalar

#### Yöntem 2: Migration Kontrol Script'i

```bash
npm run migrate:check
```

Bu script migration durumunu kontrol eder ve gerekli SQL'i gösterir.

### 4. İlk Super Admin Kullanıcısı

Supabase SQL Editor'da ilk super admin kullanıcısını oluşturun:

```sql
-- Önce auth.users'da kullanıcı oluşturun (Supabase Dashboard'dan veya API ile)
-- Sonra public.users tablosunda is_super_admin'i true yapın:

UPDATE public.users 
SET is_super_admin = TRUE 
WHERE email = 'admin@example.com';
```

### 5. Development Server'ı Başlatın

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## Veritabanı Yapısı

### public.users

- `id` (UUID, PRIMARY KEY) - auth.users ile eşleşir
- `email` (VARCHAR) - Kullanıcı e-postası
- `phone` (TEXT) - Telefon numarası
- `created_at` (TIMESTAMPTZ) - Oluşturulma tarihi
- `updated_at` (TIMESTAMPTZ) - Güncelleme tarihi
- `last_sign_in_at` (TIMESTAMPTZ) - Son giriş tarihi
- `is_super_admin` (BOOLEAN) - Super admin yetkisi

### public.user_subscriptions

- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY) - auth.users.id ile eşleşir
- `plan_id` (TEXT) - 'free', 'pro', 'team'
- `status` (TEXT) - 'active', 'deactive'
- `current_period_end` (TIMESTAMPTZ) - Lisans bitiş tarihi
- `language` (TEXT) - 'tr', 'en'
- `logo` (TEXT) - Logo URL
- `is_crm` (BOOLEAN) - CRM modülü aktif/pasif
- `is_campaign` (BOOLEAN) - Campaign modülü aktif/pasif

## Kullanım

1. **Giriş Yap**: `/login` sayfasından super admin hesabıyla giriş yapın
2. **Kullanıcıları Görüntüle**: Anasayfada tüm kullanıcılar ve abonelik bilgileri görüntülenir
3. **Yeni Kullanıcı Oluştur**: Sağ üstteki "Kullanıcı Oluştur" butonunu kullanın
4. **Abonelik Düzenle**: Her kullanıcının satırındaki kalem ikonuna tıklayarak abonelik bilgilerini düzenleyin
5. **Tema Değiştir**: Sağ üstteki tema butonu ile dark/light mode arasında geçiş yapın

## Güvenlik

- Sadece `is_super_admin=true` olan kullanıcılar uygulamaya erişebilir
- RLS (Row Level Security) politikaları aktif
- Service role key sadece server-side işlemlerde kullanılır
- Middleware ile her istekte authentication ve yetki kontrolü yapılır

## Lisans

Bu proje özel kullanım içindir.
