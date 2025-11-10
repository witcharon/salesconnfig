export type User = {
  id: string
  email: string
  phone: string | null
  created_at: string
  updated_at: string | null
  last_sign_in_at: string | null
  is_super_admin: boolean
  note: string | null
  company_name: string | null
}

export type UserSubscription = {
  id: string
  user_id: string
  plan_id: "free" | "pro" | "team"
  status: "active" | "deactive"
  current_period_end: string | null
  language: "tr" | "en"
  logo: string | null
  is_crm: boolean
  is_campaign: boolean
}

export type LeadGenUserData = {
  id: string // user uuid
  created_at: string | null
  update_at: string | null
  lead_gen_count: number | null
  is_scraping: boolean | null
}

export type UserWithSubscription = User & {
  subscription: UserSubscription | null
  leadGenData: LeadGenUserData | null
}

