/**
 * Migration Script
 * 
 * Bu script Supabase migration'ını çalıştırmak için kullanılır.
 * 
 * Kullanım:
 * 1. Supabase Dashboard'a gidin
 * 2. SQL Editor'ı açın
 * 3. supabase-migration.sql dosyasının içeriğini kopyalayın
 * 4. SQL Editor'a yapıştırın ve çalıştırın
 * 
 * Veya bu script'i çalıştırabilirsiniz (geliştirme ortamında):
 * npx tsx scripts/run-migration.ts
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { join } from "path"

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Environment variables eksik!")
    console.error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ayarlanmalı")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Migration SQL dosyasını oku
  const migrationPath = join(process.cwd(), "supabase-migration.sql")
  const migrationSQL = readFileSync(migrationPath, "utf-8")

  console.log("📄 Migration SQL dosyası okundu")
  console.log("⚠️  Supabase client ile direkt SQL çalıştıramayız")
  console.log("📋 Lütfen aşağıdaki adımları izleyin:\n")
  console.log("1. Supabase Dashboard'a gidin: https://supabase.com/dashboard")
  console.log("2. Projenizi seçin")
  console.log("3. Sol menüden 'SQL Editor'ı açın")
  console.log("4. Aşağıdaki SQL'i kopyalayıp SQL Editor'a yapıştırın")
  console.log("5. 'Run' butonuna tıklayın\n")
  console.log("=".repeat(80))
  console.log(migrationSQL)
  console.log("=".repeat(80))

  // Mevcut auth.users kayıtlarını kontrol et
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error("❌ Auth users kontrolü başarısız:", authError.message)
  } else {
    console.log(`\n✅ Auth.users tablosunda ${authUsers.users.length} kullanıcı bulundu`)
    
    if (authUsers.users.length > 0) {
      console.log("\n📋 Mevcut kullanıcılar:")
      authUsers.users.forEach((user) => {
        console.log(`  - ${user.email} (${user.id})`)
      })
    }
  }

  // public.users tablosunu kontrol et
  const { data: publicUsers, error: publicError } = await supabase
    .from("users")
    .select("id, email, is_super_admin")

  if (publicError) {
    if (publicError.code === "PGRST116") {
      console.log("\n⚠️  public.users tablosu henüz oluşturulmamış")
      console.log("✅ Migration'ı çalıştırdıktan sonra tekrar kontrol edin")
    } else {
      console.error("❌ public.users kontrolü başarısız:", publicError.message)
    }
  } else {
    console.log(`\n✅ public.users tablosunda ${publicUsers?.length || 0} kayıt var`)
    
    if (publicUsers && publicUsers.length > 0) {
      console.log("\n📋 Mevcut kayıtlar:")
      publicUsers.forEach((user) => {
        console.log(
          `  - ${user.email} (${user.id}) - Super Admin: ${user.is_super_admin ? "Evet" : "Hayır"}`
        )
      })
    }
  }

  console.log("\n✨ Migration tamamlandıktan sonra:")
  console.log("   1. public.users tablosunda auth.users'daki tüm kullanıcılar görünmeli")
  console.log("   2. İlk super admin kullanıcısını şu SQL ile oluşturun:")
  console.log("      UPDATE public.users SET is_super_admin = TRUE WHERE email = 'your-email@example.com';")
}

runMigration().catch(console.error)

