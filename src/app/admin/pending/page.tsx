import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  RECRUITMENT_TYPE_LABELS,
  CONFIDENCE_LABELS,
  CONFIDENCE_COLORS,
  RECRUITMENT_TYPE_COLORS,
  PREFECTURES,
  formatDate,
  formatDateTime,
  truncate,
} from "@/lib/utils";
import { ConfidenceLabel, RecruitmentType } from "@prisma/client";
import PendingActions from "./PendingActions";

export const dynamic = "force-dynamic";

export default async function PendingPage({
  searchParams,
}: {
  searchParams: Promise<{
    confidence?: string;
    type?: string;
    prefecture?: string;
  }>;
}) {
  const sp = await searchParams;

  const recruitments = await prisma.recruitment.findMany({
    where: {
      status: { in: ["DETECTED", "PENDING"] },
      ...(sp.confidence ? { confidenceLabel: sp.confidence as ConfidenceLabel } : {}),
      ...(sp.type ? { recruitmentType: sp.type as RecruitmentType } : {}),
      ...(sp.prefecture ? { team: { prefecture: sp.prefecture } } : {}),
    },
    orderBy: [{ confidenceLabel: "asc" }, { createdAt: "desc" }],
    include: {
      team: { select: { id: true, name: true, prefecture: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          未確認情報
          {recruitments.length > 0 && (
            <span className="ml-2 bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {recruitments.length}件
            </span>
          )}
        </h1>
      </div>

      {/* フィルター */}
      <form method="GET" className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-2 flex-wrap">
        <select name="prefecture" defaultValue={sp.prefecture ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">都道府県：すべて</option>
          {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="type" defaultValue={sp.type ?? ""}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">種別：すべて</option>
          {(Object.keys(RECRUITMENT_TYPE_LABELS) as RecruitmentType[]).map((k) => (
            <option key={k} value={k}>{RECRUITMENT_TYPE_LABELS[k]}</option>
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
      </form>

      {recruitments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-12 text-center text-gray-400">
          未確認の情報はありません
        </div>
      ) : (
        <div className="space-y-3">
          {recruitments.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${RECRUITMENT_TYPE_COLORS[r.recruitmentType]}`}>
                      {RECRUITMENT_TYPE_LABELS[r.recruitmentType]}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${CONFIDENCE_COLORS[r.confidenceLabel]}`}>
                      {CONFIDENCE_LABELS[r.confidenceLabel]}
                    </span>
                    {r.isGkRecruiting && (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        GK募集あり
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{r.team.prefecture}</div>
                  <div className="font-bold text-gray-900 text-lg">{r.team.name}</div>
                  <div className="text-gray-700 mt-0.5">{r.title}</div>
                </div>
                <div className="text-xs text-gray-400 shrink-0">
                  検出: {formatDateTime(r.createdAt)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                <InfoItem label="開催日" value={formatDate(r.eventDate)} />
                <InfoItem
                  label="時間"
                  value={r.eventStartTime
                    ? `${r.eventStartTime}${r.eventEndTime ? ` ～ ${r.eventEndTime}` : ""}`
                    : null}
                />
                <InfoItem label="会場" value={r.venue} />
                <InfoItem label="締切" value={formatDate(r.applicationDeadline)} />
                <InfoItem label="参加費" value={r.fee} />
                <InfoItem label="募集人数" value={r.capacity} />
                <InfoItem label="対象ポジション" value={r.targetPositions} />
              </div>

              {r.applicationUrl && (
                <div className="mb-3">
                  <span className="text-xs text-gray-500 mr-2">申込URL:</span>
                  <a href={r.applicationUrl} target="_blank" rel="noopener noreferrer"
                    className="text-brand-600 hover:underline text-sm break-all">
                    {r.applicationUrl}
                  </a>
                </div>
              )}

              {r.sourceUrl && (
                <div className="mb-3">
                  <span className="text-xs text-gray-500 mr-2">出典:</span>
                  <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="text-brand-600 hover:underline text-sm break-all">
                    {r.sourceUrl}
                  </a>
                </div>
              )}

              {r.extractedText && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 mb-4 max-h-24 overflow-y-auto">
                  {truncate(r.extractedText, 300)}
                </div>
              )}

              <PendingActions recruitmentId={r.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}
