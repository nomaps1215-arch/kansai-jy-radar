import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  TEAM_CATEGORY_LABELS,
  PREFECTURES,
  formatDateTime,
} from "@/lib/utils";
import { Plus, ExternalLink, Edit } from "lucide-react";
import TeamImportButton from "./TeamImportButton";

export const dynamic = "force-dynamic";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ prefecture?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const prefecture = sp.prefecture;
  const q = sp.q;

  const teams = await prisma.team.findMany({
    where: {
      ...(prefecture ? { prefecture } : {}),
      ...(q
        ? { OR: [{ name: { contains: q } }, { nameKana: { contains: q } }] }
        : {}),
    },
    orderBy: [{ prefecture: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { sources: true, recruitments: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">チーム管理</h1>
        <div className="flex gap-2">
          <TeamImportButton />
          <Link
            href="/admin/teams/new"
            className="flex items-center gap-2 bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} />
            新規登録
          </Link>
        </div>
      </div>

      {/* フィルター */}
      <form method="GET" className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-3 flex-wrap">
        <select
          name="prefecture"
          defaultValue={prefecture ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">都道府県：すべて</option>
          {PREFECTURES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="チーム名で検索..."
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="bg-gray-100 text-gray-700 rounded-lg px-4 py-1.5 text-sm hover:bg-gray-200 transition-colors"
        >
          絞り込む
        </button>
        {(prefecture || q) && (
          <Link
            href="/admin/teams"
            className="text-sm text-gray-400 hover:text-gray-600 py-1.5"
          >
            クリア
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-sm text-gray-500">
          {teams.length}件
        </div>
        {teams.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400">
            チームが登録されていません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">チーム名</th>
                  <th className="px-4 py-3 text-left">都道府県</th>
                  <th className="px-4 py-3 text-left">カテゴリ</th>
                  <th className="px-4 py-3 text-left">リーグ</th>
                  <th className="px-4 py-3 text-center">ソース</th>
                  <th className="px-4 py-3 text-center">募集情報</th>
                  <th className="px-4 py-3 text-left">公式サイト</th>
                  <th className="px-4 py-3 text-left">更新日</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div>{team.name}</div>
                      {team.nameKana && (
                        <div className="text-xs text-gray-400">{team.nameKana}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{team.prefecture}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {TEAM_CATEGORY_LABELS[team.category]}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{team.league ?? "-"}</td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {team._count.sources}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {team._count.recruitments}
                    </td>
                    <td className="px-4 py-3">
                      {team.officialSiteUrl ? (
                        <a
                          href={team.officialSiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink size={12} />
                          <span className="text-xs">開く</span>
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDateTime(team.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/teams/${team.id}/edit`}
                        className="flex items-center gap-1 text-gray-500 hover:text-brand-600 transition-colors"
                      >
                        <Edit size={14} />
                        <span className="text-xs">編集</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
