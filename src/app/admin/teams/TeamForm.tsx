"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Team, TeamCategory } from "@prisma/client";
import { PREFECTURES, TEAM_CATEGORY_LABELS } from "@/lib/utils";
import { Sparkles } from "lucide-react";

type Props = {
  team?: Team;
};

export default function TeamForm({ team }: Props) {
  const router = useRouter();
  const isEdit = !!team;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState<string | null>(null);
  const [monthlyFee, setMonthlyFee] = useState(team?.monthlyFee ?? "");
  const [practiceDays, setPracticeDays] = useState(team?.practiceDays ?? "");

  async function handleExtractInfo() {
    if (!team?.id) return;
    setExtracting(true);
    setExtractMsg(null);
    try {
      const res = await fetch(`/api/teams/${team.id}/extract-info`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setExtractMsg(data.error ?? "取得に失敗しました");
        return;
      }
      if (data.monthlyFee) setMonthlyFee(data.monthlyFee);
      if (data.practiceDays) setPracticeDays(data.practiceDays);
      if (data.monthlyFee || data.practiceDays) {
        setExtractMsg("取得しました。内容を確認して保存してください。");
      } else {
        setExtractMsg("公式サイトから情報を取得できませんでした。");
      }
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name") as string,
      nameKana: formData.get("nameKana") as string || null,
      prefecture: formData.get("prefecture") as string,
      city: formData.get("city") as string || null,
      category: formData.get("category") as TeamCategory,
      league: formData.get("league") as string || null,
      trainingArea: formData.get("trainingArea") as string || null,
      homeGround: formData.get("homeGround") as string || null,
      monthlyFee: monthlyFee || null,
      practiceDays: practiceDays || null,
      officialSiteUrl: formData.get("officialSiteUrl") as string || null,
      instagramUrl: formData.get("instagramUrl") as string || null,
      xUrl: formData.get("xUrl") as string || null,
      facebookUrl: formData.get("facebookUrl") as string || null,
      isActive: formData.get("isActive") === "true",
      memo: formData.get("memo") as string || null,
    };

    try {
      const url = isEdit ? `/api/teams/${team.id}` : "/api/teams";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "保存に失敗しました");
        return;
      }

      router.push("/admin/teams");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  const field = (
    label: string,
    name: string,
    opts: {
      required?: boolean;
      placeholder?: string;
      type?: string;
      defaultValue?: string | null;
    } = {}
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {opts.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={opts.type ?? "text"}
        name={name}
        defaultValue={opts.defaultValue ?? ""}
        required={opts.required}
        placeholder={opts.placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* 基本情報 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
            基本情報
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("チーム名", "name", {
              required: true,
              placeholder: "例: FC大阪ジュニアユース",
              defaultValue: team?.name,
            })}
            {field("チーム名（カナ）", "nameKana", {
              placeholder: "例: エフシーオオサカジュニアユース",
              defaultValue: team?.nameKana,
            })}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                都道府県 <span className="text-red-500">*</span>
              </label>
              <select
                name="prefecture"
                required
                defaultValue={team?.prefecture ?? ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">選択してください</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            {field("市区町村", "city", {
              placeholder: "例: 大阪市北区",
              defaultValue: team?.city,
            })}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                name="category"
                defaultValue={team?.category ?? "CLUB"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {(Object.keys(TEAM_CATEGORY_LABELS) as TeamCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {TEAM_CATEGORY_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            {field("リーグ", "league", {
              placeholder: "例: 高円宮杯U-15関西リーグ",
              defaultValue: team?.league,
            })}
            {field("活動エリア（練習場所）", "trainingArea", {
              placeholder: "例: 大阪市内、○○グラウンド",
              defaultValue: team?.trainingArea,
            })}
            {field("ホームグラウンド", "homeGround", {
              placeholder: "例: ○○スポーツパーク",
              defaultValue: team?.homeGround,
            })}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  月謝・月会費
                </label>
                {isEdit && (
                  <button
                    type="button"
                    onClick={handleExtractInfo}
                    disabled={extracting}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 disabled:opacity-50"
                  >
                    <Sparkles size={12} />
                    {extracting ? "取得中..." : "公式サイトから自動取得"}
                  </button>
                )}
              </div>
              <input
                type="text"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                placeholder="例: 月10,000円、要問合せ"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {extractMsg && (
                <p className="text-xs text-green-600 mt-1">{extractMsg}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                練習曜日
              </label>
              <input
                type="text"
                value={practiceDays}
                onChange={(e) => setPracticeDays(e.target.value)}
                placeholder="例: 火・木・土、毎週火曜・木曜・土曜"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* SNS/URL */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
            公式URL・SNS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("公式サイトURL", "officialSiteUrl", {
              type: "url",
              placeholder: "https://...",
              defaultValue: team?.officialSiteUrl,
            })}
            {field("Instagram URL", "instagramUrl", {
              type: "url",
              placeholder: "https://www.instagram.com/...",
              defaultValue: team?.instagramUrl,
            })}
            {field("X(Twitter) URL", "xUrl", {
              type: "url",
              placeholder: "https://x.com/...",
              defaultValue: team?.xUrl,
            })}
            {field("Facebook URL", "facebookUrl", {
              type: "url",
              placeholder: "https://www.facebook.com/...",
              defaultValue: team?.facebookUrl,
            })}
          </div>
        </div>

        {/* その他 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
            その他
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                有効/無効
              </label>
              <select
                name="isActive"
                defaultValue={team?.isActive === false ? "false" : "true"}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="true">有効</option>
                <option value="false">無効</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メモ
              </label>
              <textarea
                name="memo"
                defaultValue={team?.memo ?? ""}
                rows={3}
                placeholder="内部メモ..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "保存中..." : isEdit ? "更新する" : "登録する"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-300 text-gray-700 rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </form>
  );
}
