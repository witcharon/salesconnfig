import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre gereklidir" },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Kullanıcı oluştur (email_confirmed: true ile)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Kullanıcı oluşturulamadı" },
        { status: 500 }
      )
    }

    // user_subscriptions tablosuna varsayılan kayıt ekle
    const { error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: authData.user.id,
        plan_id: "free",
        status: "active",
        language: "tr",
        is_crm: false,
        is_campaign: false,
      })

    if (subscriptionError) {
      console.error("Subscription error:", subscriptionError)
      // Kullanıcı oluşturuldu ama subscription eklenemedi, yine de başarılı döndür
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

