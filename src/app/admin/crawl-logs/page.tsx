import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";
import CrawlRunButton from "./CrawlRunButton";

export const dynamic = "force-dynamic";

export default async function CrawlLogsPage() {
  const logs = await prisma.crawlLog.findMany({
    orderBy: { checkedAt: "desc" },
    take: 200,
    include: {
      source: {
        include: {
          team: { select: { name: true, prefecture: true } },
        },
      },
    },
  });

  const statusIcon = {
    SUCCESS: <CheckCircle size={14} className="text-green-500" />,
    FAILED: <XCircle size={14} className="text-red-500" />,
    SKIPPED: <MinusCircle size={14} className="text-gray-400" />,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">クロールログ</h1>
        <CrawlRunButton />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-sm text-gray-500">
          直近200件
        </div>
        {logs.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400">ログがありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">日時</th>
                  <th className="px-4 py-3 text-left">チーム</th>
                  <th className="px-4 py-3 text-left">URL</th>
                  <th className="px-4 py-3 text-center">ステータス</th>
                  <th className="px-4 py-3 text-center">HTTP</th>
                  <th className="px-4 py-3 text-center">時間(ms)</th>
                  <th className="px-4 py-3 text-left">エラー</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {formatDateTime(log.checkedAt)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-xs text-gray-400">{log.source.team.prefecture}</div>
                      <div className="text-sm text-gray-800">{log.source.team.name}</div>
                    </td>
                    <td className="px-4 py-2">
                      <a href={log.source.url} target="_blank" rel="noopener noreferrer"
                        className="text-brand-600 hover:underline text-xs truncate block max-w-xs">
                        {log.source.url}
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {statusIcon[log.status]}
                        <span className="text-xs">{log.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center text-xs text-gray-600">
                      {log.httpStatus ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-center text-xs text-gray-600">
                      {log.durationMs ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-xs text-red-500 max-w-xs truncate">
                      {log.errorMessage ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
