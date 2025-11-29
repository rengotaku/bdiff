# BDiff - Beautiful Diff Viewer

## 📖 アプリケーション概要

BDiffは、2つのファイルやテキストの差分を視覚的に分かりやすく表示する、モダンなWeb差分ビューアです。シンプルで直感的なUIと高精度な差分検出により、開発者やライター、コンテンツ管理者が効率的にファイル比較を行えます。

### 主な特徴

- **ドラッグ&ドロップ対応**: ファイルを簡単にアップロードして比較
- **テキスト直接入力**: テキストエリアでの即座の比較が可能
- **高精度差分検出**: Myers差分アルゴリズムによる正確な差分解析
- **複数の表示モード**: Side-by-side、Unified、Splitの3モード
- **詳細な統計情報**: 追加/削除/変更行数と類似度の可視化
- **エクスポート機能**: HTML、Markdown、Plain Text形式でのエクスポート
- **比較オプション**: 大文字小文字の無視、空白の無視、行のソートなど
- **多言語対応**: 8言語をサポート（日本語、英語、韓国語、中国語繁体字、中国語簡体字、インドネシア語、フランス語、ドイツ語）
- **レスポンシブデザイン**: あらゆるデバイスで快適に使用可能
- **ミニマルUI**: Any.do風のクリーンで直感的なデザイン

### ユースケース

- コードレビュー前の変更確認
- ドキュメントやコンテンツの改訂比較
- 設定ファイルの差分確認
- マージ前の変更内容の視覚化
- バージョン間の変更履歴の確認

## 🛠️ 技術スタック

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **React** | 19.1.1 | UIフレームワーク |
| **TypeScript** | 5.9.2 | 型安全性・開発体験向上 |
| **Tailwind CSS** | 3.4.17 | ユーティリティファーストCSS |
| **React Router DOM** | 7.8.2 | クライアントサイドルーティング |

### ユーティリティライブラリ

| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| **class-variance-authority** | 0.7.1 | コンポーネントバリアント管理 |
| **clsx** | 2.1.1 | 条件付きクラス名の結合 |
| **tailwind-merge** | 3.3.1 | Tailwindクラスの競合解決 |

### 国際化ライブラリ

| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| **i18next** | 23.x.x | 国際化フレームワーク |
| **react-i18next** | 15.x.x | React統合 |
| **i18next-browser-languagedetector** | 8.x.x | 自動言語検出 |

### ビルド・開発ツール

| ツール | バージョン | 用途 |
|--------|-----------|------|
| **Vite** | 7.1.5 | 高速ビルドツール・開発サーバー |
| **@vitejs/plugin-react** | 5.0.2 | React統合プラグイン |
| **PostCSS** | 8.5.6 | CSS処理 |
| **Autoprefixer** | 10.4.21 | ベンダープレフィックス自動付与 |

### ホスティング

- **Cloudflare Pages**: エッジコンピューティングによる高速配信
- **GitHub Actions**: CI/CD自動デプロイメント

## 🏗️ アーキテクチャ

### ディレクトリ構成

```
src/
├── components/          # UIコンポーネント
│   ├── common/         # 共通コンポーネント（EmptyState, LoadingSpinner等）
│   ├── diff/           # 差分表示関連コンポーネント
│   ├── export/         # エクスポート機能コンポーネント
│   ├── layout/         # レイアウトコンポーネント
│   └── ui/             # 基本UIコンポーネント
├── contexts/           # Reactコンテキスト（状態管理）
├── hooks/              # カスタムフック
├── i18n/               # 国際化設定
│   ├── config.ts       # i18next設定
│   └── locales/        # 翻訳ファイル（8言語対応）
│       ├── ja.json     # 日本語
│       ├── en.json     # 英語
│       ├── ko.json     # 韓国語
│       ├── zh-TW.json  # 中国語繁体字
│       ├── zh-CN.json  # 中国語簡体字
│       ├── id.json     # インドネシア語
│       ├── fr.json     # フランス語
│       └── de.json     # ドイツ語
├── pages/              # ページコンポーネント
├── services/           # ビジネスロジック・サービス層
│   └── export/         # エクスポート機能のレンダラー
├── types/              # TypeScript型定義
└── utils/              # ユーティリティ関数
```

### 主要コンポーネント

#### 差分検出エンジン
- **DiffService**: Myers差分アルゴリズムの実装
- **TextPreprocessor**: テキスト前処理（正規化、ソート等）
- **DiffParser**: 差分結果の解析・フィルタリング

#### 表示システム
- **DiffViewer**: 差分の視覚化（Unified/Side-by-side）
- **DiffSettingsPanel**: 表示設定コントロール
- **FileComparisonPanel**: ファイル比較メインパネル

#### エクスポートシステム
- **ExportService**: 統合エクスポートサービス
- **HTMLRenderer**: HTML形式エクスポート
- **MarkdownRenderer**: Markdown形式エクスポート
- **PlainTextRenderer**: プレーンテキストエクスポート

#### 国際化システム
- **i18next**: 翻訳管理フレームワーク
- **LanguageSwitcher**: 言語切り替えUIコンポーネント（国旗アイコン付き）
- **翻訳ファイル**: JSON形式で8言語 × 70+ キー = 560+ 翻訳エントリ
- **自動言語検出**: LocalStorage → ブラウザ設定の順で言語を検出
- **永続化**: 選択された言語はLocalStorageに保存され、ページリロード後も維持

### 状態管理

- **DiffContext**: アプリケーション全体の差分状態管理
- ローカルステート: 各コンポーネント内での状態管理
- カスタムフック: 再利用可能なロジックの抽出

## 🔄 データフロー

```
ファイル入力/テキスト入力
    ↓
TextPreprocessor (前処理)
    ↓
DiffService (差分検出)
    ↓
DiffParser (結果解析)
    ↓
DiffContext (状態管理)
    ↓
DiffViewer (表示)
    ↓
ExportService (エクスポート)
```

## 🌐 国際化（i18n）

### サポート言語

BDiffは8つの言語に完全対応しています。すべてのUI要素とエクスポート機能が各言語に翻訳されています。

| 言語 | コード | ネイティブ表記 | カバレッジ |
|------|--------|---------------|-----------|
| 日本語 | ja | 日本語 | 100% (70+ keys) |
| 英語 | en | English | 100% (70+ keys) |
| 韓国語 | ko | 한국어 | 100% (70+ keys) |
| 中国語繁体字 | zh-TW | 繁體中文 | 100% (70+ keys) |
| 中国語簡体字 | zh-CN | 简体中文 | 100% (70+ keys) |
| インドネシア語 | id | Bahasa Indonesia | 100% (70+ keys) |
| フランス語 | fr | Français | 100% (70+ keys) |
| ドイツ語 | de | Deutsch | 100% (70+ keys) |

### 翻訳の実装原則

**重要**: すべての表示テキストは、コード内に直接文字列を書くのではなく、`src/i18n/locales/*.json` ファイルに定義し、翻訳キーを通じて呼び出すこと。

```typescript
// ❌ 悪い例：コードに直接文字列を埋め込む
<button>Compare Files</button>

// ✅ 良い例：翻訳キーを使用
const { t } = useTranslation();
<button>{t('comparison.compareButton')}</button>
```

### 翻訳ファイルの構造

各言語の翻訳ファイルは以下の階層構造で管理されています：

```json
{
  "app": { "title", "subtitle" },
  "header": { "languageSelector" },
  "fileUpload": { "originalTitle", "modifiedTitle", ... },
  "comparison": { "compareButton", "clearAll", ... },
  "comparisonOptions": { "ignoreCase", "sortLines", ... },
  "diffViewer": { "viewMode", "statistics", ... },
  "export": {
    "title", "format", ...,
    "html": { "dialogTitle", "viewMode", "displayOptions", ... }
  },
  "errors": { "title", "copyFailed", ... },
  "toast": { "copyComplete", "copyMessage" },
  "keyboard": { "title", "compare", ... }
}
```

### 言語切り替え

- **自動検出**: 初回訪問時にブラウザの言語設定を自動検出
- **永続化**: 選択された言語はLocalStorageに保存（キー: `bdiff-language`）
- **UI**: ヘッダー右上の言語スイッチャーから即座に切り替え可能
- **国旗アイコン**: 視覚的に分かりやすい国旗アイコン付きドロップダウン

### 新しい言語の追加方法

1. `src/i18n/locales/` に新しい言語ファイルを作成（例: `es.json`）
2. `en.json` の構造をコピーして翻訳
3. `src/i18n/config.ts` にインポートとリソースを追加
4. `supportedLngs` 配列に言語コードを追加
5. `src/components/ui/LanguageSwitcher.tsx` に言語オプションを追加

詳細は `claudedocs/i18n-implementation-guide.md` を参照してください。

## 🎯 開発方針

### コード品質

- **TypeScript**: 厳格な型チェックによる堅牢性
- **関数型プログラミング**: 純粋関数とイミュータブルなデータ
- **コンポーネント設計**: 単一責任原則に基づく小さなコンポーネント
- **カスタムフック**: ロジックの再利用性と可読性の向上

### パフォーマンス

- **React.memo**: 不要な再レンダリングの防止
- **useMemo/useCallback**: 計算結果とコールバックのメモ化
- **遅延読み込み**: 大きなファイルの段階的な処理
- **Vite**: 高速な開発体験とビルド最適化

### ユーザビリティ

- **アクセシビリティ**: ARIA属性とキーボードナビゲーション
- **レスポンシブ**: モバイルファーストデザイン
- **直感的UI**: ミニマルで分かりやすいインターフェース
- **高速フィードバック**: リアルタイムでの差分表示

## 📦 ビルド・デプロイ

### 開発環境

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（ポート: 14000）
npm run dev

# 型チェック + ビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

### プロダクションビルド

- **ビルドコマンド**: `tsc && vite build`
- **出力ディレクトリ**: `dist/`
- **最適化**: Tree shaking、コード分割、圧縮

### デプロイメント

- **プラットフォーム**: Cloudflare Pages
- **自動デプロイ**: GitHub Actionsによるmainブランチへのpush時
- **エッジ配信**: Cloudflareのグローバルネットワーク

## 🔐 セキュリティ

- **XSS対策**: HTMLエスケープ処理の徹底
- **入力検証**: ファイルタイプとサイズの制限
- **クライアントサイド処理**: サーバーへのファイルアップロード不要
- **CSP**: Content Security Policyの適用

## 📈 今後の展開

- [ ] SVG差分ビューアの強化
- [ ] 構文ハイライト機能
- [ ] コピー機能の拡張
- [ ] パフォーマンス最適化
- [ ] テストカバレッジの向上
- [ ] PWA対応

---

**プロジェクトURL**: https://github.com/rengotaku/bdiff
**ライセンス**: ISC
**開発環境**: Node.js 18+
