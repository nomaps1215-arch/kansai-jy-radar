import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecruitmentStatus } from "@prisma/client";
import { z } from "zod";

const statusSchema = z.object({
  status: z.nativeEnum(RecruitmentStatus),
  note: z.string().optional(),
  reviewerName: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, note, reviewerName } = statusSchema.parse(body);

    const now = new Date();

    const [recruitment] = await prisma.$transaction([
      prisma.recruitment.update({
        where: { id },
        data: {
          status,
          publishedAt:
            status === "CONFIRMED" ? now : status === "REJECTED" || status === "ARCHIVED" ? null : undefined,
        },
      }),
      prisma.adminReview.create({
        data: {
          recruitmentId: id,
          status: status === "CONFIRMED"
            ? "CONFIRMED"
            : status === "REJECTED"
            ? "REJECTED"
            : "PENDING",
          note: note || null,
          reviewerName: reviewerName || null,
        },
      }),
    ]);

    return NextResponse.json(recruitment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[POST /api/recruitments/:id/status]", error);
    return NextResponse.json({ error: "ステータス更新に失敗しました" }, { status: 500 });
  }
}
