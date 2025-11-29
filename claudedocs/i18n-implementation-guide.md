# BDiff 国際化対応実装ガイド

## 概要

BDiffアプリケーションに多言語サポート（日本語・英語）を実装しました。このガイドでは、実装の詳細と今後の拡張方法について説明します。

## 実装内容

### 1. インストールしたパッケージ

```json
{
  "i18next": "^23.x.x",
  "react-i18next": "^15.x.x",
  "i18next-browser-languagedetector": "^8.x.x"
}
```

### 2. ディレクトリ構成

```
src/
├── i18n/
│   ├── config.ts                 # i18n設定ファイル
│   └── locales/
│       ├── en.json              # 英語翻訳ファイル
│       └── ja.json              # 日本語翻訳ファイル
└── components/
    └── ui/
        └── LanguageSwitcher.tsx  # 言語切り替えコンポーネント
```

### 3. 主要ファイル

#### i18n/config.ts
- i18nextの初期化と設定
- 言語検出の設定（localStorage → ブラウザ設定の順）
- ローカルストレージキー: `bdiff-language`

#### locales/en.json & locales/ja.json
翻訳キーの構成:
- `app.*` - アプリケーション全体の情報
- `header.*` - ヘッダー関連
- `fileUpload.*` - ファイルアップロードエリア
- `comparison.*` - 比較機能
- `comparisonOptions.*` - 比較オプション
- `diffViewer.*` - 差分表示
- `export.*` - エクスポート機能
- `errors.*` - エラーメッセージ
- `toast.*` - トースト通知
- `keyboard.*` - キーボードショートカット

#### LanguageSwitcher.tsx
2つの表示バリアント:
- `dropdown` (デフォルト): ドロップダウンメニュー
- `buttons`: ボタン形式

### 4. 更新されたコンポーネント

以下のコンポーネントをi18n対応:
- `src/main.tsx` - i18n設定のインポート
- `src/components/layout/Header.tsx` - 言語スイッチャーの追加
- `src/pages/HomePage.tsx` - 全テキストの翻訳対応
- `src/components/diff/DiffSettingsPanel.tsx` - ボタンテキストの翻訳
- `src/components/diff/ComparisonOptionsHorizontal.tsx` - オプションラベルの翻訳

## 使用方法

### 基本的な使い方

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('app.subtitle')}</p>
    </div>
  );
}
```

### パラメータ付き翻訳

```typescript
// 翻訳ファイル
{
  "fileUpload": {
    "fileInfo": "{{name}} ({{size}})"
  }
}

// コンポーネント
const message = t('fileUpload.fileInfo', {
  name: 'example.txt',
  size: '1.5 KB'
});
// 結果: "example.txt (1.5 KB)"
```

### 言語切り替え

```typescript
import { useTranslation } from 'react-i18next';

function LanguageToggle() {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <button onClick={() => changeLanguage('ja')}>
      日本語
    </button>
  );
}
```

## 言語の追加方法

### 1. 新しい翻訳ファイルの作成

`src/i18n/locales/` に新しい言語ファイルを追加:

```bash
# 例: 中国語を追加
src/i18n/locales/zh.json
```

### 2. config.ts の更新

```typescript
import zh from './locales/zh.json';

export const resources = {
  en: { translation: en },
  ja: { translation: ja },
  zh: { translation: zh },  // 追加
} as const;

i18n.init({
  // ...
  supportedLngs: ['en', 'ja', 'zh'],  // 追加
  // ...
});
```

### 3. LanguageSwitcher の更新

```typescript
const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },  // 追加
] as const;
```

## ベストプラクティス

### 1. 翻訳キーの命名規則
- 階層構造を使用: `category.subcategory.key`
- 説明的な名前を使用: `fileUpload.originalTitle`
- 一貫性のあるプレフィックス使用

### 2. デフォルト言語
- フォールバック言語: 英語 (`en`)
- 新しい翻訳キーは必ず英語版に追加

### 3. パフォーマンス
- 翻訳ファイルは静的にインポート
- i18n設定は main.tsx で初期化
- 必要な場所でのみ useTranslation フックを使用

### 4. テスト
- 両言語で全機能をテスト
- 長いテキストでのレイアウト崩れを確認
- 言語切り替えの動作確認

## トラブルシューティング

### 翻訳が表示されない
1. i18n/config.ts が main.tsx でインポートされているか確認
2. 翻訳キーのスペルミスをチェック
3. ブラウザのコンソールでエラーを確認

### 言語が保存されない
- LocalStorage に `bdiff-language` キーが保存されているか確認
- ブラウザのプライベートモードでは永続化されない

### ビルドエラー
- TypeScript の型エラーを確認
- 未使用のインポートを削除
- `npm run build` でビルドテスト

## 今後の拡張

### 可能な機能追加
1. **言語自動検出の改善**
   - URLパラメータからの言語指定
   - サブドメイン別言語設定

2. **翻訳管理の改善**
   - 翻訳ファイルの分割（機能別）
   - 動的な翻訳読み込み

3. **追加言語サポート**
   - 中国語（簡体字/繁体字）
   - 韓国語
   - その他のアジア言語

4. **RTL（右から左）言語対応**
   - アラビア語、ヘブライ語などのサポート
   - レイアウトの自動反転

## テスト結果

### ビルド成功
```bash
✓ 126 modules transformed.
dist/index.html            0.81 kB │ gzip:   0.44 kB
dist/index.Df8gIXpC.css   34.69 kB │ gzip:   6.21 kB
dist/index.C3ZS2gvt.js   435.58 kB │ gzip: 131.37 kB
✓ built in 849ms
```

### 実装された機能
- ✅ ヘッダーに言語スイッチャーを追加
- ✅ 全てのUIテキストを翻訳
- ✅ LocalStorageに言語設定を永続化
- ✅ ブラウザの言語設定を自動検出
- ✅ 日本語と英語の完全サポート
- ✅ リアルタイムで言語切り替え可能

## 参考リソース

- [react-i18next 公式ドキュメント](https://react.i18next.com/)
- [i18next 公式サイト](https://www.i18next.com/)
- [言語コード一覧](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry)

## まとめ

この実装により、BDiffアプリケーションは日本語と英語の両方で完全に利用可能になりました。
ユーザーはヘッダーの言語スイッチャーから簡単に言語を切り替えることができ、
選択した言語は自動的に保存されます。

今後は必要に応じて新しい言語を追加し、
より多くのユーザーにとって使いやすいアプリケーションに成長させることができます。
