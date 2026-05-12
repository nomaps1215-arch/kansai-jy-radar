import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  RECRUITMENT_TYPE_LABELS,
  RECRUITMENT_TYPE_COLORS,
  CONFIDENCE_COLORS,
  PREFECTURES,
  formatDate,
} from "@/lib/utils";
import { RecruitmentType } from "@prisma/client";
import { Search, Calendar, MapPin, ExternalLink, Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TopPage({
  searchParams,
}: {
  searchParams: Promise<{
    prefecture?: string;
    type?: string;
  }>;
}) {
  const sp = await searchParams;

  const recruitments = await prisma.recruitment.findMany({
    where: {
      status: "CONFIRMED",
      publishedAt: { not: null },
      ...(sp.prefecture ? { team: { prefecture: sp.prefecture } } : {}),
      ...(sp.type ? { recruitmentType: sp.type as RecruitmentType } : {}),
    },
    orderBy: [
      { applicationDeadline: "asc" },
      { eventDate: "asc" },
    ],
    include: {
      team: { select: { id: true, name: true, prefecture: true } },
    },
  });

  const stats = await prisma.recruitment.groupBy({
    by: ["recruitmentType"],
    where: { status: "CONFIRMED", publishedAt: { not: null } },
    _count: true,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <div>
              <div className="font-bold text-gray-900 leading-tight">関西JYレーダー</div>
              <div className="text-xs text-gray-400 leading-tight">ジュニアユース進路情報</div>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/teams" className="text-gray-600 hover:text-brand-600 transition-colors">
              チーム一覧
            </Link>
            <Link href="/calendar" className="text-gray-600 hover:text-brand-600 transition-colors flex items-center gap-1">
              <Calendar size={14} />カレンダー
            </Link>
            <Link href="/notify" className="text-gray-600 hover:text-brand-600 transition-colors flex items-center gap-1">
              <Bell size={14} />LINE通知
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* ヒーロー */}
        <div className="bg-gradient-to-r from-brand-700 to-brand-500 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">
            2027年度 ジュニアユース募集情報
          </h1>
          <p className="text-brand-100 mb-6">
            関西2府4県（大阪・兵庫・京都・奈良・滋賀・和歌山）のサッカークラブ情報を集約
          </p>
          <div className="flex gap-4 flex-wrap mb-6">
            {stats.map((s) => (
              <div key={s.recruitmentType} className="bg-white/20 rounded-xl px-4 py-2">
                <div className="text-2xl font-bold">{s._count}</div>
                <div className="text-xs text-brand-100">
                  {RECRUITMENT_TYPE_LABELS[s.recruitmentType as RecruitmentType]}
                </div>
              </div>
            ))}
          </div>
          {/* クイックリンク */}
          <div className="flex gap-3 flex-wrap">
            <Link href="/teams" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-4 py-2 text-sm font-medium">
              <MapPin size={14} />チーム一覧・比較
            </Link>
            <Link href="/calendar" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-4 py-2 text-sm font-medium">
              <Calendar size={14} />カレンダーで見る
            </Link>
            <Link href="/notify" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-4 py-2 text-sm font-medium">
              <Bell size={14} />LINE通知登録
            </Link>
          </div>
        </div>

        {/* フィルター */}
        <form method="GET" className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2 text-gray-500">
            <Search size={16} />
            <span className="text-sm font-medium">絞り込み</span>
          </div>
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
          <button type="submit"
            className="bg-brand-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-brand-700 transition-colors">
            検索
          </button>
          {(sp.prefecture || sp.type) && (
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">クリア</Link>
          )}
        </form>

        {/* 一覧 */}
        {recruitments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400">
            現在公開中の募集情報はありません
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recruitments.map((r) => (
              <RecruitmentCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-400">
          <p>関西ジュニアユース進路レーダー — 情報は随時更新中</p>
          <p className="mt-1">掲載情報は公式情報を確認の上、必ず一次情報をご確認ください</p>
        </div>
      </footer>
    </div>
  );
}

function RecruitmentCard({
  r,
}: {
  r: {
    id: string;
    title: string;
    recruitmentType: RecruitmentType;
    confidenceLabel: string;
    eventDate: Date | null;
    applicationDeadline: Date | null;
    venue: string | null;
    applicationUrl: string | null;
    sourceUrl: string | null;
    publishedAt: Date | null;
    isGkRecruiting: boolean;
    fee: string | null;
    team: { id: string; name: string; prefecture: string };
  };
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-1.5 flex-wrap">
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${RECRUITMENT_TYPE_COLORS[r.recruitmentType]}`}>
            {RECRUITMENT_TYPE_LABELS[r.recruitmentType]}
          </span>
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${CONFIDENCE_COLORS[r.confidenceLabel as keyof typeof CONFIDENCE_COLORS]}`}>
            {r.confidenceLabel}
          </span>
          {r.isGkRecruiting && (
            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              GK
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-0.5">{r.team.prefecture}</div>
      <div className="font-bold text-gray-900 text-lg leading-tight mb-1">
        {r.team.name}
      </div>
      <div className="text-sm text-gray-600 mb-4">{r.title}</div>

      <div className="space-y-1.5 text-sm mb-4">
        {r.eventDate && (
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            {formatDate(r.eventDate)}
          </div>
        )}
        {r.venue && (
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin size={14} className="text-gray-400 shrink-0" />
            {r.venue}
          </div>
        )}
        {r.applicationDeadline && (
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-xs text-orange-600 font-medium">締切:</span>
            <span className="text-xs">{formatDate(r.applicationDeadline)}</span>
          </div>
        )}
        {r.fee && (
          <div className="text-xs text-gray-500">参加費: {r.fee}</div>
        )}
      </div>

      <div className="flex gap-2">
        {r.applicationUrl && (
          <a
            href={r.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            申込む
            <ExternalLink size={12} />
          </a>
        )}
        {r.sourceUrl && (
          <a
            href={r.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 border border-gray-300 text-gray-600 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            詳細
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
