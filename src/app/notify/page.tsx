import Link from "next/link";
import { Bell, MessageCircle, CheckCircle2 } from "lucide-react";

export default function NotifyPage() {
  const lineAddUrl = process.env.NEXT_PUBLIC_LINE_ADD_URL ?? "";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-brand-600 text-sm">← トップ</Link>
          <Bell size={18} className="text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">LINE通知登録</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* 説明 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            セレクション情報をLINEでお届けします
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            関西各地のジュニアユース（U-15）セレクション・体験練習会の新着情報を、
            LINEで通知します。見逃しなく情報をキャッチしてください。
          </p>
        </div>

        {/* 通知される情報 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">通知される情報</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "新着セレクション・体験練習会情報",
              "申込締切1日前・3日前・7日前のリマインド",
              "指定した都道府県のチームに絞った通知",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 登録方法 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">登録方法</h3>
          <ol className="space-y-5">
            <li className="flex gap-4">
              <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <div className="font-medium text-gray-800 mb-1">LINEアカウントを友だち追加</div>
                <p className="text-sm text-gray-500 mb-3">
                  下のボタンから公式LINEアカウントを友だち追加してください。
                </p>
                {lineAddUrl ? (
                  <a
                    href={lineAddUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#06C755] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#05b34d] transition-colors"
                  >
                    <MessageCircle size={16} />
                    LINEで友だち追加
                  </a>
                ) : (
                  <div className="text-sm text-gray-400 bg-gray-50 rounded-lg p-3">
                    LINEアカウントは準備中です。しばらくお待ちください。
                  </div>
                )}
              </div>
            </li>

            <li className="flex gap-4">
              <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <div className="font-medium text-gray-800 mb-1">自動的に通知登録完了</div>
                <p className="text-sm text-gray-500">
                  友だち追加すると、関西全域のセレクション情報の通知が始まります。
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <div className="font-medium text-gray-800 mb-1">（任意）都道府県を絞り込む</div>
                <p className="text-sm text-gray-500">
                  LINEで「大阪府」「兵庫県 京都府」のように送ると、
                  特定の都道府県のみ通知されます。
                  「全関西」と送ると全府県に戻せます。
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* 注意事項 */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-xs text-gray-500 space-y-1.5">
          <p>・通知を停止するにはLINEでブロックまたは友だち削除してください</p>
          <p>・通知はAIが自動収集した情報のため、内容の正確性は公式サイトでご確認ください</p>
          <p>・個人情報はLINEのユーザーIDのみ保存します</p>
        </div>
      </main>
    </div>
  );
}
