import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TeamForm from "../../TeamForm";
import StandingsForm from "./StandingsForm";

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: { standings: { orderBy: [{ season: "desc" }, { ageGroup: "asc" }] } },
  });

  if (!team) notFound();

  const { standings, ...teamData } = team;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        チーム編集：{team.name}
      </h1>
      <TeamForm team={teamData} />
      <StandingsForm
        teamId={id}
        initialStandings={standings.map((s) => ({
          ...s,
          ageGroup: s.ageGroup as "U13" | "U15",
          rank: s.rank ?? null,
        }))}
      />
    </div>
  );
}
