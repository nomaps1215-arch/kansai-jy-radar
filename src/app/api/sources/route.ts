export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SourceType } from "@prisma/client";
import { z } from "zod";

const sourceSchema = z.object({
  teamId: z.string().min(1),
  sourceType: z.nativeEnum(SourceType),
  url: z.string().url("正しいURLを入力してください"),
  crawlEnabled: z.boolean().default(true),
  crawlIntervalHours: z.number().int().min(1).max(168).default(6),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    const sources = await prisma.teamSource.findMany({
      where: teamId ? { teamId } : {},
      orderBy: { createdAt: "asc" },
      include: {
        team: { select: { id: true, name: true, prefecture: true } },
      },
    });

    return NextResponse.json(sources);
  } catch (error) {
    console.error("[GET /api/sources]", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = sourceSchema.parse(body);

    const source = await prisma.teamSource.create({ data });
    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    // unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { error: "このチームにはそのURLがすでに登録されています" },
        { status: 409 }
      );
    }
    console.error("[POST /api/sources]", error);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
