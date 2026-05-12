const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push'
const LINE_BROADCAST_URL = 'https://api.line.me/v2/bot/message/broadcast'

interface LineMessage {
  type: 'text' | 'flex'
  text?: string
  altText?: string
  contents?: unknown
}

async function push(messages: LineMessage[]): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const userId = process.env.LINE_USER_ID
  if (!token) return false

  const endpoint = userId ? LINE_PUSH_URL : LINE_BROADCAST_URL
  const body = userId
    ? { to: userId, messages }
    : { messages }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    return res.ok
  } catch (e) {
    console.error('LINE push error:', e)
    return false
  }
}

// 新着募集情報の通知
export async function notifyNewRecruitment(params: {
  teamName: string
  prefecture: string
  recruitmentType: string
  title: string
  eventDate?: string | null
  venue?: string | null
  deadline?: string | null
  url?: string | null
  confidence: string
}): Promise<boolean> {
  const typeLabel: Record<string, string> = {
    SELECTION: 'セレクション',
    TRIAL: '体験練習会',
    BRIEFING: '説明会',
    GENERAL: '募集情報',
  }
  const confLabel: Record<string, string> = {
    A: '【公式★★★】',
    B: '【協会★★☆】',
    C: '【第三者★☆☆】',
    D: '【AI推定☆☆☆】',
  }

  const lines = [
    `⚽ ${confLabel[params.confidence] ?? ''} 新着${typeLabel[params.recruitmentType] ?? '募集情報'}`,
    ``,
    `🏟 ${params.teamName}（${params.prefecture}）`,
    params.title ? `📋 ${params.title}` : null,
    params.eventDate ? `📅 開催日: ${params.eventDate}` : null,
    params.venue ? `📍 会場: ${params.venue}` : null,
    params.deadline ? `⏰ 締切: ${params.deadline}` : null,
    params.url ? `🔗 ${params.url}` : null,
    ``,
    `→ 管理画面で確認・承認してください`,
  ].filter((l) => l !== null).join('\n')

  return push([{ type: 'text', text: lines }])
}

// 締切迫る警告通知
export async function notifyDeadlineApproaching(params: {
  teamName: string
  title: string
  deadline: string
  daysLeft: number
  url?: string | null
}): Promise<boolean> {
  const urgency = params.daysLeft <= 1 ? '🚨 明日締切！' : params.daysLeft <= 3 ? '⚠️ 3日以内締切' : '📌 1週間以内締切'

  const lines = [
    `${urgency}`,
    ``,
    `${params.teamName}`,
    `${params.title}`,
    `締切: ${params.deadline}（残り${params.daysLeft}日）`,
    params.url ? `🔗 ${params.url}` : null,
  ].filter((l) => l !== null).join('\n')

  return push([{ type: 'text', text: lines }])
}

// システム通知（クロールエラー等）
export async function notifySystem(message: string): Promise<boolean> {
  return push([{ type: 'text', text: `🤖 システム通知\n\n${message}` }])
}

// 登録サブスクライバーへの一斉通知
export async function notifySubscribers(
  prefecture: string,
  messages: LineMessage[]
): Promise<number> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return 0

  // 動的importでPrismaを使用（Edge環境対応）
  const { prisma } = await import('@/lib/prisma')
  const subs = await prisma.lineSubscription.findMany({
    where: {
      isActive: true,
      OR: [
        { prefectures: { isEmpty: true } }, // 全関西
        { prefectures: { has: prefecture } },
      ],
    },
    select: { lineUserId: true },
  })

  let sent = 0
  for (const sub of subs) {
    try {
      const res = await fetch(LINE_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: sub.lineUserId, messages }),
      })
      if (res.ok) sent++
    } catch {
      // 個別エラーはスキップ
    }
  }
  return sent
}
