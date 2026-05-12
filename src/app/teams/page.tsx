import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TEAM_CATEGORY_LABELS, PREFECTURES } from "@/lib/utils";
import { ExternalLink, ChevronRight, MapPin, Trophy, Wallet, CalendarDays } from "lucide-react";
import { TeamCategory } from "@prisma/client";
import { LEAGUES, CURRENT_SEASON } from "@/lib/leagues";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function TeamsPublicPage({
  searchParams,
}: {
  searchParams: Promise<{ prefecture?: string; category?: string; league?: string; compareIds?: string; area?: string }>;
}) {
  const sp = await searchParams;
  const compareIds = sp.compareIds?.split(",").filter(Boolean) ?? [];
  const area = sp.area ?? "";

  const teams = await prisma.team.findMany({
    where: {
      isActive: true,
      ...(sp.prefecture ? { prefecture: sp.prefecture } : {}),
      ...(sp.category ? { category: sp.category as TeamCategory } : {}),
      ...(sp.league
        ? { standings: { some: { leagueName: sp.league, season: CURRENT_SEASON } } }
        : {}),
      ...(area
        ? {
            OR: [
              { city: { contains: area } },
              { trainingArea: { contains: area } },
            ],
          }
        : {}),
    },
    orderBy: [{ prefecture: "asc" }, { name: "asc" }],
    include: {
      standings: {
        where: { season: CURRENT_SEASON },
        orderBy: { ageGroup: "asc" },
      },
      _count: {
        select: {
          recruitments: {
            where: { status: "CONFIRMED", publishedAt: { not: null } },
          },
        },
      },
    },
  });

  const grouped = teams.reduce<Record<string, typeof teams>>((acc, team) => {
    if (!acc[team.prefecture]) acc[team.prefecture] = [];
    acc[team.prefecture].push(team);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-brand-600 text-sm">
            ← トップへ戻る
          </Link>
          <h1 className="text-xl font-bold text-gray-900">チーム一覧</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* フィルター */}
        <form
          method="GET"
          className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex gap-3 flex-wrap"
        >
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
            name="category"
            defaultValue={sp.category ?? ""}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">カテゴリ：すべて</option>
            {(Object.keys(TEAM_CATEGORY_LABELS) as TeamCategory[]).map((k) => (
              <option key={k} value={k}>{TEAM_CATEGORY_LABELS[k]}</option>
            ))}
          </select>

          <select
            name="league"
            defaultValue={sp.league ?? ""}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">リーグ：すべて</option>
            <optgroup label="── U-15 ──────────────">
              {LEAGUES.filter((l) => l.ageGroup === "U15").map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}（{l.scope}）
                </option>
              ))}
            </optgroup>
            <optgroup label="── U-13 ──────────────">
              {LEAGUES.filter((l) => l.ageGroup === "U13").map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}（{l.scope}）
                </option>
              ))}
            </optgroup>
          </select>

          <input
            name="area"
            defaultValue={area}
            placeholder="エリア・市区町村..."
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-40"
          />

          <button
            type="submit"
            className="bg-brand-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            絞り込む
          </button>
          {(sp.prefecture || sp.category || sp.league || area) && (
            <a
              href="/teams"
              className="text-sm text-gray-400 hover:text-gray-600 py-1.5"
            >
              クリア
            </a>
          )}
        </form>

        {Object.entries(grouped).map(([pref, prefTeams]) => (
          <div key={pref} className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
              {pref}
              <span className="text-sm font-normal text-gray-400 ml-2">
                {prefTeams.length}チーム
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prefTeams.map((team) => {
                const u13 = team.standings.find((s) => s.ageGroup === "U13");
                const u15 = team.standings.find((s) => s.ageGroup === "U15");
                return (
                  <div
                    key={team.id}
                    className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow ${
                      compareIds.includes(team.id) ? "border-brand-400 ring-1 ring-brand-400" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* バッジ行 */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">
                            {TEAM_CATEGORY_LABELS[team.category]}
                          </span>
                          {team._count.recruitments > 0 && (
                            <span className="text-xs text-brand-600 bg-brand-50 rounded px-2 py-0.5 font-medium">
                              募集 {team._count.recruitments}件
                            </span>
                          )}
                        </div>

                        {/* チーム名 */}
                        <div className="font-bold text-gray-900 truncate">
                          {team.name}
                        </div>

                        {/* 市区町村 */}
                        {team.city && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {team.city}
                          </div>
                        )}

                        {/* 練習場所 */}
                        {team.trainingArea && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MapPin size={11} />
                            <span>{team.trainingArea}</span>
                          </div>
                        )}

                        {/* 練習曜日・月謝 */}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {team.practiceDays && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <CalendarDays size={11} />
                              <span>{team.practiceDays}</span>
                            </div>
                          )}
                          {team.monthlyFee && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Wallet size={11} />
                              <span>{team.monthlyFee}</span>
                            </div>
                          )}
                        </div>

                        {/* 順位バッジ */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {u13 && (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded px-2 py-0.5">
                              <Trophy size={10} />
                              U-13 {u13.leagueName}
                              {u13.rank != null && ` ${u13.rank}位`}
                            </span>
                          )}
                          {u15 && (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 rounded px-2 py-0.5">
                              <Trophy size={10} />
                              U-15 {u15.leagueName}
                              {u15.rank != null && ` ${u15.rank}位`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* アクションボタン */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {(() => {
                          const isAdded = compareIds.includes(team.id);
                          const isFull = compareIds.length >= 3 && !isAdded;
                          const nextIds = isAdded
                            ? compareIds.filter((id) => id !== team.id)
                            : [...compareIds, team.id];
                          const href = `/teams?${new URLSearchParams({
                            ...(sp.prefecture ? { prefecture: sp.prefecture } : {}),
                            ...(sp.category ? { category: sp.category } : {}),
                            ...(sp.league ? { league: sp.league } : {}),
                            ...(nextIds.length > 0 ? { compareIds: nextIds.join(",") } : {}),
                          }).toString()}`;
                          return (
                            <Link
                              href={href}
                              className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                                isAdded
                                  ? "bg-brand-600 text-white border-brand-600"
                                  : isFull
                                  ? "text-gray-300 border-gray-200 pointer-events-none"
                                  : "text-brand-600 border-brand-200 hover:bg-brand-50"
                              }`}
                            >
                              {isAdded ? "✓比較中" : "比較+"}
                            </Link>
                          );
                        })()}
                        {team.officialSiteUrl && (
                          <a
                            href={team.officialSiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-brand-600 transition-colors"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <Link
                          href={`/teams/${team.id}`}
                          className="text-gray-400 hover:text-brand-600 transition-colors"
                        >
                          <ChevronRight size={18} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {teams.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400">
            チームが見つかりません
          </div>
        )}

        {/* 比較バーのスペーサー */}
        {compareIds.length > 0 && <div className="h-16" />}
      </main>

      {/* 比較フローティングバー */}
      {compareIds.length > 0 && (
        <Suspense>
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 px-4 py-3">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-gray-700">{compareIds.length}チームを選択中</span>
                {compareIds.length >= 2 && (
                  <Link
                    href={`/compare?ids=${compareIds.join(",")}`}
                    className="bg-brand-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-brand-700 transition-colors"
                  >
                    比較する →
                  </Link>
                )}
                {compareIds.length < 2 && (
                  <span className="text-gray-400">あと{2 - compareIds.length}チーム選択してください</span>
                )}
              </div>
              <Link
                href="/teams"
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕ クリア
              </Link>
            </div>
          </div>
        </Suspense>
      )}
    </div>
  );
}
