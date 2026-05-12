'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react'

export function CrawlButton({ sourceId }: { sourceId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [info, setInfo] = useState('')

  async function run() {
    setState('loading')
    try {
      const res = await fetch('/api/crawl/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'source', sourceId }),
      })
      const data = await res.json()
      if (data.ok) {
        setState('ok')
        setInfo(data.hasKeyword ? '募集キーワード検出' : '変化なし')
      } else {
        setState('error')
        setInfo(data.error ?? 'エラー')
      }
    } catch {
      setState('error')
      setInfo('通信エラー')
    }
    setTimeout(() => setState('idle'), 4000)
  }

  return (
    <button
      onClick={run}
      disabled={state === 'loading'}
      title={info || 'このソースを今すぐクロール'}
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors
        disabled:opacity-50
        data-[s=idle]:border-gray-300 data-[s=idle]:text-gray-500 data-[s=idle]:hover:border-brand-400 data-[s=idle]:hover:text-brand-600
        data-[s=loading]:border-gray-300 data-[s=loading]:text-gray-400
        data-[s=ok]:border-green-400 data-[s=ok]:text-green-600
        data-[s=error]:border-red-400 data-[s=error]:text-red-600"
      data-s={state}
    >
      {state === 'idle' && <RefreshCw size={11} />}
      {state === 'loading' && <RefreshCw size={11} className="animate-spin" />}
      {state === 'ok' && <CheckCircle size={11} />}
      {state === 'error' && <XCircle size={11} />}
      <span>{state === 'idle' ? '今すぐ' : state === 'loading' ? '...' : info}</span>
    </button>
  )
}

// ダッシュボード用 フルパイプライン実行ボタン
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
