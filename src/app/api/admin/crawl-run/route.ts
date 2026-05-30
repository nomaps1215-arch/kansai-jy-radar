export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { runSourceCrawl, runGoogleDiscovery, runAiExtraction } from '@/lib/crawler/pipeline'
import { runDeadlineNotifications } from '@/lib/notifications/deadline'

export async function POST() {
  // 認証はミドルウェア（/api/admin/*）で保護済み
  const start = Date.now()
  const log: string[] = []

  try {
    const crawlResult = await runSourceCrawl()
    log.push(`[A] crawl: processed=${crawlResult.processed} changed=${crawlResult.changed} errors=${crawlResult.errors}`)

    const searchResult = await runGoogleDiscovery()
    log.push(`[B] google: teams=${searchResult.teamsSearched} newUrls=${searchResult.newUrls}`)

    const extractResult = await runAiExtraction()
    log.push(`[C] ai: processed=${extractResult.processed} found=${extractResult.found}`)

    const notifyResult = await runDeadlineNotifications()
    log.push(`[D] notify: sent=${notifyResult.sent}`)

    return NextResponse.json({ ok: true, log, elapsed: Date.now() - start })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
