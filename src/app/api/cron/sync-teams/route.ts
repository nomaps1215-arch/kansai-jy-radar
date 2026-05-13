export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TeamCategory } from '@prisma/client'

// GitHub raw URL (mainブランチのCSV)
const CSV_URL =
  'https://raw.githubusercontent.com/nomaps1215-arch/kansai-jy-radar/main/sample/kansai_teams.csv'

const CATEGORY_MAP: Record<string, TeamCategory> = {
  'J下部': 'J_YOUTH',
  j_youth: 'J_YOUTH',
  J_YOUTH: 'J_YOUTH',
  街クラブ: 'CLUB',
  CLUB: 'CLUB',
  club: 'CLUB',
  スクール母体: 'SCHOOL',
  SCHOOL: 'SCHOOL',
  school: 'SCHOOL',
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

// Vercel Cron: 毎日03:00 JST (18:00 UTC)
// vercel.json: { "path": "/api/cron/sync-teams", "schedule": "0 18 * * *" }
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()

  try {
    // GitHub rawからCSV取得
    const res = await fetch(CSV_URL, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json(
        { error: `CSV fetch failed: ${res.status}` },
        { status: 502 }
      )
    }
    const text = await res.text()
    const rows = parseCSV(text)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSVが空です' }, { status: 400 })
    }

    // 全件削除してから再登録
    const { count: deleted } = await prisma.team.deleteMany({})

    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (const row of rows) {
      const name = row['name']?.trim()
      const prefecture = row['prefecture']?.trim()
      if (!name || !prefecture) { skipped++; continue }

      try {
        await prisma.team.create({
          data: {
            name,
            nameKana: row['name_kana'] || null,
            prefecture,
            city: row['city'] || null,
            category: CATEGORY_MAP[row['category'] ?? ''] ?? 'CLUB',
            league: row['league'] || null,
            trainingArea: row['training_area'] || null,
            homeGround: row['home_ground'] || null,
            officialSiteUrl: row['official_site_url'] || null,
            instagramUrl: row['instagram_url'] || null,
            xUrl: row['x_url'] || null,
            facebookUrl: row['facebook_url'] || null,
            memo: row['memo'] || null,
          },
        })
        created++
      } catch (err) {
        errors.push(`${name}: ${String(err)}`)
        skipped++
      }
    }

    const elapsed = Date.now() - start
    console.log(`[cron/sync-teams] deleted=${deleted} created=${created} skipped=${skipped} elapsed=${elapsed}ms`)

    return NextResponse.json({ ok: true, deleted, created, skipped, errors, elapsed })
  } catch (e) {
    console.error('[cron/sync-teams]', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

// 管理画面から手動実行も可能
export async function POST(req: Request) {
  return GET(req)
}
