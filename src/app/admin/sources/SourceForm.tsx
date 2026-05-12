"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SourceType, TeamSource } from "@prisma/client";
import { SOURCE_TYPE_LABELS } from "@/lib/utils";

type TeamOption = { id: string; name: string; prefecture: string };

type Props = {
  teams: TeamOption[];
  source?: TeamSource;
  defaultTeamId?: string;
};

export default function SourceForm({ teams, source, defaultTeamId }: Props) {
  const router = useRouter();
  const isEdit = !!source;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const body = {
      teamId: formData.get("teamId") as string,
      sourceType: formData.get("sourceType") as SourceType,
      url: formData.get("url") as string,
      crawlEnabled: formData.get("crawlEnabled") === "true",
      crawlIntervalHours: Number(formData.get("crawlIntervalHours")),
    };

    try {
      const url = isEdit ? `/api/sources/${source.id}` : "/api/sources";
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

      router.push("/admin/sources");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!source || !confirm("このソースURLを削除しますか？")) return;
    setLoading(true);
    try {
      await fetch(`/api/sources/${source.id}`, { method: "DELETE" });
      router.push("/admin/sources");
      router.refresh();
    } catch {
      setError("削除に失敗しました");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            チーム <span className="text-red-500">*</span>
          </label>
          <select
            name="teamId"
            required
            defaultValue={source?.teamId ?? defaultTeamId ?? ""}
            disabled={isEdit}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50"
          >
            <option value="">選択してください</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.prefecture} {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ソース種別 <span className="text-red-500">*</span>
          </label>
          <select
            name="sourceType"
            required
            defaultValue={source?.sourceType ?? "OFFICIAL_SITE"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map((k) => (
              <option key={k} value={k}>
                {SOURCE_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            name="url"
            required
            defaultValue={source?.url ?? ""}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              巡回有効/無効
            </label>
            <select
              name="crawlEnabled"
              defaultValue={source?.crawlEnabled === false ? "false" : "true"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="true">有効</option>
              <option value="false">無効</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              巡回間隔（時間）
            </label>
            <select
              name="crawlIntervalHours"
              defaultValue={String(source?.crawlIntervalHours ?? 6)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="1">1時間</option>
              <option value="3">3時間</option>
              <option value="6">6時間</option>
              <option value="12">12時間</option>
              <option value="24">24時間</option>
              <option value="72">72時間</option>
            </select>
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
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="ml-auto border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              削除
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
