# 関西ジュニアユース進路レーダー

関西2府4県のサッカージュニアユースチームの募集・セレクション・体験練習会情報を監視・収集・公開するWebアプリ。

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router) / TypeScript / Tailwind CSS
- **データベース**: Supabase (PostgreSQL) + Prisma ORM
- **認証**: Supabase Auth
- **デプロイ**: Vercel

---

## セットアップ手順

### 1. リポジトリのセットアップ

```bash
cd "Jrユースレーダー"
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` に以下を設定：

```env
# Supabase Project URL と Anon Key（Supabase ダッシュボードの Settings > API から取得）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Supabase PostgreSQL 接続文字列（Settings > Database から取得）
# pgbouncer経由（アプリ用）
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# 直接接続（マイグレーション用）
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

### 3. Supabase でユーザー作成

Supabase ダッシュボード → Authentication → Users → "Add user" で管理者アカウントを作成。

### 4. DBマイグレーション

```bash
# Prismaスキーマを DB に反映
npm run db:push

# または migration ファイルを生成して適用
npm run db:migrate
```

### 5. シードデータ投入（オプション）

サンプルチームデータを投入：

```bash
npm run db:seed
```

### 6. 開発サーバー起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開く。

---

## URL 一覧

| URL | 説明 |
|-----|------|
| `http://localhost:3000/` | 一般公開トップ（募集情報一覧） |
| `http://localhost:3000/teams` | チーム一覧（公開） |
| `http://localhost:3000/admin/login` | 管理者ログイン |
| `http://localhost:3000/admin` | 管理ダッシュボード |
| `http://localhost:3000/admin/pending` | 未確認情報一覧 |
| `http://localhost:3000/admin/teams` | チーム管理 |
| `http://localhost:3000/admin/sources` | ソースURL管理 |
| `http://localhost:3000/admin/recruitments` | 募集情報管理 |
| `http://localhost:3000/admin/crawl-logs` | クロールログ |
| `http://localhost:3000/admin/notifications` | 通知履歴 |

---

## CSV インポート

`sample/teams_sample.csv` を参考に CSV を用意し、チーム管理画面の「CSVインポート」ボタンからアップロード。

### CSV カラム仕様

```
name,name_kana,prefecture,city,category,league,training_area,home_ground,official_site_url,instagram_url,x_url,facebook_url,memo
```

| カラム | 必須 | 説明 | 例 |
|--------|------|------|----|
| name | ✓ | チーム名 | FC大阪JY |
| name_kana | | カナ | エフシーオオサカジェイワイ |
| prefecture | ✓ | 都道府県 | 大阪府 |
| city | | 市区町村 | 大阪市北区 |
| category | | J_YOUTH / CLUB / SCHOOL / OTHER | CLUB |
| league | | 所属リーグ | 高円宮杯U-15関西 |
| training_area | | 活動エリア | 大阪市内 |
| home_ground | | ホームグラウンド | ○○グラウンド |
| official_site_url | | 公式サイト | https://... |
| instagram_url | | Instagram | https://www.instagram.com/... |
| x_url | | X(Twitter) | https://x.com/... |
| facebook_url | | Facebook | https://www.facebook.com/... |
| memo | | 内部メモ | |

---

## Phase 1 完了機能

- [x] 管理者ログイン（Supabase Auth）
- [x] ダッシュボード（統計カード）
- [x] チーム登録・編集・一覧
- [x] ソースURL登録・編集・一覧
- [x] 募集情報 手動登録・編集・一覧
- [x] 未確認情報一覧（確認済み/保留/誤情報への1タップ操作）
- [x] 確認済み情報のみ一般公開
- [x] CSVインポート
- [x] クロールログ・通知履歴ページ（Phase 2/4で機能追加予定）

## 次のフェーズ

| Phase | 内容 |
|-------|------|
| Phase 2 | Playwright による自動巡回・キーワード検知 |
| Phase 3 | AI（Claude API）による本文抽出 |
| Phase 4 | LINE Messaging API 通知 |
| Phase 5 | Google 検索 API による補完収集 |
| Phase 6 | 地図表示・カレンダー・比較ページ |

---

## Vercel デプロイ

1. Vercel にリポジトリを連携
2. Environment Variables に `.env.local` の内容を設定
3. Framework Preset: `Next.js`
4. デプロイ後、`npm run db:push` を Vercel Functions 経由で実行するか、直接 DB に対して実行

---

## セキュリティ

- 管理画面（`/admin/*`）はログイン必須（Supabase Auth + middleware）
- ログイン画面（`/admin/login`）は認証不要
- 一般公開ページは読み取り専用
- `CONFIRMED` かつ `publishedAt` が設定済みの情報のみ公開
- 出典URLなしの情報は公開不可の運用ルール（UI で強制はしていないため管理者が確認）
