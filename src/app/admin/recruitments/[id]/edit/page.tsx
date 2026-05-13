export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RecruitmentForm from "../../RecruitmentForm";

export default async function EditRecruitmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [recruitment, teams] = await Promise.all([
    prisma.recruitment.findUnique({
      where: { id },
      include: {
        team: true,
        adminReviews: { orderBy: { reviewedAt: "desc" }, take: 5 },
      },
    }),
    prisma.team.findMany({
      where: { isActive: true },
      orderBy: [{ prefecture: "asc" }, { name: "asc" }],
      select: { id: true, name: true, prefecture: true },
    }),
  ]);

  if (!recruitment) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        募集情報編集：{recruitment.team.name}
      </h1>
      <RecruitmentForm teams={teams} recruitment={recruitment} />
    </div>
  );
}
