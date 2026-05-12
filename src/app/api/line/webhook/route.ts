export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type LineEvent = {
  type: string
  source: { userId: string }
  message?: { type: string; text: string }
  replyToken?: string
}

async function replyMessage(replyToken: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const events: LineEvent[] = body.events ?? []

  for (const event of events) {
    const userId = event.source?.userId
    if (!userId) continue

    // フォロー（友だち追加）
    if (event.type === "follow") {
      await prisma.lineSubscription.upsert({
        where: { lineUserId: userId },
        update: { isActive: true },
        create: { lineUserId: userId, prefectures: [], teamIds: [] },
      })
      if (event.replyToken) {
        await replyMessage(
          event.replyToken,
          "関西ジュニアユース進路レーダーへようこそ！\n\nセレクション・体験練習会の新着情報をお届けします。\n\n「設定」と送ると通知する都道府県を変更できます。\n（デフォルト：関西全域）"
        )
      }
    }

    // ブロック（友だち削除）
    if (event.type === "unfollow") {
      await prisma.lineSubscription.updateMany({
        where: { lineUserId: userId },
        data: { isActive: false },
      })
    }

    // テキストメッセージ
    if (event.type === "message" && event.message?.type === "text" && event.replyToken) {
      const text = event.message.text.trim()

      if (text === "設定" || text === "通知設定") {
        await replyMessage(
          event.replyToken,
          "通知する都道府県を送ってください。\n例：「大阪府」「兵庫県 京都府」\n\n「全関西」と送ると全府県の通知を受け取れます。"
        )
      } else if (text === "全関西" || text === "全て" || text === "すべて") {
        await prisma.lineSubscription.updateMany({
          where: { lineUserId: userId },
          data: { prefectures: [] },
        })
        await replyMessage(event.replyToken, "関西全域の通知に設定しました✅")
      } else {
        // 都道府県名を検出
        const prefList = ["大阪府", "兵庫県", "京都府", "奈良県", "滋賀県", "和歌山県"]
        const matched = prefList.filter((p) => text.includes(p))
        if (matched.length > 0) {
          await prisma.lineSubscription.updateMany({
            where: { lineUserId: userId },
            data: { prefectures: matched },
          })
          await replyMessage(
            event.replyToken,
            `${matched.join("・")}の通知に設定しました✅`
          )
        } else {
          await replyMessage(
            event.replyToken,
            "「設定」と送ると通知する都道府県を変更できます。\n「全関西」で関西全域を受け取れます。"
          )
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
