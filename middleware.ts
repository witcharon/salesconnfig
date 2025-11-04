import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Login sayfası için kontrol
  if (request.nextUrl.pathname === '/login') {
    if (user) {
      // Kullanıcı giriş yapmışsa is_super_admin kontrolü yap
      try {
        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        )

        const { data: userData, error } = await serviceSupabase
          .from('users')
          .select('is_super_admin')
          .eq('id', user.id)
          .single()

        // Super admin ise anasayfaya yönlendir
        if (!error && userData?.is_super_admin) {
          return NextResponse.redirect(new URL('/', request.url))
        }
        // Super admin değilse login sayfasında kal (signOut yapılacak)
      } catch (err) {
        console.error('Login page middleware error:', err)
        // Hata durumunda login sayfasında kal
      }
    }
    return supabaseResponse
  }

  // Diğer sayfalar için authentication kontrolü
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // is_super_admin kontrolü - Service role kullanarak RLS bypass
  // Middleware'de service role kullanmak güvenli çünkü sadece kontrol için kullanılıyor
  try {
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: userData, error } = await serviceSupabase
      .from('users')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    // Hata durumunda veya super admin değilse login sayfasına yönlendir
    if (error) {
      console.error('Middleware user check error:', error)
      // Login'e yönlendir (login sayfasında signOut yapılacak)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (!userData?.is_super_admin) {
      // Super admin değilse login'e yönlendir (login sayfasında signOut yapılacak)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } catch (err) {
    console.error('Middleware error:', err)
    // Hata durumunda login'e yönlendir
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

