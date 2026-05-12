export interface FetchResult {
  url: string
  title: string
  text: string
  hash: string
  statusCode: number
  durationMs: number
  error?: string
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  hostname: string
}

export interface ExtractedRecruitment {
  found: boolean
  title?: string
  recruitmentType?: 'SELECTION' | 'TRIAL' | 'BRIEFING' | 'GENERAL'
  targetGrade?: string
  eventDates?: string[]
  venue?: string
  address?: string
  applicationDeadline?: string
  applicationUrl?: string
  fee?: string
  capacity?: string
  targetPositions?: string
  isGkRecruiting?: boolean
  summary?: string
  confidence?: 'A' | 'B' | 'C' | 'D'
}
