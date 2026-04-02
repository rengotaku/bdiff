# BDiff - Beautiful Diff Viewer

シンプルで高速なファイル差分確認ツール。すべての処理がブラウザ内で完結し、データが外部に送信されることはありません。

## 🚀 機能

- **ファイルアップロード**: ドラッグ&ドロップ対応のファイル比較
- **テキスト入力**: テキストエリアでの直接入力比較
- **高精度な差分検出**: Myers差分アルゴリズムを使用
- **2つの表示モード**: Side-by-side（横並び）、Unified（統合）
- **文字単位ハイライト**: 行内の変更箇所を文字レベルで強調表示
- **コンテキスト行省略**: GitHub風の差分表示（変更行の前後のみ表示、クリックで展開）
- **比較オプション**: 大文字小文字の無視、空白の無視、行のソートなど
- **統計情報**: 追加/削除/変更行数と類似度の表示
- **エクスポート**: HTML、Markdown、Plain Text形式での出力
- **多言語対応**: 日本語、英語、韓国語、中国語（繁体/簡体）、インドネシア語、フランス語、ドイツ語の8言語
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応

## 🛠️ 技術スタック

- **React** 19 - UIフレームワーク
- **TypeScript** 5.9 - 型安全性
- **Tailwind CSS** 3.4 - スタイリング
- **Vite** 7 - ビルドツール
- **i18next** - 国際化
- **Cloudflare Pages** - ホスティング

## 📦 開発環境

### 必要要件

- Node.js 18+
- npm

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（ポート: 14000）
npm run dev

# 型チェック + ビルド
npm run build

# テスト実行
npm run test

# プレビュー
npm run preview
```

## 🌐 デプロイ

### Cloudflare Pages

1. Cloudflare Pages にプロジェクトを接続
2. ビルド設定:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: 18

## 🤝 コントリビュート

Issue や Pull Request は大歓迎です！

### はじめかた

1. リポジトリをフォーク
2. ブランチを作成: `git checkout -b feat/your-feature`
3. 開発サーバーで動作確認: `npm run dev`
4. ビルドが通ることを確認: `npm run build`
5. コミットしてプッシュ
6. Pull Request を作成

### 翻訳の追加・修正

翻訳ファイルは `src/i18n/locales/` にあります。既存言語の修正や新しい言語の追加もお気軽にどうぞ。

### バグ報告・機能提案

[Issues](https://github.com/rengotaku/bdiff/issues) からお願いします。バグ報告の場合は再現手順を添えていただけると助かります。

## 📄 ライセンス

ISC License
