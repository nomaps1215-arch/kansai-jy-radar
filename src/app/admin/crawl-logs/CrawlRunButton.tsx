"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";

export default function CrawlRunButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleRun() {
    if (!window.confirm("クロールパイプライン（A→B→C→通知）を今すぐ実行しますか？")) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/cron/crawl", { method: "POST" });
      const data = await res.json();

      if (data.ok) {
        setResult({ ok: true, msg: data.log?.join(" | ") ?? "完了" });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setResult({ ok: false, msg: data.error ?? "エラー" });
      }
    } catch {
      setResult({ ok: false, msg: "実行に失敗しました" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleRun}
        disabled={loading}
        className="flex items-center gap-2 bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
        {loading ? "実行中..." : "今すぐクロール実行"}
      </button>
      {result && (
        <div
          className={`text-xs rounded px-3 py-1.5 max-w-lg text-right ${
            result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {result.msg}
        </div>
      )}
    </div>
  );
}
