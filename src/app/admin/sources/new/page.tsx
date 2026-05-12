import { prisma } from "@/lib/prisma";
import SourceForm from "../SourceForm";

export default async function NewSourcePage({
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ソースURL新規登録</h1>
      <SourceForm teams={teams} defaultTeamId={sp.teamId} />
    </div>
  );
}
