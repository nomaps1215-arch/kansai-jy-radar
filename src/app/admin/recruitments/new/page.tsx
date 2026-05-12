import { prisma } from "@/lib/prisma";
import RecruitmentForm from "../RecruitmentForm";

export default async function NewRecruitmentPage({
  searchParams,
}: {
  searchParams: Promise<{ teamId?: string }>;
}) {
  const sp = await searchParams;

  const teams = await prisma.team.findMany({
    where: { isActive: true },
    orderBy: [{ prefecture: "asc" }, { name: "asc" }],
    select: { id: true, name: true, prefecture: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">募集情報 手動登録</h1>
      <RecruitmentForm teams={teams} defaultTeamId={sp.teamId} />
    </div>
  );
}
