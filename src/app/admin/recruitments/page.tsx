import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  RECRUITMENT_TYPE_LABELS,
  RECRUITMENT_STATUS_LABELS,
  CONFIDENCE_LABELS,
  CONFIDENCE_COLORS,
  STATUS_COLORS,
  RECRUITMENT_TYPE_COLORS,
  PREFECTURES,
  formatDate,
  truncate,
} from "@/lib/utils";
import { RecruitmentStatus, RecruitmentType, ConfidenceLabel } from "@prisma/client";
import { Plus, Edit, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RecruitmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    type?: string;
    prefecture?: string;
    confidence?: string;
    filter?: string;
  }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const recruitments = await prisma.recruitment.findMany({
    where: {
      ...(sp.status ? { status: sp.status as RecruitmentStatus } : {}),
      ...(sp.type ? { recruitmentType: sp.type as RecruitmentType } : {}),
      ...(sp.confidence ? { confidenceLabel: sp.confidence as ConfidenceLabel } : {}),
      ...(sp.prefecture ? { team: { prefecture: sp.prefecture } } : {}),
      ...(sp.filter === "deadline_soon"
        ? { status: "CONFIRMED", applicationDeadline: { gte: now, lte: sevenDaysLater } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      team: { select: { id: true, name: true, prefecture: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">募集情報管理</h1>
        <Link
          href="/admin/recruitments/new"
          className="flex items-center gap-2 bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          手動登録
        </Link>
      </div>

      {/* フィルター */}
      <form method="GET" className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-2 flex-wrap items-center">
        <select name="status" defaultValue={sp.status ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">ステータス：すべて</option>
          {(Object.keys(RECRUITMENT_STATUS_LABELS) as RecruitmentStatus[]).map((k) => (
            <option key={k} value={k}>{RECRUITMENT_STATUS_LABELS[k]}</option>
          ))}
        </select>
        <select name="type" defaultValue={sp.type ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">種別：すべて</option>
          {(Object.keys(RECRUITMENT_TYPE_LABELS) as RecruitmentType[]).map((k) => (
            <option key={k} value={k}>{RECRUITMENT_TYPE_LABELS[k]}</option>
          ))}
        </select>
        <select name="prefecture" defaultValue={sp.prefecture ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">都道府県：すべて</option>
          {PREFECTURES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select name="confidence" defaultValue={sp.confidence ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">信頼度：すべて</option>
          {(Object.keys(CONFIDENCE_LABELS) as ConfidenceLabel[]).map((k) => (
            <option key={k} value={k}>{CONFIDENCE_LABELS[k]}</option>
          ))}
        </select>
        <button type="submit"
          className="bg-gray-100 text-gray-700 rounded-lg px-4 py-1.5 text-sm hover:bg-gray-200 transition-colors">
          絞り込む
        </button>
        <Link href="/admin/recruitments" className="text-sm text-gray-400 hover:text-gray-600 py-1.5">
          クリア
        </Link>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-sm text-gray-500">
          {recruitments.length}件
        </div>
        {recruitments.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400">該当する募集情報がありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">チーム</th>
                  <th className="px-4 py-3 text-left">タイトル</th>
                  <th className="px-4 py-3 text-left">種別</th>
                  <th className="px-4 py-3 text-left">ステータス</th>
                  <th className="px-4 py-3 text-left">開催日</th>
                  <th className="px-4 py-3 text-left">締切</th>
                  <th className="px-4 py-3 text-left">信頼度</th>
                  <th className="px-4 py-3 text-left">出典</th>
                  <th className="px-4 py-3 text-left">登録日</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recruitments.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-400">{r.team.prefecture}</div>
                      <div className="font-medium text-gray-900">{r.team.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs">
                      {truncate(r.title, 30)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${RECRUITMENT_TYPE_COLORS[r.recruitmentType]}`}>
                        {RECRUITMENT_TYPE_LABELS[r.recruitmentType]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                        {RECRUITMENT_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {formatDate(r.eventDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {formatDate(r.applicationDeadline)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${CONFIDENCE_COLORS[r.confidenceLabel]}`}>
                        {r.confidenceLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.sourceUrl ? (
                        <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer"
                          className="text-brand-600 hover:underline flex items-center gap-1 text-xs">
                          <ExternalLink size={11} />開く
                        </a>
                      ) : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/recruitments/${r.id}/edit`}
                        className="flex items-center gap-1 text-gray-500 hover:text-brand-600 text-xs transition-colors">
                        <Edit size={12} />編集
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
