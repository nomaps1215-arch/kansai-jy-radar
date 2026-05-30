export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TeamCategory } from '@prisma/client'

const CSV_URL =
  'https://raw.githubusercontent.com/nomaps1215-arch/kansai-jy-radar/main/sample/kansai_teams.csv'

const CATEGORY_MAP: Record<string, TeamCategory> = {
  'J下部': 'J_YOUTH', j_youth: 'J_YOUTH', J_YOUTH: 'J_YOUTH',
  街クラブ: 'CLUB', CLUB: 'CLUB', club: 'CLUB',
  スクール母体: 'SCHOOL', SCHOOL: 'SCHOOL', school: 'SCHOOL',
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

export async function POST() {
  // 認証はミドルウェア（/api/admin/*）で保護済み
  const start = Date.now()

  try {
    const res = await fetch(CSV_URL, { cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: `CSV fetch failed: ${res.status}` }, { status: 502 })

    const rows = parseCSV(await res.text())
    if (rows.length === 0) return NextResponse.json({ error: 'CSVが空です' }, { status: 400 })

    const { count: deleted } = await prisma.team.deleteMany({})
    let created = 0, skipped = 0, sourcesCreated = 0
    const errors: string[] = []

    for (const row of rows) {
      const name = row['name']?.trim()
      const prefecture = row['prefecture']?.trim()
      if (!name || !prefecture) { skipped++; continue }

      try {
        const team = await prisma.team.create({
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

        const urlSources: { url: string; sourceType: string }[] = []
        if (row['official_site_url']) urlSources.push({ url: row['official_site_url'], sourceType: 'OFFICIAL_SITE' })
        if (row['instagram_url'])     urlSources.push({ url: row['instagram_url'],     sourceType: 'INSTAGRAM' })
        if (row['x_url'])             urlSources.push({ url: row['x_url'],             sourceType: 'X' })
        if (row['facebook_url'])      urlSources.push({ url: row['facebook_url'],      sourceType: 'FACEBOOK' })

        for (const s of urlSources) {
          await prisma.teamSource.create({
            data: { teamId: team.id, sourceType: s.sourceType as any, url: s.url, crawlEnabled: true, crawlIntervalHours: 24 },
          }).catch(() => {})
          sourcesCreated++
        }
      } catch (err) {
        errors.push(`${name}: ${String(err)}`); skipped++
      }
    }

    return NextResponse.json({ ok: true, deleted, created, skipped, sourcesCreated, errors, elapsed: Date.now() - start })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
