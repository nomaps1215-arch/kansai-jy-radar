import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  RecruitmentType,
  RecruitmentStatus,
  ConfidenceLabel,
  SourceType,
} from "@prisma/client";
import { z } from "zod";

const recruitmentSchema = z.object({
  teamId: z.string().min(1),
  targetYear: z.number().int().default(2027),
  targetGrade: z.string().optional().nullable(),
  title: z.string().min(1, "タイトルは必須です"),
  recruitmentType: z.nativeEnum(RecruitmentType),
  status: z.nativeEnum(RecruitmentStatus).default("DETECTED"),
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
  isGkRecruiting: z.boolean().default(false),
  sourceUrl: z.string().url().optional().nullable().or(z.literal("")),
  sourceType: z.nativeEnum(SourceType).optional().nullable(),
  confidenceScore: z.number().min(0).max(1).default(0),
  confidenceLabel: z.nativeEnum(ConfidenceLabel).default("D"),
  extractedText: z.string().optional().nullable(),
  adminNote: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as RecruitmentStatus | null;
    const prefecture = searchParams.get("prefecture");
    const type = searchParams.get("type") as RecruitmentType | null;
    const teamId = searchParams.get("teamId");
    const filter = searchParams.get("filter");
    const confidence = searchParams.get("confidence") as ConfidenceLabel | null;

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const recruitments = await prisma.recruitment.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(type ? { recruitmentType: type } : {}),
        ...(teamId ? { teamId } : {}),
        ...(confidence ? { confidenceLabel: confidence } : {}),
        ...(filter === "deadline_soon"
          ? {
              status: "CONFIRMED",
              applicationDeadline: { gte: now, lte: sevenDaysLater },
            }
          : {}),
        ...(prefecture
          ? { team: { prefecture } }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      include: {
        team: { select: { id: true, name: true, prefecture: true } },
      },
    });

    return NextResponse.json(recruitments);
  } catch (error) {
    console.error("[GET /api/recruitments]", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = recruitmentSchema.parse(body);

    const recruitment = await prisma.recruitment.create({
      data: {
        teamId: data.teamId,
        targetYear: data.targetYear,
        targetGrade: data.targetGrade || null,
        title: data.title,
        recruitmentType: data.recruitmentType,
        status: data.status,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        eventStartTime: data.eventStartTime || null,
        eventEndTime: data.eventEndTime || null,
        venue: data.venue || null,
        address: data.address || null,
        applicationStartDate: data.applicationStartDate
          ? new Date(data.applicationStartDate)
          : null,
        applicationDeadline: data.applicationDeadline
          ? new Date(data.applicationDeadline)
          : null,
        applicationUrl: data.applicationUrl || null,
        fee: data.fee || null,
        capacity: data.capacity || null,
        targetPositions: data.targetPositions || null,
        isGkRecruiting: data.isGkRecruiting,
        sourceUrl: data.sourceUrl || null,
        sourceType: data.sourceType || null,
        confidenceScore: data.confidenceScore,
        confidenceLabel: data.confidenceLabel,
        extractedText: data.extractedText || null,
        adminNote: data.adminNote || null,
      },
      include: {
        team: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(recruitment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[POST /api/recruitments]", error);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
