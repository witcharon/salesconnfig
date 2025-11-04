import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { readFile } from "fs/promises"
import { join } from "path"

export async function POST(request: Request) {
  try {
    // Güvenlik: Sadece belirli bir secret key ile çalışmalı
    const { secret } = await request.json()
    
    // Vercel'de migration secret'ı environment variable'dan al
    const migrationSecret = process.env.MIGRATION_SECRET || "dev-secret-key-change-in-production"
    
    if (secret !== migrationSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    // Migration SQL dosyasını oku
    const migrationPath = join(process.cwd(), "supabase-migration.sql")
    const migrationSQL = await readFile(migrationPath, "utf-8")

    // SQL'i satırlara ayır ve çalıştır
    // Not: Supabase'de tek bir query olarak çalıştırmak daha güvenli
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    // Eğer exec_sql function yoksa, direkt SQL çalıştırmayı dene
    if (error) {
      // Alternatif: Her SQL statement'ı ayrı ayrı çalıştır
      const statements = migrationSQL
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"))

      const errors: string[] = []

      for (const statement of statements) {
        try {
          // Supabase client ile direkt SQL çalıştıramayız, bu yüzden
          // Migration'ı manuel olarak Supabase SQL Editor'da çalıştırmak daha iyi
          // Bu endpoint sadece bilgilendirme amaçlı
        } catch (err) {
          errors.push(`Error executing statement: ${err}`)
        }
      }

      if (errors.length > 0) {
        return NextResponse.json(
          {
            error: "Migration failed",
            details: errors,
            message:
              "Migration'ı Supabase SQL Editor'da manuel olarak çalıştırmanız gerekiyor. supabase-migration.sql dosyasını kullanın.",
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Migration SQL'i Supabase SQL Editor'da çalıştırmanız gerekiyor. supabase-migration.sql dosyasını kullanın.",
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        error: "Migration failed",
        message:
          "Migration'ı Supabase SQL Editor'da manuel olarak çalıştırmanız gerekiyor. supabase-migration.sql dosyasını kullanın.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

