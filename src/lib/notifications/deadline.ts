/**
 * 締切通知モジュール
 *
 * 毎日のcrawl cronから呼び出し、
 * - 未通知のCONFIRMED募集情報の新着通知
 * - 締切1日前・3日前・7日前の通知
 * を送信する
 */
import { prisma } from '@/lib/prisma'
import { notifyNewRecruitment, notifyDeadlineApproaching } from './line'

export async function runDeadlineNotifications(): Promise<{ sent: number }> {
  const now = new Date()
  let sent = 0

  // ── 1. 未通知のCONFIRMED募集情報を通知 ───────────────────────
  const newlyConfirmed = await prisma.recruitment.findMany({
    where: {
      status: 'CONFIRMED',
      publishedAt: { not: null },
    },
    include: { team: true },
    take: 20,
    orderBy: { publishedAt: 'desc' },
  })

  for (const r of newlyConfirmed) {
    const alreadyNotified = await prisma.notification.findFirst({
      where: {
        title: { contains: r.id },
        notificationType: 'NEW_RECRUITMENT',
      },
    })
    if (alreadyNotified) continue

    const notified = await notifyNewRecruitment({
      teamName: r.team.name,
      prefecture: r.team.prefecture,
      recruitmentType: r.recruitmentType,
      title: r.title,
      eventDate: r.eventDate?.toISOString().split('T')[0] ?? null,
      venue: r.venue,
      deadline: r.applicationDeadline?.toISOString().split('T')[0] ?? null,
      url: r.applicationUrl ?? r.sourceUrl,
      confidence: r.confidenceLabel,
    })

    if (notified) {
      await prisma.notification.create({
        data: {
          notificationType: 'NEW_RECRUITMENT',
          title: `${r.id}: ${r.team.name}`,
          message: r.title,
          targetUrl: r.applicationUrl ?? r.sourceUrl ?? null,
          status: 'SENT',
          sentAt: now,
        },
      })
      sent++
    }
  }

  // ── 2. 締切迫る通知 ───────────────────────────────────────────
  const deadlineThresholds = [1, 3, 7]

  for (const days of deadlineThresholds) {
    const targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() + days)
    const dateStr = targetDate.toISOString().split('T')[0]

    const approaching = await prisma.recruitment.findMany({
      where: {
        status: 'CONFIRMED',
        applicationDeadline: {
          gte: new Date(`${dateStr}T00:00:00`),
          lt: new Date(`${dateStr}T23:59:59`),
        },
      },
      include: { team: true },
    })

    for (const r of approaching) {
      const notifType = days === 1 ? 'DEADLINE_1DAY' : days === 3 ? 'DEADLINE_3DAYS' : 'DEADLINE_7DAYS'

      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          title: { contains: r.id },
          notificationType: notifType as any,
        },
      })
      if (alreadyNotified) continue

      const notified = await notifyDeadlineApproaching({
        teamName: r.team.name,
        title: r.title,
        deadline: dateStr,
        daysLeft: days,
        url: r.applicationUrl ?? r.sourceUrl,
      })

      if (notified) {
        await prisma.notification.create({
          data: {
            notificationType: notifType as any,
            title: `${r.id}: 締切${days}日前`,
            message: r.title,
            targetUrl: r.applicationUrl ?? r.sourceUrl ?? null,
            status: 'SENT',
            sentAt: now,
          },
        })
        sent++
      }
    }
  }

  return { sent }
}
