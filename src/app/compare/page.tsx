import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TEAM_CATEGORY_LABELS } from "@/lib/utils";
import { Trophy, MapPin, Wallet, CalendarDays, ExternalLink, Check, Minus } from "lucide-react";
import { CURRENT_SEASON } from "@/lib/leagues";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const sp = await searchParams;
  const ids = sp.ids?.split(",").filter(Boolean).slice(0, 3) ?? [];

  if (ids.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">比較するには2チーム以上選択してください</p>
          <Link href="/teams" className="text-brand-600 hover:underline">← チーム一覧へ</Link>
        </div>
      </div>
    );
  }

  const teams = await prisma.team.findMany({
    where: { id: { in: ids }, isActive: true },
    include: {
      standings: { where: { season: CURRENT_SEASON } },
      _count: {
        select: {
          recruitments: { where: { status: "CONFIRMED", publishedAt: { not: null } } },
        },
      },
    },
  });

  if (teams.length < 2) notFound();

  // IDの順番を保持
  const sorted = ids.map((id) => teams.find((t) => t.id === id)).filter(Boolean) as typeof teams;

  const cell = (content: React.ReactNode, highlight = false) => (
    <td className={`px-4 py-3 text-sm text-center border-l border-gray-100 ${highlight ? "bg-brand-50" : ""}`}>
      {content}
    </td>
  );

  const val = (v: string | null | undefined) =>
    v ? <span className="text-gray-800">{v}</span> : <Minus size={14} className="text-gray-300 mx-auto" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/teams" className="text-gray-400 hover:text-brand-600 text-sm">← チーム一覧</Link>
          <h1 className="text-xl font-bold text-gray-900">チーム比較</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-4 text-left text-xs text-gray-400 font-medium w-32">項目</th>
                {sorted.map((team, i) => (
                  <th key={team.id} className={`px-4 py-4 text-center border-l border-gray-100 ${i === 0 ? "bg-brand-50" : ""}`}>
                    <Link href={`/teams/${team.id}`} className="font-bold text-gray-900 hover:text-brand-600 transition-colors text-sm">
                      {team.name}
                    </Link>
                    <div className="text-xs text-gray-400 mt-0.5">{team.prefecture}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {/* カテゴリ */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 font-medium">カテゴリ</td>
                {sorted.map((t, i) => cell(<span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{TEAM_CATEGORY_LABELS[t.category]}</span>, i === 0))}
              </tr>

              {/* 所在地 */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 font-medium"><MapPin size={12} className="inline mr-1" />所在地</td>
                {sorted.map((t, i) => cell(val(t.city), i === 0))}
              </tr>

              {/* 練習場所 */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 font-medium">練習場所</td>
                {sorted.map((t, i) => cell(val(t.trainingArea), i === 0))}
              </tr>

              {/* 練習曜日 */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 font-medium"><CalendarDays size={12} className="inline mr-1" />練習曜日</td>
                {sorted.map((t, i) => cell(val(t.practiceDays), i === 0))}
              </tr>

              {/* 月謝 */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 font-medium"><Wallet size={12} className="inline mr-1" />月謝</td>
                {sorted.map((t, i) => cell(val(t.monthlyFee), i === 0))}
              </tr>

              {/* U-13順位 */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 font-medium"><Trophy size={12} className="inline mr-1" />U-13リーグ</td>
                {sorted.map((t, i) => {
                  const s = t.standings.find((s) => s.ageGroup === "U13");
                  return cell(
                    s ? (
                      <div>
                        <div className="text-xs text-gray-500">{s.leagueName}</div>
                        {s.rank != null && <div className="font-bold text-gray-900">{s.rank}位</div>}
                        <div className="text-xs text-gray-400">{s.points}pt</div>
                      </div>
                    ) : <Minus size={14} className="text-gray-300 mx-auto" />,
                    i === 0
                  );
                })}
              </tr>

              {/* U-15順位 */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 font-medium"><Trophy size={12} className="inline mr-1" />U-15リーグ</td>
                {sorted.map((t, i) => {
                  const s = t.standings.find((s) => s.ageGroup === "U15");
                  return cell(
                    s ? (
                      <div>
                        <div className="text-xs text-gray-500">{s.leagueName}</div>
                        {s.rank != null && <div className="font-bold text-gray-900">{s.rank}位</div>}
                        <div className="text-xs text-gray-400">{s.points}pt</div>
                      </div>
                    ) : <Minus size={14} className="text-gray-300 mx-auto" />,
                    i === 0
                  );
                })}
              </tr>

              {/* 募集情報 */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 font-medium">募集情報</td>
                {sorted.map((t, i) => cell(
                  t._count.recruitments > 0
                    ? <span className="text-brand-600 font-medium">{t._count.recruitments}件</span>
                    : <span className="text-gray-300 text-xs">なし</span>,
                  i === 0
                ))}
              </tr>

              {/* 公式サイト */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 font-medium">公式サイト</td>
                {sorted.map((t, i) => cell(
                  t.officialSiteUrl
                    ? <a href={t.officialSiteUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline flex items-center justify-center gap-1"><ExternalLink size={12} />開く</a>
                    : <Minus size={14} className="text-gray-300 mx-auto" />,
                  i === 0
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          {sorted.map((t) => (
            <Link
              key={t.id}
              href={`/teams/${t.id}`}
              className="text-sm text-brand-600 hover:underline"
            >
              {t.name}の詳細 →
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
