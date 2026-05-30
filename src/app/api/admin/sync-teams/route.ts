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
    let skipped = 0

    // 有効な行のみ抽出
    const validRows = rows.filter(row => {
      const name = row['name']?.trim()
      const prefecture = row['prefecture']?.trim()
      if (!name || !prefecture) { skipped++; return false }
      return true
    })

    // 全チームを一括登録
    await prisma.team.createMany({
      data: validRows.map(row => ({
        name: row['name'].trim(),
        nameKana: row['name_kana'] || null,
        prefecture: row['prefecture'].trim(),
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
      })),
      skipDuplicates: true,
    })

    const created = validRows.length - skipped

    // 登録したチームのIDを取得
    const teams = await prisma.team.findMany({
      select: { id: true, name: true, officialSiteUrl: true, instagramUrl: true, xUrl: true, facebookUrl: true },
    })

    // チーム名→IDのマップ
    const teamMap = new Map(teams.map(t => [t.name, t]))

    // ソースを一括登録
    const sourcesToCreate: { teamId: string; sourceType: string; url: string; crawlEnabled: boolean; crawlIntervalHours: number }[] = []
    for (const row of validRows) {
      const team = teamMap.get(row['name'].trim())
      if (!team) continue
      if (row['official_site_url']) sourcesToCreate.push({ teamId: team.id, sourceType: 'OFFICIAL_SITE', url: row['official_site_url'], crawlEnabled: true, crawlIntervalHours: 24 })
      if (row['instagram_url'])     sourcesToCreate.push({ teamId: team.id, sourceType: 'INSTAGRAM',     url: row['instagram_url'],     crawlEnabled: true, crawlIntervalHours: 24 })
      if (row['x_url'])             sourcesToCreate.push({ teamId: team.id, sourceType: 'X',             url: row['x_url'],             crawlEnabled: true, crawlIntervalHours: 24 })
      if (row['facebook_url'])      sourcesToCreate.push({ teamId: team.id, sourceType: 'FACEBOOK',      url: row['facebook_url'],      crawlEnabled: true, crawlIntervalHours: 24 })
    }

    const { count: sourcesCreated } = await prisma.teamSource.createMany({
      data: sourcesToCreate as any,
      skipDuplicates: true,
    })

    return NextResponse.json({ ok: true, deleted, created, skipped, sourcesCreated, errors: [], elapsed: Date.now() - start })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
