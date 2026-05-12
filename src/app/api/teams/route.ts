import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TeamCategory } from "@prisma/client";
import { z } from "zod";

const teamSchema = z.object({
  name: z.string().min(1, "チーム名は必須です"),
  nameKana: z.string().optional().nullable(),
  prefecture: z.string().min(1, "都道府県は必須です"),
  city: z.string().optional().nullable(),
  category: z.nativeEnum(TeamCategory).default("CLUB"),
  league: z.string().optional().nullable(),
  trainingArea: z.string().optional().nullable(),
  homeGround: z.string().optional().nullable(),
  officialSiteUrl: z.string().url().optional().nullable().or(z.literal("")),
  instagramUrl: z.string().url().optional().nullable().or(z.literal("")),
  xUrl: z.string().url().optional().nullable().or(z.literal("")),
  facebookUrl: z.string().url().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
  memo: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefecture = searchParams.get("prefecture");
    const category = searchParams.get("category") as TeamCategory | null;
    const q = searchParams.get("q");

    const teams = await prisma.team.findMany({
      where: {
        ...(prefecture ? { prefecture } : {}),
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { nameKana: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: [{ prefecture: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { sources: true, recruitments: true } },
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("[GET /api/teams]", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = teamSchema.parse(body);

    const team = await prisma.team.create({
      data: {
        name: data.name,
        nameKana: data.nameKana || null,
        prefecture: data.prefecture,
        city: data.city || null,
        category: data.category,
        league: data.league || null,
        trainingArea: data.trainingArea || null,
        homeGround: data.homeGround || null,
        officialSiteUrl: data.officialSiteUrl || null,
        instagramUrl: data.instagramUrl || null,
        xUrl: data.xUrl || null,
        facebookUrl: data.facebookUrl || null,
        isActive: data.isActive,
        memo: data.memo || null,
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[POST /api/teams]", error);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
