# bdiff - Beautiful Diff Viewer

シンプルで高速なファイル差分確認ツール

## 🚀 機能

- **ファイルアップロード**: ドラッグ&ドロップ対応のファイル比較
- **テキスト入力**: テキストエリアでの直接入力比較
- **高精度な差分検出**: Myers差分アルゴリズムを使用
- **3つの表示モード**: Side-by-side、Unified、Split
- **統計情報**: 追加/削除/変更行数と類似度の表示
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- **Any.do風デザイン**: ミニマルで直感的なUI

## 🛠️ 技術スタック

- **React 18** - UIフレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Vite** - ビルドツール
- **Cloudflare Pages** - ホスティング

## 📦 開発環境

### 必要要件

- Node.js 18+
- npm

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

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

## 📄 ライセンス

ISC License
