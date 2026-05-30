import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /api/admin 以下は認証必須（API は 401 を返す）
  if (
    request.nextUrl.pathname.startsWith("/api/admin") &&
    !user
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // /api/cron の POST は管理者セッション必須（GET は Vercel cron が CRON_SECRET で認証）
  if (
    request.nextUrl.pathname.startsWith("/api/cron") &&
    request.method === "POST" &&
    !user
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // /admin 以下は認証必須（/admin/login は除く）
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin/login") &&
    !user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // ログイン済みでログインページにアクセスしたらダッシュボードへ
  if (request.nextUrl.pathname === "/admin/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/cron/:path*"],
};
