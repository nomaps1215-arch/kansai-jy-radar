"use client"

import { useState } from "react"
import { LEAGUES, CURRENT_SEASON, U13_LEAGUES, U15_LEAGUES } from "@/lib/leagues"

type Standing = {
  id: string
  season: string
  ageGroup: "U13" | "U15"
  leagueName: string
  rank: number | null
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

type Props = {
  teamId: string
  initialStandings: Standing[]
}

const EMPTY: Omit<Standing, "id"> = {
  season: CURRENT_SEASON,
  ageGroup: "U13",
  leagueName: "",
  rank: null,
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
}

export default function StandingsForm({ teamId, initialStandings }: Props) {
  const [standings, setStandings] = useState<Standing[]>(initialStandings)
  const [form, setForm] = useState<Omit<Standing, "id">>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const leagueOptions = form.ageGroup === "U13" ? U13_LEAGUES : U15_LEAGUES

  async function handleSave() {
    if (!form.leagueName) { setMsg("リーグを選択してください"); return }
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/teams/${teamId}/standings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) { setMsg("保存に失敗しました"); return }
      const saved: Standing = await res.json()
      setStandings((prev) => {
        const idx = prev.findIndex(
          (s) => s.season === saved.season && s.ageGroup === saved.ageGroup
        )
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
        return [...prev, saved]
      })
      setMsg("保存しました")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(s: Standing) {
    if (!confirm("この順位データを削除しますか？")) return
    await fetch(
      `/api/teams/${teamId}/standings?season=${s.season}&ageGroup=${s.ageGroup}`,
      { method: "DELETE" }
    )
    setStandings((prev) =>
      prev.filter((x) => !(x.season === s.season && x.ageGroup === s.ageGroup))
    )
  }

  function loadToForm(s: Standing) {
    setForm({ ...s })
    setMsg(null)
  }

  const num = (key: keyof typeof form, label: string) => (
    <div>
      <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
      <input
        type="number"
        min={0}
        value={form[key] ?? ""}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            [key]: e.target.value === "" ? null : Number(e.target.value),
          }))
        }
        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
      />
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h2 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">
        リーグ順位（U-13 / U-15）
      </h2>

      {/* 登録済み一覧 */}
      {standings.length > 0 && (
        <div className="space-y-2">
          {standings.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium bg-brand-100 text-brand-700 rounded px-2 py-0.5">
                  {s.ageGroup}
                </span>
                <span className="text-gray-700">{s.leagueName}</span>
                {s.rank != null && (
                  <span className="font-bold text-gray-900">{s.rank}位</span>
                )}
                <span className="text-gray-400 text-xs">
                  {s.wins}勝{s.draws}分{s.losses}敗 / {s.points}pt
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadToForm(s)}
                  className="text-xs text-brand-600 hover:underline"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  className="text-xs text-red-500 hover:underline"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 入力フォーム */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">年代</label>
            <select
              value={form.ageGroup}
              onChange={(e) =>
                setForm((f) => ({ ...f, ageGroup: e.target.value as "U13" | "U15", leagueName: "" }))
              }
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="U13">U-13</option>
              <option value="U15">U-15</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">シーズン</label>
            <input
              type="text"
              value={form.season}
              onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-0.5">リーグ</label>
          <select
            value={form.leagueName}
            onChange={(e) => setForm((f) => ({ ...f, leagueName: e.target.value }))}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          >
            <option value="">リーグを選択...</option>
            {leagueOptions.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}（{l.scope}）
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {num("rank", "順位")}
          {num("played", "試合数")}
          {num("points", "勝点")}
          {num("wins", "勝")}
          {num("draws", "分")}
          {num("losses", "負")}
          {num("goalsFor", "得点")}
          {num("goalsAgainst", "失点")}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-brand-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "保存中..." : "順位を保存"}
          </button>
          <button
            onClick={() => { setForm(EMPTY); setMsg(null) }}
            className="border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            クリア
          </button>
          {msg && <span className="text-sm text-green-600">{msg}</span>}
        </div>
      </div>
    </div>
  )
}
