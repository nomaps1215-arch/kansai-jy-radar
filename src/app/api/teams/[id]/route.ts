import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TeamCategory } from "@prisma/client";
import { z } from "zod";

const teamUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  nameKana: z.string().optional().nullable(),
  prefecture: z.string().min(1).optional(),
  city: z.string().optional().nullable(),
  category: z.nativeEnum(TeamCategory).optional(),
  league: z.string().optional().nullable(),
  trainingArea: z.string().optional().nullable(),
  homeGround: z.string().optional().nullable(),
  monthlyFee: z.string().optional().nullable(),
  practiceDays: z.string().optional().nullable(),
  officialSiteUrl: z.string().url().optional().nullable().or(z.literal("")),
  instagramUrl: z.string().url().optional().nullable().or(z.literal("")),
  xUrl: z.string().url().optional().nullable().or(z.literal("")),
  facebookUrl: z.string().url().optional().nullable().or(z.literal("")),
  isActive: z.boolean().optional(),
  memo: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        sources: { orderBy: { createdAt: "asc" } },
        recruitments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "チームが見つかりません" }, { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error("[GET /api/teams/:id]", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = teamUpdateSchema.parse(body);

    const team = await prisma.team.update({
      where: { id },
      data: {
        ...data,
        officialSiteUrl: data.officialSiteUrl || null,
        instagramUrl: data.instagramUrl || null,
        xUrl: data.xUrl || null,
        facebookUrl: data.facebookUrl || null,
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[PATCH /api/teams/:id]", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.team.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/teams/:id]", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
