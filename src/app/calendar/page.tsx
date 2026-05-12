import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PREFECTURES } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { RECRUITMENT_TYPE_LABELS } from "@/lib/utils";
import { RecruitmentType } from "@prisma/client";

export const dynamic = "force-dynamic";

const TYPE_COLORS: Record<RecruitmentType, string> = {
  SELECTION: "bg-red-100 text-red-700 border-red-200",
  TRIAL:     "bg-blue-100 text-blue-700 border-blue-200",
  BRIEFING:  "bg-orange-100 text-orange-700 border-orange-200",
  GENERAL:   "bg-gray-100 text-gray-600 border-gray-200",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; prefecture?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year  = parseInt(sp.year  ?? String(now.getFullYear()));
  const month = parseInt(sp.month ?? String(now.getMonth() + 1));
  const prefecture = sp.prefecture ?? "";

  const firstDay = new Date(year, month - 1, 1);
  const lastDay  = new Date(year, month, 0);

  const recruitments = await prisma.recruitment.findMany({
    where: {
      status: "CONFIRMED",
      publishedAt: { not: null },
      eventDate: { gte: firstDay, lte: lastDay },
      ...(prefecture ? { team: { prefecture } } : {}),
    },
    include: { team: { select: { id: true, name: true, prefecture: true } } },
    orderBy: { eventDate: "asc" },
  });

  // 日付ごとにグループ化
  const byDate = new Map<number, typeof recruitments>();
  for (const r of recruitments) {
    if (!r.eventDate) continue;
    const d = r.eventDate.getDate();
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(r);
  }

  // カレンダーグリッド構築
  const startDow = firstDay.getDay(); // 0=日
  const daysInMonth = lastDay.getDate();
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevYear  = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const nextYear  = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const prefQ     = prefecture ? `&prefecture=${encodeURIComponent(prefecture)}` : "";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-brand-600 text-sm">← トップ</Link>
          <CalendarDays size={18} className="text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">セレクションカレンダー</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* コントロール */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/calendar?year=${prevYear}&month=${prevMonth}${prefQ}`}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </Link>
            <span className="text-xl font-bold text-gray-900 w-36 text-center">
              {year}年 {month}月
            </span>
            <Link
              href={`/calendar?year=${nextYear}&month=${nextMonth}${prefQ}`}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={16} />
            </Link>
          </div>

          <form method="GET" className="flex gap-2 items-center">
            <input type="hidden" name="year"  value={year} />
            <input type="hidden" name="month" value={month} />
            <select
              name="prefecture"
              defaultValue={prefecture}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">都道府県：すべて</option>
              {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button
              type="submit"
              className="bg-brand-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              絞り込む
            </button>
          </form>
        </div>

        {/* 凡例 */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {(Object.keys(TYPE_COLORS) as RecruitmentType[]).map((t) => (
            <span key={t} className={`text-xs px-2 py-0.5 rounded border ${TYPE_COLORS[t]}`}>
              {RECRUITMENT_TYPE_LABELS[t]}
            </span>
          ))}
        </div>

        {/* カレンダー */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
              <div
                key={d}
                className={`py-2 text-center text-xs font-medium ${
                  i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {cells.map((day, idx) => {
              const dow = idx % 7;
              const events = day ? (byDate.get(day) ?? []) : [];
              const isToday =
                day === now.getDate() &&
                month === now.getMonth() + 1 &&
                year === now.getFullYear();

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] p-1.5 ${!day ? "bg-gray-50" : ""}`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-brand-600 text-white"
                            : dow === 0
                            ? "text-red-500"
                            : dow === 6
                            ? "text-blue-500"
                            : "text-gray-700"
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {events.map((r) => (
                          <Link
                            key={r.id}
                            href={`/teams/${r.team.id}`}
                            className={`block text-xs px-1.5 py-0.5 rounded border truncate hover:opacity-80 transition-opacity ${TYPE_COLORS[r.recruitmentType]}`}
                            title={`${r.team.name}：${r.title}`}
                          >
                            {r.team.name}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 月間一覧 */}
        {recruitments.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {year}年{month}月の募集情報一覧（{recruitments.length}件）
            </h2>
            <div className="space-y-2">
              {recruitments.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-center w-10">
                      <div className="text-lg font-bold text-gray-900">
                        {r.eventDate?.getDate()}
                      </div>
                      <div className="text-xs text-gray-400">日</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${TYPE_COLORS[r.recruitmentType]}`}>
                          {RECRUITMENT_TYPE_LABELS[r.recruitmentType]}
                        </span>
                        <span className="text-xs text-gray-400">{r.team.prefecture}</span>
                      </div>
                      <div className="font-medium text-gray-900">{r.team.name}</div>
                      <div className="text-xs text-gray-500">{r.title}</div>
                    </div>
                  </div>
                  <Link
                    href={`/teams/${r.team.id}`}
                    className="shrink-0 text-sm text-brand-600 hover:underline"
                  >
                    詳細 →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {recruitments.length === 0 && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400">
            {year}年{month}月の募集情報はありません
          </div>
        )}
      </main>
    </div>
  );
}
