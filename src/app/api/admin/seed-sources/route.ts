/**
 * 全チーム一括ソース探索 API
 *
 * Google Custom Search で全チームを巡回し、
 * 募集関連URLを TeamSource に登録する。
 * 管理画面の「全チーム一括探索」ボタンから呼び出す。
 *
 * 1回の実行で最大 BATCH_SIZE チームを処理（クォータ制限のため）
 * offset パラメータでページング可能
 */
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchTeamRecruitment, classifySourceUrl } from '@/lib/crawler/google-search'
import { containsRecruitmentKeyword } from '@/lib/crawler/fetcher'

const BATCH_SIZE = 30 // Google無料枠 100/日、3クエリ×30=90

function isGenericSocialUrl(url: string): boolean {
  const host = (() => { try { return new URL(url).hostname } catch { return '' } })()
  if (!host.includes('instagram.com') && !host.includes('twitter.com') && !host.includes('x.com')) {
    return false
  }
  const path = (() => { try { return new URL(url).pathname } catch { return '' } })()
  const segments = path.split('/').filter(Boolean)
  return segments.length <= 1
}

export async function POST(req: Request) {
  // 認証はミドルウェアで処理済み
  const body = await req.json().catch(() => ({}))
  const offset = Number(body.offset ?? 0)

  const start = Date.now()

  const teams = await prisma.team.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    skip: offset,
    take: BATCH_SIZE,
    select: { id: true, name: true, prefecture: true },
  })

  if (teams.length === 0) {
    return NextResponse.json({ ok: true, message: '全チーム処理済み', newSources: 0, newPages: 0 })
  }

  let newSources = 0
  let newPages = 0
  const errors: string[] = []

  for (const team of teams) {
    try {
      const results = await searchTeamRecruitment(team.name, team.prefecture)

      for (const result of results) {
        if (isGenericSocialUrl(result.url)) continue
        if (!containsRecruitmentKeyword(result.snippet + result.title)) continue

        const existing = await prisma.teamSource.findFirst({ where: { url: result.url } })

        if (!existing) {
          const { sourceType } = classifySourceUrl(result.url)
          await prisma.teamSource.create({
            data: {
              teamId: team.id,
              sourceType: sourceType as any,
              url: result.url,
              crawlEnabled: true,
              crawlIntervalHours: 24,
            },
          }).catch(() => {})
          newSources++
        }

        // DetectedPage にも保存
        const existingPage = await prisma.detectedPage.findUnique({ where: { url: result.url } })
        if (!existingPage) {
          const { sourceType } = classifySourceUrl(result.url)
          await prisma.detectedPage.create({
            data: {
              teamId: team.id,
              url: result.url,
              title: result.title,
              description: result.snippet,
              contentText: `${result.title}\n\n${result.snippet}`,
              contentHash: '',
              detectedKeywords: extractKeywords(result.snippet + result.title),
              sourceType: sourceType as any,
              isProcessed: false,
            },
          }).catch(() => {})
          newPages++
        }
      }
    } catch (e) {
      errors.push(`${team.name}: ${String(e)}`)
    }
  }

  const totalTeams = await prisma.team.count({ where: { isActive: true } })
  const elapsed = Date.now() - start

  return NextResponse.json({
    ok: true,
    offset,
    processedTeams: teams.length,
    totalTeams,
    hasMore: offset + BATCH_SIZE < totalTeams,
    nextOffset: offset + BATCH_SIZE,
    newSources,
    newPages,
    errors,
    elapsed,
  })
}

function extractKeywords(text: string): string[] {
  const keywords = [
    'セレクション', '体験練習会', '体験会', '練習会', '入団', '募集',
    'セレクト', 'トライアウト', '説明会', '見学会',
  ]
  return keywords.filter((kw) => text.includes(kw))
}
