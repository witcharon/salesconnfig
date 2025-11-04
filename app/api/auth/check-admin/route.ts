import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { createServerComponentClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerComponentClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", is_super_admin: false },
        { status: 401 }
      )
    }

    // Service role ile RLS bypass ederek kontrol yap
    const serviceSupabase = createServiceRoleClient()
    
    const { data: userData, error: userError } = await serviceSupabase
      .from("users")
      .select("is_super_admin")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("User check error:", userError)
      return NextResponse.json(
        { error: "User check failed", is_super_admin: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      is_super_admin: userData?.is_super_admin || false,
    })
  } catch (error) {
    console.error("Check admin error:", error)
    return NextResponse.json(
      { error: "Internal server error", is_super_admin: false },
      { status: 500 }
    )
  }
}

