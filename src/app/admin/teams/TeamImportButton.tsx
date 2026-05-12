"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

export default function TeamImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/teams/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`✓ ${data.created}件登録、${data.skipped}件スキップ`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setResult(`エラー: ${data.error}`);
      }
    } catch {
      setResult("インポートに失敗しました");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Upload size={16} />
        {loading ? "インポート中..." : "CSVインポート"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleChange}
        className="hidden"
      />
      {result && (
        <div className="absolute top-10 right-0 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2 text-sm whitespace-nowrap z-10">
          {result}
        </div>
      )}
    </div>
  );
}
