export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { AgeGroup } from "@prisma/client"
import { CURRENT_SEASON } from "@/lib/leagues"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const standings = await prisma.leagueStanding.findMany({
    where: { teamId: id },
    orderBy: [{ season: "desc" }, { ageGroup: "asc" }],
  })
  return NextResponse.json(standings)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  const {
    season = CURRENT_SEASON,
    ageGroup = "U13" as AgeGroup,
    leagueName,
    rank,
    played = 0,
    wins = 0,
    draws = 0,
    losses = 0,
    goalsFor = 0,
    goalsAgainst = 0,
    points = 0,
  } = body

  if (!leagueName) {
    return NextResponse.json({ error: "leagueName is required" }, { status: 400 })
  }

  const team = await prisma.team.findUnique({ where: { id } })
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 })

  const standing = await prisma.leagueStanding.upsert({
    where: { teamId_season_ageGroup: { teamId: id, season, ageGroup } },
    update: { leagueName, rank, played, wins, draws, losses, goalsFor, goalsAgainst, points },
    create: { teamId: id, season, ageGroup, leagueName, rank, played, wins, draws, losses, goalsFor, goalsAgainst, points },
  })

  return NextResponse.json(standing)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const season = searchParams.get("season") ?? CURRENT_SEASON
  const ageGroup = (searchParams.get("ageGroup") ?? "U13") as AgeGroup

  await prisma.leagueStanding.deleteMany({
    where: { teamId: id, season, ageGroup },
  })

  return NextResponse.json({ ok: true })
}
