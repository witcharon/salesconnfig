import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    // Users ve subscriptions bilgilerini join ile çek
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (usersError) {
      console.error("Users error:", usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Subscriptions bilgilerini çek
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("user_subscriptions")
      .select("*")

    if (subscriptionsError) {
      console.error("Subscriptions error:", subscriptionsError)
      return NextResponse.json(
        { error: subscriptionsError.message },
        { status: 500 }
      )
    }

    // Users ve subscriptions'ı birleştir
    const usersWithSubscriptions = users.map((user) => {
      const subscription = subscriptions?.find(
        (sub) => sub.auth_id === user.id
      ) || null
      return {
        ...user,
        subscription,
      }
    })

    return NextResponse.json({ data: usersWithSubscriptions })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

