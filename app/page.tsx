import { createServerComponentClient, createServiceRoleClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UsersTable } from "@/components/users-table"
import { Header } from "@/components/header"
import type { UserWithSubscription } from "@/types/database"

async function getUsers(): Promise<UserWithSubscription[]> {
  const supabase = await createServerComponentClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // is_super_admin kontrolü
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("is_super_admin")
    .eq("id", user.id)
    .single()

  if (userError || !userData?.is_super_admin) {
    redirect("/login")
  }

  // Service role client ile kullanıcıları çek
  const serviceSupabase = createServiceRoleClient()

  const { data: users, error: usersError } = await serviceSupabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  if (usersError || !users) {
    return []
  }

  // Subscriptions bilgilerini çek
  const { data: subscriptions } = await serviceSupabase
    .from("user_subscriptions")
    .select("*")

  // Users ve subscriptions'ı birleştir
  const usersWithSubscriptions: UserWithSubscription[] = users.map((user) => {
    const subscription = subscriptions?.find(
      (sub) => sub.auth_id === user.id
    ) || null
    return {
      ...user,
      subscription,
    }
  })

  return usersWithSubscriptions
}

export default async function HomePage() {
  const users = await getUsers()

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Kullanıcılar</h2>
          <p className="text-muted-foreground">
            Tüm kullanıcıları ve abonelik bilgilerini görüntüleyin ve yönetin.
          </p>
        </div>
        <UsersTable data={users} />
      </main>
    </div>
  )
}
