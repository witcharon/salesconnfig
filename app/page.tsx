import { createServiceRoleClient } from "@/lib/supabase/server"
import { UsersTable } from "@/components/users-table"
import { Header } from "@/components/header"
import type { UserWithSubscription } from "@/types/database"

// Cache'i devre dışı bırak - veriler her zaman fresh olsun
export const dynamic = "force-dynamic"
export const revalidate = 0

async function getUsers(): Promise<UserWithSubscription[]> {
  // Middleware zaten is_super_admin kontrolünü yapıyor, burada tekrar kontrol etmeye gerek yok
  // Service role client ile direkt kullanıcıları çek
  const serviceSupabase = createServiceRoleClient()

  const { data: users, error: usersError } = await serviceSupabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  if (usersError || !users) {
    return []
  }

  // Subscriptions bilgilerini çek
  const { data: subscriptions, error: subscriptionsError } = await serviceSupabase
    .from("user_subscriptions")
    .select("*")

  if (subscriptionsError) {
    console.error("Subscriptions fetch error:", subscriptionsError)
    // Hata durumunda boş array döndür, uygulama çalışmaya devam etsin
  }

  // Lead gen user data bilgilerini çek
  const { data: leadGenData, error: leadGenError } = await serviceSupabase
    .from("lead_gen_user_data")
    .select("*")

  if (leadGenError) {
    console.error("Lead gen data fetch error:", leadGenError)
    // Hata durumunda boş array döndür, uygulama çalışmaya devam etsin
  }

  // Users, subscriptions ve lead gen data'yı birleştir
  const usersWithSubscriptions: UserWithSubscription[] = users.map((user) => {
    const subscription = subscriptions?.find(
      (sub) => sub.user_id === user.id
    ) || null
    
    const leadGen = leadGenData?.find(
      (lg) => lg.id === user.id
    ) || null
    
    return {
      ...user,
      subscription,
      leadGenData: leadGen,
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
