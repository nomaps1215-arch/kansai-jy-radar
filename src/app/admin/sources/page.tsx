import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SOURCE_TYPE_LABELS, formatDateTime, PREFECTURES } from "@/lib/utils";
import { Plus, CheckCircle, XCircle } from "lucide-react";
import { CrawlButton } from "./CrawlButton"
import { RunPipelineButton } from "./RunPipelineButton";

export const dynamic = "force-dynamic";

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ teamId?: string; prefecture?: string }>;
}) {
  const sp = await searchParams;

  const sources = await prisma.teamSource.findMany({
    where: {
      ...(sp.teamId ? { teamId: sp.teamId } : {}),
      ...(sp.prefecture ? { team: { prefecture: sp.prefecture } } : {}),
    },
    orderBy: [{ team: { prefecture: "asc" } }, { team: { name: "asc" } }],
    include: {
      team: { select: { id: true, name: true, prefecture: true } },
    },
  });

  const teams = await prisma.team.findMany({
    where: { isActive: true },
    orderBy: [{ prefecture: "asc" }, { name: "asc" }],
    select: { id: true, name: true, prefecture: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ソースURL管理</h1>
        <div className="flex items-center gap-3">
          <RunPipelineButton />
          <Link
            href="/admin/sources/new"
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Plus size={16} />
            新規登録
          </Link>
        </div>
      </div>

      <form method="GET" className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-3 flex-wrap">
        <select
          name="prefecture"
          defaultValue={sp.prefecture ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">都道府県：すべて</option>
          {PREFECTURES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          name="teamId"
          defaultValue={sp.teamId ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">チーム：すべて</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.prefecture} {t.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-gray-100 text-gray-700 rounded-lg px-4 py-1.5 text-sm hover:bg-gray-200 transition-colors"
        >
          絞り込む
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-sm text-gray-500">
          {sources.length}件
        </div>
        {sources.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400">
            ソースURLが登録されていません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">チーム</th>
                  <th className="px-4 py-3 text-left">種別</th>
                  <th className="px-4 py-3 text-left">URL</th>
                  <th className="px-4 py-3 text-center">巡回</th>
                  <th className="px-4 py-3 text-left">最終チェック</th>
                  <th className="px-4 py-3 text-left">最終成功</th>
                  <th className="px-4 py-3 text-left">最終エラー</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sources.map((source) => (
                  <tr key={source.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-xs">
                        {source.team.prefecture}
                      </div>
                      <div className="text-gray-700">{source.team.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {SOURCE_TYPE_LABELS[source.sourceType]}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:underline text-xs truncate block max-w-xs"
                      >
                        {source.url}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {source.crawlEnabled ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle size={12} />有効
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                          <XCircle size={12} />無効
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {source.lastCheckedAt
                        ? formatDateTime(source.lastCheckedAt)
                        : <span className="text-gray-300">未実施</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {source.lastSuccessAt
                        ? formatDateTime(source.lastSuccessAt)
                        : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-red-500 max-w-xs truncate">
                      {source.lastError ?? ""}
                    </td>
                    <td className="px-4 py-3">
                      <SourceActions sourceId={source.id} crawlEnabled={source.crawlEnabled} />
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

function SourceActions({
  sourceId,
  crawlEnabled,
}: {
  sourceId: string;
  crawlEnabled: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <CrawlButton sourceId={sourceId} />
      <Link
        href={`/admin/sources/${sourceId}/edit`}
        className="text-xs text-gray-500 hover:text-brand-600 transition-colors"
      >
        編集
      </Link>
    </div>
  );
}
