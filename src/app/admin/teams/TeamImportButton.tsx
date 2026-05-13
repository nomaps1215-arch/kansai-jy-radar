"use client";

import { useRef, useState } from "react";
import { Upload, RefreshCw } from "lucide-react";

type Mode = "add" | "reset";

export default function TeamImportButton() {
  const addRef = useRef<HTMLInputElement>(null);
  const resetRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleFile(file: File, mode: Mode) {
    if (
      mode === "reset" &&
      !window.confirm(
        "既存のチームデータを全て削除してから再登録します。\nよろしいですか？"
      )
    )
      return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    if (mode === "reset") formData.append("clearFirst", "true");

    try {
      const res = await fetch("/api/teams/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        const deletedMsg = data.deleted > 0 ? `${data.deleted}件削除→` : "";
        setResult({
          ok: true,
          msg: `✓ ${deletedMsg}${data.created}件登録、${data.skipped}件スキップ`,
        });
        setTimeout(() => window.location.reload(), 1800);
      } else {
        setResult({ ok: false, msg: `エラー: ${data.error}` });
      }
    } catch {
      setResult({ ok: false, msg: "インポートに失敗しました" });
    } finally {
      setLoading(false);
      if (addRef.current) addRef.current.value = "";
      if (resetRef.current) resetRef.current.value = "";
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* 追加インポート */}
      <button
        onClick={() => addRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Upload size={16} />
        {loading ? "処理中..." : "CSVインポート"}
      </button>
      <input
        ref={addRef}
        type="file"
        accept=".csv"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f, "add");
        }}
        className="hidden"
      />

      {/* データ一新ボタン */}
      <button
        onClick={() => resetRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 border border-red-300 text-red-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <RefreshCw size={16} />
        {loading ? "処理中..." : "データ一新"}
      </button>
      <input
        ref={resetRef}
        type="file"
        accept=".csv"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f, "reset");
        }}
        className="hidden"
      />

      {result && (
        <div
          className={`absolute top-10 right-0 border rounded-lg shadow-lg px-4 py-2 text-sm whitespace-nowrap z-10 bg-white ${
            result.ok
              ? "border-green-200 text-green-700"
              : "border-red-200 text-red-600"
          }`}
        >
          {result.msg}
        </div>
      )}
    </div>
  );
}
