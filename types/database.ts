export type User = {
  id: string
  email: string
  phone: string | null
  created_at: string
  updated_at: string | null
  last_sign_in_at: string | null
  is_super_admin: boolean
}

export type UserSubscription = {
  id: string
  auth_id: string
  plan_id: "free" | "pro" | "team"
  status: "active" | "deactive"
  current_period_end: string | null
  language: "tr" | "en"
  logo: string | null
  is_crm: boolean
  is_campaign: boolean
}

export type UserWithSubscription = User & {
  subscription: UserSubscription | null
}

