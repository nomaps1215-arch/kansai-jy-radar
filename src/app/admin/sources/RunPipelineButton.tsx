'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export function RunPipelineButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [summary, setSummary] = useState('')

  async function run() {
    setState('loading')
    setSummary('')
    try {
      const res = await fetch('/api/crawl/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'all' }),
      })
      const data = await res.json()
      if (data.ok) {
        setState('done')
        setSummary(`新規発見: ${data.search?.newUrls ?? 0}件 / AI抽出: ${data.extract?.found ?? 0}件`)
      } else {
        setState('error')
        setSummary(data.error ?? 'エラー')
      }
    } catch {
      setState('error')
      setSummary('通信エラー')
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={state === 'loading'}
        className="flex items-center gap-2 bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
      >
        <RefreshCw size={14} className={state === 'loading' ? 'animate-spin' : ''} />
        {state === 'loading' ? '収集中...' : '今すぐ収集実行'}
      </button>
      {summary && (
        <span className={`text-sm ${state === 'done' ? 'text-green-600' : 'text-red-500'}`}>
          {summary}
        </span>
      )}
    </div>
  )
}
