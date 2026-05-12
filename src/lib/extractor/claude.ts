import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ExtractedRecruitment } from '@/lib/crawler/types'

let _client: GoogleGenerativeAI | null = null
function getClient(): GoogleGenerativeAI {
  if (!_client) _client = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
  return _client
}

const SYSTEM_PROMPT = `あなたはサッカーのジュニアユース（U-15・中学生年代）の募集情報を抽出するエキスパートです。
与えられたテキストから、セレクション・体験練習会・入団募集に関する情報を正確にJSONで返してください。
情報が存在しない項目はnullにしてください。JSONのみを返してください。マークダウンのコードブロックは使わないでください。`

export async function extractRecruitmentInfo(
  text: string,
  url: string,
  teamName: string
): Promise<ExtractedRecruitment> {
  if (!process.env.GOOGLE_GEMINI_API_KEY) return { found: false }

  const year = new Date().getFullYear()

  const prompt = `${SYSTEM_PROMPT}

チーム名: ${teamName}
URL: ${url}

以下のテキストから、ジュニアユース（U-15・中学生）のセレクション・体験練習会・入団募集情報を抽出してください。

テキスト:
${text.slice(0, 8000)}

以下のJSON形式で回答してください:
{
  "found": true または false,
  "title": "タイトル（例: 2027年度ジュニアユースセレクション）",
  "recruitmentType": "SELECTION" | "TRIAL" | "BRIEFING" | "GENERAL",
  "targetGrade": "対象学年（例: 小学6年生、中学1年生）",
  "eventDates": ["${year}-MM-DD"],
  "venue": "会場名",
  "address": "住所",
  "applicationDeadline": "${year}-MM-DD",
  "applicationUrl": "申込URL（あれば）",
  "fee": "参加費（例: 無料、1000円）",
  "capacity": "定員・募集人数",
  "targetPositions": "募集ポジション",
  "isGkRecruiting": true または false,
  "summary": "30文字以内の一言要約",
  "confidence": "A"（公式）| "B"（協会）| "C"（第三者）| "D"（推定）
}

recruitmentTypeの定義:
- SELECTION: セレクション・セレクト・スカウト
- TRIAL: 体験練習会・体験会・練習参加
- BRIEFING: 説明会・保護者説明会・見学会
- GENERAL: その他の入団募集情報`

  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const raw = result.response.text()
    const match = raw.match(/\{[\s\S]+\}/)
    if (!match) return { found: false }

    const parsed = JSON.parse(match[0]) as ExtractedRecruitment
    return parsed
  } catch (e) {
    console.error('Gemini extraction error:', e)
    return { found: false }
  }
}

export interface ExtractedTeamInfo {
  monthlyFee: string | null
  practiceDays: string | null
}

export async function extractTeamInfo(
  text: string,
  url: string,
  teamName: string
): Promise<ExtractedTeamInfo> {
  if (!process.env.GOOGLE_GEMINI_API_KEY) return { monthlyFee: null, practiceDays: null }

  const prompt = `あなたはサッカーチームの情報を抽出するエキスパートです。
与えられたテキストから以下の2項目のみ抽出してください。
情報が見つからない・不明確な場合は必ずnullにしてください。推測は厳禁です。JSONのみを返してください。マークダウンのコードブロックは使わないでください。

チーム名: ${teamName}
URL: ${url}

テキスト:
${text.slice(0, 8000)}

以下のJSON形式で回答してください:
{
  "monthlyFee": "月謝・月会費の金額（例: 月10,000円、月8,000円〜12,000円）。記載がなければnull",
  "practiceDays": "練習曜日（例: 火・木・土、毎週火曜・木曜・土曜）。記載がなければnull"
}`

  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const raw = result.response.text()
    const match = raw.match(/\{[\s\S]+\}/)
    if (!match) return { monthlyFee: null, practiceDays: null }
    return JSON.parse(match[0]) as ExtractedTeamInfo
  } catch (e) {
    console.error('Gemini team info extraction error:', e)
    return { monthlyFee: null, practiceDays: null }
  }
}

export async function quickCheck(text: string, teamName: string): Promise<boolean> {
  if (!process.env.GOOGLE_GEMINI_API_KEY) return false

  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(
      `以下のテキストに「${teamName}」のジュニアユースU-15の募集・セレクション・体験練習会情報が含まれますか？「YES」か「NO」のみ答えてください。\n\n${text.slice(0, 2000)}`
    )
    const answer = result.response.text().trim()
    return answer.toUpperCase().includes('YES')
  } catch {
    return false
  }
}
