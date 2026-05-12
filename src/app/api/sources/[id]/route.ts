import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SourceType } from "@prisma/client";
import { z } from "zod";

const sourceUpdateSchema = z.object({
  sourceType: z.nativeEnum(SourceType).optional(),
  url: z.string().url().optional(),
  crawlEnabled: z.boolean().optional(),
  crawlIntervalHours: z.number().int().min(1).max(168).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = sourceUpdateSchema.parse(body);

    const source = await prisma.teamSource.update({ where: { id }, data });
    return NextResponse.json(source);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[PATCH /api/sources/:id]", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.teamSource.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/sources/:id]", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
