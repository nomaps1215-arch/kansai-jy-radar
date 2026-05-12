import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchPage } from "@/lib/crawler/fetcher"
import { extractTeamInfo } from "@/lib/extractor/claude"

// チームの公式サイト・SNSから月謝・練習曜日を自動取得
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const team = await prisma.team.findUnique({
    where: { id },
    select: {
      name: true,
      officialSiteUrl: true,
      instagramUrl: true,
      xUrl: true,
    },
  })

  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 })

  // 取得対象URL（公式サイト優先、次いでInstagram・X）
  const urls: string[] = []
  if (team.officialSiteUrl) urls.push(team.officialSiteUrl)
  if (team.instagramUrl) urls.push(team.instagramUrl)
  if (team.xUrl) urls.push(team.xUrl)

  if (urls.length === 0) {
    return NextResponse.json({ error: "取得できるURLが登録されていません" }, { status: 400 })
  }

  let monthlyFee: string | null = null
  let practiceDays: string | null = null

  for (const url of urls) {
    const page = await fetchPage(url)
    if (!page.text || page.error) continue

    const info = await extractTeamInfo(page.text, url, team.name)

    if (!monthlyFee && info.monthlyFee) monthlyFee = info.monthlyFee
    if (!practiceDays && info.practiceDays) practiceDays = info.practiceDays

    // 両方取得できたら終了
    if (monthlyFee && practiceDays) break
  }

  // 取得できたフィールドのみ更新
  const updateData: Record<string, string | null> = {}
  if (monthlyFee !== null) updateData.monthlyFee = monthlyFee
  if (practiceDays !== null) updateData.practiceDays = practiceDays

  if (Object.keys(updateData).length > 0) {
    await prisma.team.update({ where: { id }, data: updateData })
  }

  return NextResponse.json({
    monthlyFee,
    practiceDays,
    scannedUrls: urls.length,
    updated: Object.keys(updateData).length > 0,
  })
}
