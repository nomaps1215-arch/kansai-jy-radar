export const CURRENT_SEASON = "2025"

export interface LeagueInfo {
  value: string
  label: string
  scope: string
  ageGroup: "U13" | "U15"
}

// 公式ソース確認済みリーグのみ掲載
export const LEAGUES: LeagueInfo[] = [
  // ── 関西広域 U-15 ─────────────────────────────────────
  // 出典: https://www.jfa.jp/match/takamado_jfa_u15_2025/regional/kansai1/
  { value: "サンライズリーグ1部",  label: "サンライズリーグ 1部", scope: "関西",  ageGroup: "U15" },
  { value: "サンライズリーグ2部",  label: "サンライズリーグ 2部", scope: "関西",  ageGroup: "U15" },

  // ── 大阪 U-15 ─────────────────────────────────────────
  // 出典: https://osaka-fa.or.jp/3shu/game_information/fy2025/2025advance/
  { value: "アドバンスリーグ1部",  label: "アドバンスリーグ 1部", scope: "大阪府", ageGroup: "U15" },
  { value: "アドバンスリーグ2部",  label: "アドバンスリーグ 2部", scope: "大阪府", ageGroup: "U15" },
  { value: "アドバンスリーグ3部",  label: "アドバンスリーグ 3部", scope: "大阪府", ageGroup: "U15" },
  { value: "アドバンスリーグ4部",  label: "アドバンスリーグ 4部", scope: "大阪府", ageGroup: "U15" },
  // 出典: https://osaka-fa.or.jp/3shu/game_information/fy2025/2025futureleague/
  { value: "フューチャーリーグ",    label: "フューチャーリーグ",   scope: "大阪府", ageGroup: "U15" },

  // ── 兵庫 U-15 ─────────────────────────────────────────
  // 出典: https://hyogo-fa.gr.jp/third/
  { value: "兵庫TOPリーグ1部",    label: "TOPリーグ 1部", scope: "兵庫県", ageGroup: "U15" },
  { value: "兵庫TOPリーグ2部",    label: "TOPリーグ 2部", scope: "兵庫県", ageGroup: "U15" },
  { value: "兵庫TOPリーグ3部",    label: "TOPリーグ 3部", scope: "兵庫県", ageGroup: "U15" },

  // ── 京都 U-15 ─────────────────────────────────────────
  // 出典: https://www.kyoto-fa.or.jp/archives.php?id=1483&category=12
  { value: "京都U15リーグ1部",    label: "京都リーグ 1部", scope: "京都府", ageGroup: "U15" },
  { value: "京都U15リーグ2部",    label: "京都リーグ 2部", scope: "京都府", ageGroup: "U15" },
  { value: "京都U15リーグ3部",    label: "京都リーグ 3部", scope: "京都府", ageGroup: "U15" },

  // ── 滋賀 U-15 ─────────────────────────────────────────
  // 出典: https://www.shigafa.com/custompost2/
  // 部門: TOPリーグ・2A・2B・3A
  { value: "滋賀TOPリーグ",       label: "滋賀TOPリーグ",  scope: "滋賀県", ageGroup: "U15" },
  { value: "滋賀2Aリーグ",        label: "滋賀2Aリーグ",   scope: "滋賀県", ageGroup: "U15" },
  { value: "滋賀2Bリーグ",        label: "滋賀2Bリーグ",   scope: "滋賀県", ageGroup: "U15" },
  { value: "滋賀3Aリーグ",        label: "滋賀3Aリーグ",   scope: "滋賀県", ageGroup: "U15" },

  // ── 奈良 U-15 ─────────────────────────────────────────
  // 出典: https://www.narafa.or.jp/
  { value: "奈良NFAリーグ1部",    label: "NFAリーグ 1部",  scope: "奈良県", ageGroup: "U15" },
  { value: "奈良NFAリーグ2部",    label: "NFAリーグ 2部",  scope: "奈良県", ageGroup: "U15" },
  { value: "奈良NFAリーグ3部",    label: "NFAリーグ 3部",  scope: "奈良県", ageGroup: "U15" },

  // ── 和歌山 U-15 ───────────────────────────────────────
  // 出典: https://www.wfa.or.jp/pages/262/ （中田食品リーグ）
  { value: "和歌山U15リーグ",     label: "和歌山リーグ（中田食品リーグ）", scope: "和歌山県", ageGroup: "U15" },

  // ── 関西広域 U-13 ─────────────────────────────────────
  // 出典: https://www.jfa.jp/match/u13_league_2025/regional/kansai1/
  { value: "ヤマトタケルリーグ1部", label: "ヤマトタケルリーグ 1部", scope: "関西", ageGroup: "U13" },
  { value: "ヤマトタケルリーグ2部", label: "ヤマトタケルリーグ 2部", scope: "関西", ageGroup: "U13" },

  // ── 大阪 U-13 ─────────────────────────────────────────
  // 出典: https://osaka-fa.or.jp/3shu/
  { value: "アドバンスリーグU13-1部", label: "アドバンスリーグ U-13 1部", scope: "大阪府", ageGroup: "U13" },
  { value: "アドバンスリーグU13-2部", label: "アドバンスリーグ U-13 2部", scope: "大阪府", ageGroup: "U13" },
  { value: "フューチャーリーグU13",   label: "フューチャーリーグ U-13",   scope: "大阪府", ageGroup: "U13" },

  // ── 兵庫 U-13 ─────────────────────────────────────────
  // 出典: https://hyogo-fa.gr.jp/competition_info/8952/
  { value: "兵庫ルーキーリーグ1部",       label: "ルーキーリーグ 1部",       scope: "兵庫県", ageGroup: "U13" },
  { value: "兵庫ルーキーリーグ2部",       label: "ルーキーリーグ 2部",       scope: "兵庫県", ageGroup: "U13" },
  { value: "兵庫ルーキーリーグ3部",       label: "ルーキーリーグ 3部",       scope: "兵庫県", ageGroup: "U13" },
  { value: "兵庫トレセンスーパーリーグU13", label: "トレセンスーパーリーグ U-13", scope: "兵庫県", ageGroup: "U13" },

  // ── 京都 U-13 ─────────────────────────────────────────
  // 出典: https://www.kyoto-fa.or.jp/organization/junior-high-school
  { value: "京都U13リーグ",     label: "U-13サッカーリーグ 京都",       scope: "京都府", ageGroup: "U13" },
  { value: "京都U13育成リーグ", label: "U-13サッカーリーグ 京都（育成）", scope: "京都府", ageGroup: "U13" },

  // ── 滋賀 U-13 ─────────────────────────────────────────
  // 出典: https://www.shigafa.com/category/seed_3
  // ブロック制: Aブロック・Bブロック・Cブロック
  { value: "滋賀U13リーグA", label: "U-13サッカーリーグ 滋賀 Aブロック", scope: "滋賀県", ageGroup: "U13" },
  { value: "滋賀U13リーグB", label: "U-13サッカーリーグ 滋賀 Bブロック", scope: "滋賀県", ageGroup: "U13" },
  { value: "滋賀U13リーグC", label: "U-13サッカーリーグ 滋賀 Cブロック", scope: "滋賀県", ageGroup: "U13" },

  // ── 奈良 U-13 ─────────────────────────────────────────
  // 出典: https://www.narafa.or.jp/pages/27/
  { value: "奈良NFAリーグU13", label: "NFAサッカーリーグ U-13", scope: "奈良県", ageGroup: "U13" },

  // ── 和歌山 U-13 ───────────────────────────────────────
  // 出典: https://www.wfa.or.jp/ / https://fc-trigger.com/10863/
  { value: "和歌山WFAリーグU13", label: "WFA U-13リーグ", scope: "和歌山県", ageGroup: "U13" },
]

export const U13_LEAGUES = LEAGUES.filter((l) => l.ageGroup === "U13")
export const U15_LEAGUES = LEAGUES.filter((l) => l.ageGroup === "U15")

export function getLeagueLabel(value: string): string {
  return LEAGUES.find((l) => l.value === value)?.label ?? value
}
