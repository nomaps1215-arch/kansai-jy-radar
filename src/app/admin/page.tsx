export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  XCircle,
  Globe,
} from "lucide-react";
import { RunPipelineButton } from "./sources/CrawlButton";

async function getDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    todayDetected,
    pendingCount,
    deadlineSoon,
    crawlFailures,
    highConfidenceNew,
    publishedCount,
    recentPending,
  ] = await Promise.all([
    prisma.recruitment.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.recruitment.count({
      where: { status: { in: ["DETECTED", "PENDING"] } },
    }),
    prisma.recruitment.count({
      where: {
        status: "CONFIRMED",
        applicationDeadline: { gte: now, lte: sevenDaysLater },
      },
    }),
    prisma.crawlLog.count({
      where: {
        status: "FAILED",
        checkedAt: { gte: todayStart },
      },
    }),
    prisma.recruitment.count({
      where: {
        confidenceLabel: "A",
        status: "DETECTED",
        createdAt: { gte: todayStart },
      },
    }),
    prisma.recruitment.count({
      where: { status: "CONFIRMED", publishedAt: { not: null } },
    }),
    prisma.recruitment.findMany({
      where: { status: { in: ["DETECTED", "PENDING"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { team: { select: { name: true } } },
    }),
  ]);

  return {
    todayDetected,
    pendingCount,
    deadlineSoon,
    crawlFailures,
    highConfidenceNew,
    publishedCount,
    recentPending,
  };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  const cards = [
    {
      label: "本日の新規検知",
      value: stats.todayDetected,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/admin/pending",
    },
    {
      label: "未確認件数",
      value: stats.pendingCount,
      icon: AlertCircle,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      href: "/admin/pending",
    },
    {
      label: "締切7日以内",
      value: stats.deadlineSoon,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/admin/recruitments?filter=deadline_soon",
    },
    {
      label: "クロール失敗（本日）",
      value: stats.crawlFailures,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      href: "/admin/crawl-logs",
    },
    {
      label: "信頼度A 新着",
      value: stats.highConfidenceNew,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/admin/pending?confidence=A",
    },
    {
      label: "公開中募集件数",
      value: stats.publishedCount,
      icon: Globe,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/recruitments?status=CONFIRMED",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <RunPipelineButton />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={`${card.bg} p-2 rounded-lg`}>
                <card.icon size={18} className={card.color} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{card.value}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">未確認情報（直近5件）</h2>
          <Link
            href="/admin/pending"
            className="text-sm text-brand-600 hover:underline"
          >
            すべて見る →
          </Link>
        </div>
        {stats.recentPending.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            未確認の情報はありません
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.recentPending.map((r) => (
              <Link
                key={r.id}
                href={`/admin/recruitments/${r.id}/edit`}
                className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div>
                  <span className="font-medium text-sm text-gray-900">
                    {r.team.name}
                  </span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="text-sm text-gray-600">{r.title}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDate(r.createdAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
