export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { runSourceCrawl, runGoogleDiscovery, runAiExtraction } from '@/lib/crawler/pipeline'
import { runDeadlineNotifications } from '@/lib/notifications/deadline'

// Vercel Cron: 毎日19:00 UTC (04:00 JST)
// vercel.json: { "path": "/api/cron/crawl", "schedule": "0 19 * * *" }
// Hobby プランの2枠目（1枠目: sync-teams）
export async function GET(req: Request) {
  // Cron Secret 認証（Vercel が Authorization ヘッダーをセットする）
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  const log: string[] = []

  try {
    // Phase A: 登録ソース巡回
    const crawlResult = await runSourceCrawl()
    log.push(`[A] crawl: processed=${crawlResult.processed} changed=${crawlResult.changed} errors=${crawlResult.errors}`)

    // Phase B: Google Search 新規URL発見
    const searchResult = await runGoogleDiscovery()
    log.push(`[B] google: teams=${searchResult.teamsSearched} newUrls=${searchResult.newUrls}`)

    // Phase C: AI抽出
    const extractResult = await runAiExtraction()
    log.push(`[C] ai: processed=${extractResult.processed} found=${extractResult.found}`)

    // Phase D: 締切通知（notify cronを統合）
    const notifyResult = await runDeadlineNotifications()
    log.push(`[D] notify: sent=${notifyResult.sent}`)

    const elapsed = Date.now() - start
    log.push(`[done] ${elapsed}ms`)

    console.log('[cron/crawl]', log.join(' | '))
    return NextResponse.json({ ok: true, log, elapsed })
  } catch (e) {
    console.error('[cron/crawl] error:', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

// 管理画面から手動実行（Supabase セッション認証）
export async function POST(req: Request) {
  const { createServerClient } = await import('@supabase/ssr')
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return GET(req)
}
