import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SENT: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export default async function NotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">通知履歴</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-sm text-gray-500">
          直近100件
        </div>
        {notifications.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400">通知履歴がありません</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <div key={n.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-gray-900 text-sm">{n.title}</div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[n.status]}`}>
                      {n.status}
                    </span>
                    <span className="text-xs text-gray-400">{formatDateTime(n.createdAt)}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 whitespace-pre-wrap">{n.message}</div>
                {n.targetUrl && (
                  <a href={n.targetUrl} target="_blank" rel="noopener noreferrer"
                    className="text-brand-600 hover:underline text-xs mt-1 block">
                    {n.targetUrl}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
