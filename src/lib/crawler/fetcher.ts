import * as crypto from 'crypto'
import type { FetchResult } from './types'

const RECRUITMENT_KEYWORDS = [
  'セレクション', '体験練習会', '体験会', '練習会', '入団', '募集',
  'セレクト', 'トライアウト', '説明会', '見学会', '特待', 'スカウト',
  'ジュニアユース', 'U-15', 'U15',
]

export async function fetchPage(url: string): Promise<FetchResult> {
  const start = Date.now()
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      signal: AbortSignal.timeout(20000),
    })

    const html = await response.text()
    const text = htmlToText(html)
    const title = extractTitle(html)
    const hash = crypto.createHash('sha256').update(text.slice(0, 20000)).digest('hex')

    return {
      url,
      title,
      text: text.slice(0, 50000),
      hash,
      statusCode: response.status,
      durationMs: Date.now() - start,
    }
  } catch (error) {
    return {
      url,
      title: '',
      text: '',
      hash: '',
      statusCode: 0,
      durationMs: Date.now() - start,
      error: String(error),
    }
  }
}

export function containsRecruitmentKeyword(text: string): boolean {
  return RECRUITMENT_KEYWORDS.some((kw) => text.includes(kw))
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)
  return m ? decodeHtmlEntities(m[1].trim()) : ''
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|h[1-6]|li|tr|td|th|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}
