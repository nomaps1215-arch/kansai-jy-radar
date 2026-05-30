/**
 * 収集パイプライン
 *
 * 1. Source crawl  — 登録済みURLを巡回、差分検知
 * 2. Google Search — チーム名でWeb横断検索（Instagram含む）
 * 3. AI Extraction — Claude で構造化データ抽出
 * 4. DB 保存       — Recruitment レコード生成
 */
import { prisma } from '@/lib/prisma'
import { fetchPage, containsRecruitmentKeyword } from './fetcher'
import { searchTeamRecruitment, classifySourceUrl } from './google-search'
import { extractRecruitmentInfo, quickCheck } from '@/lib/extractor/claude'
import { notifyNewRecruitment } from '@/lib/notifications/line'

const CRAWL_BATCH = 30  // 1回のcronで処理するソース数
const SEARCH_BATCH = 30 // 1回のcronで検索するチーム数（Google無料枠: 100/日、3クエリ×30=90）

// ── Phase A: 登録ソースURLの巡回 ──────────────────────────────────
export async function runSourceCrawl(): Promise<{ processed: number; changed: number; errors: number }> {
  const due = await prisma.teamSource.findMany({
    where: {
      crawlEnabled: true,
      OR: [
        { lastCheckedAt: null },
        {
          lastCheckedAt: {
            lt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6時間以上前
          },
        },
      ],
    },
    take: CRAWL_BATCH,
    orderBy: { lastCheckedAt: 'asc' },
    include: { team: { select: { id: true, name: true, prefecture: true } } },
  })

  let changed = 0
  let errors = 0

  for (const source of due) {
    const result = await fetchPage(source.url)
    const now = new Date()
    const status = result.error ? 'FAILED' : result.statusCode >= 400 ? 'FAILED' : 'SUCCESS'

    // クロールログ
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

    if (status === 'FAILED') {
      errors++
      await prisma.teamSource.update({
        where: { id: source.id },
        data: { lastCheckedAt: now, lastError: result.error ?? `HTTP ${result.statusCode}` },
      })
      continue
    }

    const hashChanged = source.lastHash !== result.hash
    await prisma.teamSource.update({
      where: { id: source.id },
      data: {
        lastCheckedAt: now,
        lastSuccessAt: now,
        lastHash: result.hash,
        lastError: null,
      },
    })

    if (!hashChanged) continue
    if (!containsRecruitmentKeyword(result.text)) continue

    changed++

    // 未処理ページとして保存 → AI抽出キュー
    await prisma.detectedPage.upsert({
      where: { url: source.url },
      create: {
        teamId: source.team.id,
        url: source.url,
        title: result.title,
        contentText: result.text,
        contentHash: result.hash,
        detectedKeywords: extractKeywords(result.text),
        sourceType: source.sourceType,
        isProcessed: false,
      },
      update: {
        title: result.title,
        contentText: result.text,
        contentHash: result.hash,
        detectedKeywords: extractKeywords(result.text),
        isProcessed: false,
        updatedAt: now,
      },
    })
  }

  return { processed: due.length, changed, errors }
}

// ── Phase B: Google Search 新規URL発見 ────────────────────────────
export async function runGoogleDiscovery(): Promise<{ teamsSearched: number; newUrls: number }> {
  const teams = await prisma.team.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: 'asc' },
    take: SEARCH_BATCH,
    select: { id: true, name: true, prefecture: true },
  })

  let newUrls = 0

  for (const team of teams) {
    const results = await searchTeamRecruitment(team.name, team.prefecture)

    for (const result of results) {
      // スキップ: ソーシャルメディアのトップページ / 既知のURL
      if (isGenericSocialUrl(result.url)) continue

      const existing = await prisma.teamSource.findFirst({
        where: { url: result.url },
      })
      if (existing) continue

      const { sourceType, confidence } = classifySourceUrl(result.url)

      // Google snippetに募集キーワードが含まれるか確認
      if (!containsRecruitmentKeyword(result.snippet + result.title)) continue

      // 新規ソースとして登録（巡回は次のPhaseAで）
      await prisma.teamSource.create({
        data: {
          teamId: team.id,
          sourceType: sourceType as any,
          url: result.url,
          crawlEnabled: true,
          crawlIntervalHours: 24,
        },
      })

      // snippetだけでも DetectedPage に保存してAI抽出させる
      await prisma.detectedPage.upsert({
        where: { url: result.url },
        create: {
          teamId: team.id,
          url: result.url,
          title: result.title,
          description: result.snippet,
          contentText: `${result.title}\n\n${result.snippet}`,
          contentHash: '',
          detectedKeywords: extractKeywords(result.snippet),
          sourceType: sourceType as any,
          isProcessed: false,
        },
        update: {},
      })

      newUrls++
    }

    // チームの updatedAt を更新して次回の検索優先度を下げる
    await prisma.team.update({
      where: { id: team.id },
      data: { updatedAt: new Date() },
    })
  }

  return { teamsSearched: teams.length, newUrls }
}

// ── Phase C: AI抽出 ───────────────────────────────────────────────
export async function runAiExtraction(): Promise<{ processed: number; found: number }> {
  const pages = await prisma.detectedPage.findMany({
    where: { isProcessed: false },
    take: 10, // Claude APIコスト制御
    include: { team: { select: { id: true, name: true, prefecture: true } } },
  })

  let found = 0

  for (const page of pages) {
    // チームが特定できない場合はスキップ
    if (!page.team) {
      await prisma.detectedPage.update({ where: { id: page.id }, data: { isProcessed: true } })
      continue
    }

    // Haiku で高速フィルタリング（コスト削減）
    const isRelevant = await quickCheck(page.contentText ?? '', page.team.name)
    if (!isRelevant) {
      await prisma.detectedPage.update({ where: { id: page.id }, data: { isProcessed: true } })
      continue
    }

    // Sonnet で詳細抽出
    const extracted = await extractRecruitmentInfo(
      page.contentText ?? '',
      page.url,
      page.team.name
    )

    await prisma.detectedPage.update({
      where: { id: page.id },
      data: {
        isProcessed: true,
        aiExtractedJson: extracted as any,
      },
    })

    if (!extracted.found) continue

    // 重複チェック（同URL・同チームのPENDING/CONFIRMED）
    const duplicate = await prisma.recruitment.findFirst({
      where: {
        teamId: page.teamId!,
        sourceUrl: page.url,
        status: { in: ['PENDING', 'CONFIRMED', 'DETECTED'] },
      },
    })
    if (duplicate) continue

    // 信頼度A/Bは自動公開、C/Dは管理者承認待ち
    const autoPublish = ['A', 'B'].includes(extracted.confidence ?? '')
    const now2 = new Date()

    // Recruitment レコード作成
    await prisma.recruitment.create({
      data: {
        teamId: page.teamId!,
        title: extracted.title ?? `${page.team.name} ジュニアユース募集情報`,
        recruitmentType: (extracted.recruitmentType ?? 'GENERAL') as any,
        status: autoPublish ? 'CONFIRMED' : 'DETECTED',
        publishedAt: autoPublish ? now2 : null,
        eventDate: extracted.eventDates?.[0] ? new Date(extracted.eventDates[0]) : null,
        venue: extracted.venue ?? null,
        address: extracted.address ?? null,
        applicationDeadline: extracted.applicationDeadline
          ? new Date(extracted.applicationDeadline)
          : null,
        applicationUrl: extracted.applicationUrl ?? null,
        fee: extracted.fee ?? null,
        capacity: extracted.capacity ?? null,
        targetPositions: extracted.targetPositions ?? null,
        isGkRecruiting: extracted.isGkRecruiting ?? false,
        sourceUrl: page.url,
        sourceType: page.sourceType,
        confidenceLabel: (extracted.confidence ?? 'D') as any,
        confidenceScore:
          extracted.confidence === 'A' ? 90 :
          extracted.confidence === 'B' ? 70 :
          extracted.confidence === 'C' ? 50 : 30,
        extractedText: page.contentText?.slice(0, 2000) ?? null,
      },
    })

    // 信頼度A/B → 自動公開済みなので即時LINE通知
    if (autoPublish) {
      await notifyNewRecruitment({
        teamName: page.team.name,
        prefecture: page.team.prefecture,
        recruitmentType: extracted.recruitmentType ?? 'GENERAL',
        title: extracted.title ?? '',
        eventDate: extracted.eventDates?.[0] ?? null,
        venue: extracted.venue ?? null,
        deadline: extracted.applicationDeadline ?? null,
        url: page.url,
        confidence: extracted.confidence ?? 'D',
      })

      // 通知ログ
      await prisma.notification.create({
        data: {
          notificationType: 'NEW_RECRUITMENT',
          title: `新着: ${page.team.name}`,
          message: extracted.title ?? '',
          targetUrl: page.url,
          status: 'SENT',
          sentAt: new Date(),
        },
      })
    }

    found++
  }

  return { processed: pages.length, found }
}

// ── ヘルパー ──────────────────────────────────────────────────────
function extractKeywords(text: string): string[] {
  const keywords = [
    'セレクション', '体験練習会', '体験会', '練習会', '入団', '募集',
    'セレクト', 'トライアウト', '説明会', '見学会',
  ]
  return keywords.filter((kw) => text.includes(kw))
}

function isGenericSocialUrl(url: string): boolean {
  const generic = [
    'instagram.com/p/', 'instagram.com/reel/',
    'twitter.com/hashtag', 'x.com/hashtag',
  ]
  // instagram.com/チームアカウント のプロフィールはOK
  // instagram.com/p/XXX の個別投稿もOK
  const host = (() => { try { return new URL(url).hostname } catch { return '' } })()
  if (!host.includes('instagram.com') && !host.includes('twitter.com') && !host.includes('x.com')) {
    return false
  }
  // プロフィールURL（/username のみ）はgenericとみなす
  const path = (() => { try { return new URL(url).pathname } catch { return '' } })()
  const segments = path.split('/').filter(Boolean)
  return segments.length <= 1
}
