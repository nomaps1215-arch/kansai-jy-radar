import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runSourceCrawl, runGoogleDiscovery, runAiExtraction } from '@/lib/crawler/pipeline'
import { fetchPage, containsRecruitmentKeyword } from '@/lib/crawler/fetcher'
import { extractRecruitmentInfo } from '@/lib/extractor/claude'
import { prisma } from '@/lib/prisma'
import * as crypto from 'crypto'

// 管理画面からの手動クロールトリガー
// body: { mode: 'all' | 'source' | 'search' | 'url', sourceId?: string, url?: string, teamId?: string }
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { mode = 'all', sourceId, url, teamId } = body

  try {
    // 単一URL を即時スキャン
    if (mode === 'url' && url) {
      const result = await fetchPage(url)
      if (result.error) return NextResponse.json({ ok: false, error: result.error })

      const hasKeyword = containsRecruitmentKeyword(result.text)
      let extracted = null

      if (hasKeyword && teamId) {
        const team = await prisma.team.findUnique({ where: { id: teamId } })
        if (team) {
          extracted = await extractRecruitmentInfo(result.text, url, team.name)
          const hash = crypto.createHash('sha256').update(result.text.slice(0, 20000)).digest('hex')
          await prisma.detectedPage.upsert({
            where: { url },
            create: {
              teamId,
              url,
              title: result.title,
              contentText: result.text,
              contentHash: hash,
              detectedKeywords: [],
              sourceType: 'OFFICIAL_SITE',
              isProcessed: true,
              aiExtractedJson: extracted as any,
            },
            update: {
              contentText: result.text,
              contentHash: hash,
              isProcessed: true,
              aiExtractedJson: extracted as any,
            },
          })
        }
      }

      return NextResponse.json({
        ok: true,
        title: result.title,
        hasKeyword,
        extracted,
        statusCode: result.statusCode,
      })
    }

    // 単一ソースをスキャン
    if (mode === 'source' && sourceId) {
      const source = await prisma.teamSource.findUnique({
        where: { id: sourceId },
        include: { team: true },
      })
      if (!source) return NextResponse.json({ ok: false, error: 'Source not found' })

      const result = await fetchPage(source.url)
      const now = new Date()
      const status = result.error ? 'FAILED' : 'SUCCESS'

      await prisma.crawlLog.create({
        data: {
          sourceId: source.id,
          status,
          httpStatus: result.statusCode || null,
          errorMessage: result.error ?? null,
          checkedAt: now,
          durationMs: result.durationMs,
        },
      })

      await prisma.teamSource.update({
        where: { id: source.id },
        data: {
          lastCheckedAt: now,
          lastSuccessAt: status === 'SUCCESS' ? now : undefined,
          lastHash: result.hash || undefined,
          lastError: result.error ?? null,
        },
      })

      return NextResponse.json({ ok: true, status, title: result.title, hasKeyword: containsRecruitmentKeyword(result.text) })
    }

    // フルパイプライン実行
    const crawl = await runSourceCrawl()
    const search = await runGoogleDiscovery()
    const extract = await runAiExtraction()

    return NextResponse.json({ ok: true, crawl, search, extract })
  } catch (e) {
    console.error('[crawl/run]', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
