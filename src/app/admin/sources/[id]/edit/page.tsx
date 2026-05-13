export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SourceForm from "../../SourceForm";

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [source, teams] = await Promise.all([
    prisma.teamSource.findUnique({ where: { id }, include: { team: true } }),
    prisma.team.findMany({
      where: { isActive: true },
      orderBy: [{ prefecture: "asc" }, { name: "asc" }],
      select: { id: true, name: true, prefecture: true },
    }),
  ]);

  if (!source) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        ソースURL編集
      </h1>
      <SourceForm teams={teams} source={source} />
    </div>
  );
}
