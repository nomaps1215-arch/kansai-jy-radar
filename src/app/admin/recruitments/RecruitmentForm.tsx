"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ConfidenceLabel,
  Recruitment,
  RecruitmentStatus,
  RecruitmentType,
  SourceType,
  Team,
  AdminReview,
} from "@prisma/client";
import {
  CONFIDENCE_LABELS,
  RECRUITMENT_STATUS_LABELS,
  RECRUITMENT_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
  formatDate,
  formatDateTime,
} from "@/lib/utils";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";

type TeamOption = { id: string; name: string; prefecture: string };

type RecruitmentWithRelations = Recruitment & {
  team: Team;
  adminReviews: AdminReview[];
};

type Props = {
  teams: TeamOption[];
  recruitment?: RecruitmentWithRelations;
  defaultTeamId?: string;
};

export default function RecruitmentForm({ teams, recruitment, defaultTeamId }: Props) {
  const router = useRouter();
  const isEdit = !!recruitment;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const body = {
      teamId: formData.get("teamId") as string,
      targetYear: Number(formData.get("targetYear")),
      targetGrade: formData.get("targetGrade") as string || null,
      title: formData.get("title") as string,
      recruitmentType: formData.get("recruitmentType") as RecruitmentType,
      status: formData.get("status") as RecruitmentStatus,
      eventDate: formData.get("eventDate") as string || null,
      eventStartTime: formData.get("eventStartTime") as string || null,
      eventEndTime: formData.get("eventEndTime") as string || null,
      venue: formData.get("venue") as string || null,
      address: formData.get("address") as string || null,
      applicationStartDate: formData.get("applicationStartDate") as string || null,
      applicationDeadline: formData.get("applicationDeadline") as string || null,
      applicationUrl: formData.get("applicationUrl") as string || null,
      fee: formData.get("fee") as string || null,
      capacity: formData.get("capacity") as string || null,
      targetPositions: formData.get("targetPositions") as string || null,
      isGkRecruiting: formData.get("isGkRecruiting") === "true",
      sourceUrl: formData.get("sourceUrl") as string || null,
      sourceType: formData.get("sourceType") as SourceType || null,
      confidenceScore: Number(formData.get("confidenceScore")),
      confidenceLabel: formData.get("confidenceLabel") as ConfidenceLabel,
      extractedText: formData.get("extractedText") as string || null,
      adminNote: formData.get("adminNote") as string || null,
    };

    try {
      const url = isEdit ? `/api/recruitments/${recruitment.id}` : "/api/recruitments";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "保存に失敗しました");
        return;
      }

      router.push("/admin/recruitments");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(status: RecruitmentStatus) {
    if (!recruitment) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/recruitments/${recruitment.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      router.push("/admin/pending");
      router.refresh();
    } catch {
      setError("ステータス更新に失敗しました");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!recruitment || !confirm("この募集情報を削除しますか？")) return;
    setLoading(true);
    try {
      await fetch(`/api/recruitments/${recruitment.id}`, { method: "DELETE" });
      router.push("/admin/recruitments");
      router.refresh();
    } catch {
      setError("削除に失敗しました");
      setLoading(false);
    }
  }

  const toDateInput = (d: Date | null | undefined) => {
    if (!d) return "";
    return new Date(d).toISOString().slice(0, 10);
  };

  return (
    <div className="space-y-4">
      {/* クイックアクション（編集時） */}
      {isEdit && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">クイックアクション</div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleStatusChange("CONFIRMED")}
              disabled={loading || recruitment.status === "CONFIRMED"}
              className="flex items-center gap-1.5 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle size={14} />確認済みにする
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("PENDING")}
              disabled={loading || recruitment.status === "PENDING"}
              className="flex items-center gap-1.5 bg-yellow-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors"
            >
              <Clock size={14} />保留
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("REJECTED")}
              disabled={loading || recruitment.status === "REJECTED"}
              className="flex items-center gap-1.5 bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <XCircle size={14} />誤情報
            </button>
            {recruitment.sourceUrl && (
              <a
                href={recruitment.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={14} />出典を確認
              </a>
            )}
          </div>
          {recruitment.extractedText && (
            <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 max-h-40 overflow-y-auto">
              <div className="text-gray-400 mb-1 font-medium">抽出本文</div>
              {recruitment.extractedText}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {/* 基本情報 */}
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  チーム <span className="text-red-500">*</span>
                </label>
                <select name="teamId" required
                  defaultValue={recruitment?.teamId ?? defaultTeamId ?? ""}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">選択してください</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.prefecture} {t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">対象年度</label>
                <select name="targetYear" defaultValue={String(recruitment?.targetYear ?? 2027)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="2027">2027年度</option>
                  <option value="2026">2026年度</option>
                  <option value="2028">2028年度</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input type="text" name="title" required
                  defaultValue={recruitment?.title ?? ""}
                  placeholder="例: 2027年度新中1 体験練習会"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">募集種別</label>
                <select name="recruitmentType"
                  defaultValue={recruitment?.recruitmentType ?? "TRIAL"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {(Object.keys(RECRUITMENT_TYPE_LABELS) as RecruitmentType[]).map((k) => (
                    <option key={k} value={k}>{RECRUITMENT_TYPE_LABELS[k]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                <select name="status" defaultValue={recruitment?.status ?? "DETECTED"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {(Object.keys(RECRUITMENT_STATUS_LABELS) as RecruitmentStatus[]).map((k) => (
                    <option key={k} value={k}>{RECRUITMENT_STATUS_LABELS[k]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">対象学年</label>
                <input type="text" name="targetGrade"
                  defaultValue={recruitment?.targetGrade ?? ""}
                  placeholder="例: 新中学1年生"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          </section>

          {/* 日程・会場 */}
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">日程・会場</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開催日</label>
                <input type="date" name="eventDate"
                  defaultValue={toDateInput(recruitment?.eventDate)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始時間</label>
                  <input type="time" name="eventStartTime"
                    defaultValue={recruitment?.eventStartTime ?? ""}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">終了時間</label>
                  <input type="time" name="eventEndTime"
                    defaultValue={recruitment?.eventEndTime ?? ""}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会場名</label>
                <input type="text" name="venue"
                  defaultValue={recruitment?.venue ?? ""}
                  placeholder="例: ○○グラウンド"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
                <input type="text" name="address"
                  defaultValue={recruitment?.address ?? ""}
                  placeholder="例: 大阪府大阪市○○区..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          </section>

          {/* 申込情報 */}
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">申込情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">申込開始日</label>
                <input type="date" name="applicationStartDate"
                  defaultValue={toDateInput(recruitment?.applicationStartDate)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">申込締切日</label>
                <input type="date" name="applicationDeadline"
                  defaultValue={toDateInput(recruitment?.applicationDeadline)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">申込URL</label>
                <input type="url" name="applicationUrl"
                  defaultValue={recruitment?.applicationUrl ?? ""}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">参加費</label>
                <input type="text" name="fee"
                  defaultValue={recruitment?.fee ?? ""}
                  placeholder="例: 無料 / 1,000円"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">募集人数</label>
                <input type="text" name="capacity"
                  defaultValue={recruitment?.capacity ?? ""}
                  placeholder="例: 若干名"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">対象ポジション</label>
                <input type="text" name="targetPositions"
                  defaultValue={recruitment?.targetPositions ?? ""}
                  placeholder="例: 全ポジション"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex items-center gap-3">
                <label className="block text-sm font-medium text-gray-700">GK募集あり</label>
                <select name="isGkRecruiting"
                  defaultValue={recruitment?.isGkRecruiting ? "true" : "false"}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="false">なし/不明</option>
                  <option value="true">あり</option>
                </select>
              </div>
            </div>
          </section>

          {/* 信頼度・出典 */}
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">信頼度・出典</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">信頼度</label>
                <select name="confidenceLabel"
                  defaultValue={recruitment?.confidenceLabel ?? "D"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {(Object.keys(CONFIDENCE_LABELS) as ConfidenceLabel[]).map((k) => (
                    <option key={k} value={k}>{CONFIDENCE_LABELS[k]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">出典種別</label>
                <select name="sourceType"
                  defaultValue={recruitment?.sourceType ?? "MANUAL"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">未選択</option>
                  {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map((k) => (
                    <option key={k} value={k}>{SOURCE_TYPE_LABELS[k]}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">出典URL</label>
                <input type="url" name="sourceUrl"
                  defaultValue={recruitment?.sourceUrl ?? ""}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">信頼スコア</label>
                <input type="number" name="confidenceScore" min="0" max="1" step="0.1"
                  defaultValue={String(recruitment?.confidenceScore ?? 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          </section>

          {/* メモ */}
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">管理メモ</h2>
            <textarea name="adminNote" rows={3}
              defaultValue={recruitment?.adminNote ?? ""}
              placeholder="管理者メモ..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="bg-brand-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
              {loading ? "保存中..." : isEdit ? "更新する" : "登録する"}
            </button>
            <button type="button" onClick={() => router.back()}
              className="border border-gray-300 text-gray-700 rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
              キャンセル
            </button>
            {isEdit && (
              <button type="button" onClick={handleDelete} disabled={loading}
                className="ml-auto border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors">
                削除
              </button>
            )}
          </div>
        </div>
      </form>

      {/* 確認履歴 */}
      {isEdit && recruitment.adminReviews.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">確認履歴</h2>
          <div className="space-y-2">
            {recruitment.adminReviews.map((review) => (
              <div key={review.id} className="flex items-start gap-3 text-sm">
                <span className="text-gray-400 text-xs w-32 shrink-0">
                  {formatDateTime(review.reviewedAt)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  review.status === "CONFIRMED" ? "bg-green-100 text-green-800" :
                  review.status === "REJECTED" ? "bg-red-100 text-red-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {RECRUITMENT_STATUS_LABELS[review.status as RecruitmentStatus]}
                </span>
                {review.note && <span className="text-gray-600">{review.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
