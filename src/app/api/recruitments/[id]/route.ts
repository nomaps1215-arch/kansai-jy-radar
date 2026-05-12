export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  RecruitmentType,
  RecruitmentStatus,
  ConfidenceLabel,
  SourceType,
} from "@prisma/client";
import { z } from "zod";

const recruitmentUpdateSchema = z.object({
  targetYear: z.number().int().optional(),
  targetGrade: z.string().optional().nullable(),
  title: z.string().min(1).optional(),
  recruitmentType: z.nativeEnum(RecruitmentType).optional(),
  status: z.nativeEnum(RecruitmentStatus).optional(),
  eventDate: z.string().optional().nullable(),
  eventStartTime: z.string().optional().nullable(),
  eventEndTime: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  applicationStartDate: z.string().optional().nullable(),
  applicationDeadline: z.string().optional().nullable(),
  applicationUrl: z.string().url().optional().nullable().or(z.literal("")),
  fee: z.string().optional().nullable(),
  capacity: z.string().optional().nullable(),
  targetPositions: z.string().optional().nullable(),
  isGkRecruiting: z.boolean().optional(),
  sourceUrl: z.string().url().optional().nullable().or(z.literal("")),
  sourceType: z.nativeEnum(SourceType).optional().nullable(),
  confidenceScore: z.number().min(0).max(1).optional(),
  confidenceLabel: z.nativeEnum(ConfidenceLabel).optional(),
  extractedText: z.string().optional().nullable(),
  adminNote: z.string().optional().nullable(),
  publishedAt: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recruitment = await prisma.recruitment.findUnique({
      where: { id },
      include: {
        team: true,
        adminReviews: { orderBy: { reviewedAt: "desc" } },
      },
    });

    if (!recruitment) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }

    return NextResponse.json(recruitment);
  } catch (error) {
    console.error("[GET /api/recruitments/:id]", error);
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
    const data = recruitmentUpdateSchema.parse(body);

    const recruitment = await prisma.recruitment.update({
      where: { id },
      data: {
        ...data,
        eventDate: data.eventDate !== undefined
          ? data.eventDate ? new Date(data.eventDate) : null
          : undefined,
        applicationStartDate: data.applicationStartDate !== undefined
          ? data.applicationStartDate ? new Date(data.applicationStartDate) : null
          : undefined,
        applicationDeadline: data.applicationDeadline !== undefined
          ? data.applicationDeadline ? new Date(data.applicationDeadline) : null
          : undefined,
        applicationUrl: data.applicationUrl || null,
        sourceUrl: data.sourceUrl || null,
        publishedAt: data.publishedAt !== undefined
          ? data.publishedAt ? new Date(data.publishedAt) : null
          : undefined,
      },
      include: { team: { select: { id: true, name: true } } },
    });

    return NextResponse.json(recruitment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[PATCH /api/recruitments/:id]", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.recruitment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/recruitments/:id]", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
