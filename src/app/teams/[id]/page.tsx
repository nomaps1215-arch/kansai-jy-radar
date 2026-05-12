import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ExternalLink,
  MapPin,
  Trophy,
  Instagram,
  Twitter,
  Facebook,
  ChevronRight,
  Wallet,
  CalendarDays,
} from "lucide-react";
import {
  TEAM_CATEGORY_LABELS,
  RECRUITMENT_TYPE_LABELS,
  formatDate,
} from "@/lib/utils";
import { CURRENT_SEASON } from "@/lib/leagues";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id, isActive: true },
    include: {
      standings: {
        where: { season: CURRENT_SEASON },
        orderBy: { ageGroup: "asc" },
      },
      recruitments: {
        where: { status: "CONFIRMED", publishedAt: { not: null } },
        orderBy: { eventDate: "asc" },
        take: 10,
      },
      detectedPages: {
        where: {
          sourceType: { in: ["INSTAGRAM", "X", "FACEBOOK"] },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!team) notFound();

  const u13 = team.standings.find((s) => s.ageGroup === "U13");
  const u15 = team.standings.find((s) => s.ageGroup === "U15");

  // セレクション傾向：過去の全募集から月別集計
  const allRecruitments = await prisma.recruitment.findMany({
    where: { teamId: id, status: { in: ["CONFIRMED", "ARCHIVED"] }, eventDate: { not: null } },
    select: { eventDate: true, recruitmentType: true },
    orderBy: { eventDate: "asc" },
  });

  // 月別カウント
  const monthCounts: Record<number, number> = {};
  for (const r of allRecruitments) {
    if (!r.eventDate) continue;
    const m = r.eventDate.getMonth() + 1;
    monthCounts[m] = (monthCounts[m] ?? 0) + 1;
  }
  const peakMonths = Object.entries(monthCounts)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3)
    .map(([m]) => Number(m));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/teams" className="text-gray-400 hover:text-brand-600 text-sm">
            ← チーム一覧
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-sm text-gray-600 truncate">{team.name}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {/* チーム概要カード */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5">
                  {TEAM_CATEGORY_LABELS[team.category]}
                </span>
                <span className="text-xs text-gray-400">{team.prefecture}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              {team.nameKana && (
                <div className="text-sm text-gray-400 mt-0.5">{team.nameKana}</div>
              )}
            </div>
            {team.officialSiteUrl && (
              <a
                href={team.officialSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 text-sm text-brand-600 hover:underline"
              >
                <ExternalLink size={14} />
                公式サイト
              </a>
            )}
          </div>

          {/* 詳細情報 */}
          <div className="mt-5 space-y-2 text-sm text-gray-600">
            {team.city && (
              <div className="flex gap-2">
                <span className="text-gray-400 w-20 shrink-0">所在地</span>
                <span>{team.prefecture} {team.city}</span>
              </div>
            )}
            {team.trainingArea && (
              <div className="flex gap-2 items-start">
                <span className="text-gray-400 w-20 shrink-0 flex items-center gap-1">
                  <MapPin size={13} />練習場所
                </span>
                <span>{team.trainingArea}</span>
              </div>
            )}
            {team.homeGround && (
              <div className="flex gap-2">
                <span className="text-gray-400 w-20 shrink-0">ホーム</span>
                <span>{team.homeGround}</span>
              </div>
            )}
            {team.practiceDays && (
              <div className="flex gap-2 items-start">
                <span className="text-gray-400 w-20 shrink-0 flex items-center gap-1">
                  <CalendarDays size={13} />練習曜日
                </span>
                <span>{team.practiceDays}</span>
              </div>
            )}
            {team.monthlyFee && (
              <div className="flex gap-2 items-start">
                <span className="text-gray-400 w-20 shrink-0 flex items-center gap-1">
                  <Wallet size={13} />月謝
                </span>
                <span className="font-medium text-gray-800">{team.monthlyFee}</span>
              </div>
            )}
            {team.league && (
              <div className="flex gap-2">
                <span className="text-gray-400 w-20 shrink-0">所属リーグ</span>
                <span>{team.league}</span>
              </div>
            )}
          </div>

          {/* SNS */}
          {(team.instagramUrl || team.xUrl || team.facebookUrl) && (
            <div className="mt-4 flex gap-3">
              {team.instagramUrl && (
                <a
                  href={team.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pink-600 transition-colors"
                >
                  <Instagram size={20} />
                </a>
              )}
              {team.xUrl && (
                <a
                  href={team.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <Twitter size={20} />
                </a>
              )}
              {team.facebookUrl && (
                <a
                  href={team.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Facebook size={20} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* 順位カード */}
        {(u13 || u15) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5">
              <Trophy size={15} />
              {CURRENT_SEASON}年度 リーグ順位
            </h2>
            <div className="space-y-4">
              {[u13, u15].filter(Boolean).map((s) => s && (
                <div key={s.ageGroup}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium rounded px-2 py-0.5 ${
                      s.ageGroup === "U13"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {s.ageGroup === "U13" ? "U-13" : "U-15"}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {s.leagueName}
                    </span>
                    {s.rank != null && (
                      <span className="text-xl font-bold text-gray-900">
                        {s.rank}位
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs text-gray-500">
                    {[
                      { label: "試合", value: s.played },
                      { label: "勝", value: s.wins },
                      { label: "分", value: s.draws },
                      { label: "負", value: s.losses },
                      { label: "勝点", value: s.points },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded py-1.5">
                        <div className="font-bold text-gray-900 text-base">{value}</div>
                        <div>{label}</div>
                      </div>
                    ))}
                  </div>
                  {(s.goalsFor > 0 || s.goalsAgainst > 0) && (
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      得点 {s.goalsFor} / 失点 {s.goalsAgainst}
                      （得失点差 {s.goalsFor - s.goalsAgainst > 0 ? "+" : ""}
                      {s.goalsFor - s.goalsAgainst}）
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 募集情報 */}
        {team.recruitments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              募集・セレクション情報
            </h2>
            <div className="space-y-3">
              {team.recruitments.map((r) => (
                <div
                  key={r.id}
                  className="border border-gray-100 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs bg-red-50 text-red-700 rounded px-1.5 py-0.5 mr-2">
                        {RECRUITMENT_TYPE_LABELS[r.recruitmentType]}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {r.title}
                      </span>
                    </div>
                    {r.applicationUrl && (
                      <a
                        href={r.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs text-brand-600 hover:underline flex items-center gap-0.5"
                      >
                        <ExternalLink size={11} />
                        申込
                      </a>
                    )}
                  </div>
                  <div className="mt-1.5 text-xs text-gray-500 space-y-0.5">
                    {r.eventDate && (
                      <div>開催日: {formatDate(r.eventDate)}</div>
                    )}
                    {r.venue && <div>会場: {r.venue}</div>}
                    {r.applicationDeadline && (
                      <div>締切: {formatDate(r.applicationDeadline)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* セレクション傾向 */}
        {allRecruitments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              過去のセレクション傾向
            </h2>
            <div className="grid grid-cols-12 gap-1 mb-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const count = monthCounts[m] ?? 0;
                const max = Math.max(...Object.values(monthCounts), 1);
                const height = count > 0 ? Math.max(20, Math.round((count / max) * 60)) : 4;
                const isPeak = peakMonths.includes(m);
                return (
                  <div key={m} className="flex flex-col items-center gap-1">
                    <div className="relative flex items-end h-16">
                      <div
                        style={{ height: `${height}px` }}
                        className={`w-full rounded-t transition-all ${
                          isPeak ? "bg-brand-500" : count > 0 ? "bg-brand-200" : "bg-gray-100"
                        }`}
                      />
                      {count > 0 && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-600">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs ${isPeak ? "font-bold text-brand-600" : "text-gray-400"}`}>
                      {m}月
                    </span>
                  </div>
                );
              })}
            </div>
            {peakMonths.length > 0 && (
              <p className="text-xs text-gray-500">
                例年 <span className="font-medium text-brand-600">{peakMonths.map((m) => `${m}月`).join("・")}</span> に多い傾向があります
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              ※過去{allRecruitments.length}件のデータに基づく
            </p>
          </div>
        )}

        {/* SNS最新投稿 */}
        {team.detectedPages.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              SNS・最新投稿
            </h2>
            <div className="space-y-2">
              {team.detectedPages.map((page) => {
                const icon =
                  page.sourceType === "INSTAGRAM" ? "📸" :
                  page.sourceType === "X" ? "🐦" : "📘";
                return (
                  <a
                    key={page.id}
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg shrink-0">{icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {page.title ?? page.url}
                      </div>
                      {page.description && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {page.description}
                        </div>
                      )}
                    </div>
                    <ExternalLink size={14} className="text-gray-400 shrink-0 mt-0.5" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
