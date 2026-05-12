"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Edit, RefreshCw } from "lucide-react";

export default function PendingActions({
  recruitmentId,
}: {
  recruitmentId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function updateStatus(
    status: "CONFIRMED" | "PENDING" | "REJECTED",
    note?: string
  ) {
    setLoading(true);
    try {
      const res = await fetch(`/api/recruitments/${recruitmentId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-sm text-green-600 font-medium">
        ✓ 更新しました
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap border-t border-gray-100 pt-3">
      <button
        onClick={() => updateStatus("CONFIRMED")}
        disabled={loading}
        className="flex items-center gap-1.5 bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        <CheckCircle size={13} />確認済みにする
      </button>
      <button
        onClick={() => updateStatus("PENDING")}
        disabled={loading}
        className="flex items-center gap-1.5 bg-yellow-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors"
      >
        <Clock size={13} />保留
      </button>
      <button
        onClick={() => updateStatus("REJECTED", "誤情報として却下")}
        disabled={loading}
        className="flex items-center gap-1.5 bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        <XCircle size={13} />誤情報
      </button>
      <Link
        href={`/admin/recruitments/${recruitmentId}/edit`}
        className="flex items-center gap-1.5 border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors"
      >
        <Edit size={13} />手動編集
      </Link>
    </div>
  );
}
