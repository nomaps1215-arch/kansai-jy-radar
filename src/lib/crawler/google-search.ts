import type { SearchResult } from './types'

const BASE_URL = 'https://www.googleapis.com/customsearch/v1'

// Google Custom Search API でチームの募集情報を横断検索
// 公式サイト・Instagram・ブログ・ニュースを一網打尽にする
export async function searchTeamRecruitment(
  teamName: string,
  prefecture: string
): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  if (!apiKey || !engineId) {
    console.warn('Google Search API keys not configured')
    return []
  }

  const year = new Date().getFullYear()
  const queries = [
    // ウェブ全体を対象にキーワード検索
    `"${teamName}" (セレクション OR 体験練習会 OR 入団募集) ${year}`,
    // Instagram投稿を直接検索
    `site:instagram.com "${teamName}" (セレクション OR 体験練習会 OR 入団)`,
    // X(Twitter)投稿を直接検索
    `site:x.com OR site:twitter.com "${teamName}" ジュニアユース セレクション`,
  ]

  const seen = new Set<string>()
  const results: SearchResult[] = []

  for (const query of queries) {
    try {
      const url = new URL(BASE_URL)
      url.searchParams.set('key', apiKey)
      url.searchParams.set('cx', engineId)
      url.searchParams.set('q', query)
      url.searchParams.set('lr', 'lang_ja')
      url.searchParams.set('num', '10')
      url.searchParams.set('dateRestrict', 'm6') // 直近6ヶ月

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue

      const data = await res.json()
      if (!data.items) continue

      for (const item of data.items) {
        if (seen.has(item.link)) continue
        seen.add(item.link)
        results.push({
          title: item.title ?? '',
          url: item.link,
          snippet: item.snippet ?? '',
          hostname: new URL(item.link).hostname,
        })
      }
    } catch (e) {
      console.error(`Google search error [${teamName}]:`, e)
    }
  }

  return results
}

// URLの種別を判定（信頼度スコアに使用）
export function classifySourceUrl(url: string): {
  sourceType: string
  confidence: 'A' | 'B' | 'C' | 'D'
} {
  const host = (() => { try { return new URL(url).hostname } catch { return '' } })()

  if (host.includes('instagram.com')) return { sourceType: 'INSTAGRAM', confidence: 'A' }
  if (host.includes('twitter.com') || host.includes('x.com')) return { sourceType: 'X', confidence: 'A' }
  if (host.includes('facebook.com')) return { sourceType: 'FACEBOOK', confidence: 'A' }
  if (host.includes('jfa.jp') || host.includes('-fa.or.jp') || host.includes('-fa.gr.jp'))
    return { sourceType: 'ASSOCIATION', confidence: 'B' }
  if (host.includes('juniorsoccer-news.com') || host.includes('greencard'))
    return { sourceType: 'NEWS_PAGE', confidence: 'C' }

  return { sourceType: 'OFFICIAL_SITE', confidence: 'A' }
}
