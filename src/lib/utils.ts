import { format, parseISO, isValid } from "date-fns";
import { ja } from "date-fns/locale";
import {
  ConfidenceLabel,
  RecruitmentStatus,
  RecruitmentType,
  SourceType,
  TeamCategory,
} from "@prisma/client";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "未定";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "未定";
  return format(d, "yyyy/MM/dd", { locale: ja });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "-";
  return format(d, "yyyy/MM/dd HH:mm", { locale: ja });
}

export const PREFECTURES = [
  "大阪府",
  "兵庫県",
  "京都府",
  "奈良県",
  "滋賀県",
  "和歌山県",
] as const;

export type Prefecture = (typeof PREFECTURES)[number];

export const TEAM_CATEGORY_LABELS: Record<TeamCategory, string> = {
  J_YOUTH: "J下部",
  CLUB: "街クラブ",
  SCHOOL: "スクール母体",
  OTHER: "その他",
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  OFFICIAL_SITE: "公式サイト",
  NEWS_PAGE: "お知らせページ",
  INSTAGRAM: "Instagram",
  X: "X(Twitter)",
  FACEBOOK: "Facebook",
  ASSOCIATION: "協会・連盟",
  SEARCH: "検索結果",
  MANUAL: "手動登録",
};

export const RECRUITMENT_TYPE_LABELS: Record<RecruitmentType, string> = {
  SELECTION: "セレクション",
  TRIAL: "体験練習会",
  BRIEFING: "説明会",
  GENERAL: "通常募集",
};

export const RECRUITMENT_STATUS_LABELS: Record<RecruitmentStatus, string> = {
  DETECTED: "自動検知",
  PENDING: "保留",
  CONFIRMED: "確認済み",
  REJECTED: "誤情報",
  ARCHIVED: "アーカイブ",
};

export const CONFIDENCE_LABELS: Record<ConfidenceLabel, string> = {
  A: "A：公式",
  B: "B：協会・連盟",
  C: "C：第三者",
  D: "D：AI推定",
};

export const CONFIDENCE_COLORS: Record<ConfidenceLabel, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-yellow-100 text-yellow-800",
  D: "bg-gray-100 text-gray-600",
};

export const STATUS_COLORS: Record<RecruitmentStatus, string> = {
  DETECTED: "bg-purple-100 text-purple-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export const RECRUITMENT_TYPE_COLORS: Record<RecruitmentType, string> = {
  SELECTION: "bg-red-100 text-red-800",
  TRIAL: "bg-blue-100 text-blue-800",
  BRIEFING: "bg-orange-100 text-orange-800",
  GENERAL: "bg-gray-100 text-gray-700",
};

export function truncate(str: string | null | undefined, len: number): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
