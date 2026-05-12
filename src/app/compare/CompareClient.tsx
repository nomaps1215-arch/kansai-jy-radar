"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

export function AddToCompareButton({ teamId, teamName }: { teamId: string; teamName: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  const isAdded = ids.includes(teamId);
  const isFull = ids.length >= 3;

  function toggle() {
    let next: string[];
    if (isAdded) {
      next = ids.filter((id) => id !== teamId);
    } else {
      if (isFull) return;
      next = [...ids, teamId];
    }
    if (next.length === 0) {
      router.push("/teams");
    } else {
      router.push(`/teams?compareIds=${next.join(",")}`);
    }
  }

  return (
    <button
      onClick={toggle}
      title={isAdded ? "比較から外す" : isFull ? "比較は3チームまで" : "比較に追加"}
      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
        isAdded
          ? "bg-brand-600 text-white border-brand-600"
          : isFull
          ? "text-gray-300 border-gray-200 cursor-not-allowed"
          : "text-brand-600 border-brand-200 hover:bg-brand-50"
      }`}
    >
      {isAdded ? "✓ 比較中" : "比較+"}
    </button>
  );
}

export function CompareBar({ compareIds }: { compareIds: string[] }) {
  const router = useRouter();
  if (compareIds.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">{compareIds.length}チームを選択中</span>
          {compareIds.length >= 2 && (
            <button
              onClick={() => router.push(`/compare?ids=${compareIds.join(",")}`)}
              className="bg-brand-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              比較する →
            </button>
          )}
          {compareIds.length < 2 && (
            <span className="text-gray-400">あと{2 - compareIds.length}チーム選択してください</span>
          )}
        </div>
        <button
          onClick={() => router.push("/teams")}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
