# Issue #36: Comparison Options 位置の再検討 - Implementation Summary

## 概要

画面サイドのオプションサイドバーを削除し、Comparison Options を Compare Files ボタンの上部にアコーディオン形式で横並びに配置。また、2箇所にあった Clear ボタンを1つのリンクに統合しました。

## 実装内容

### 1. 新規作成したコンポーネント

#### `Accordion.tsx` (src/components/ui/Accordion.tsx)
- 折りたたみ可能なアコーディオンUIコンポーネント
- プロパティ:
  - `title`: アコーディオンのタイトル
  - `children`: 折りたたまれるコンテンツ
  - `defaultOpen`: 初期状態で開いているか (デフォルト: false)
  - `className`: 追加のCSSクラス
- アニメーション付きの開閉機能
- アクセシビリティ対応 (aria-expanded, aria-label)

#### `ComparisonOptionsHorizontal.tsx` (src/components/diff/ComparisonOptionsHorizontal.tsx)
- Comparison Options を横並びレイアウトで表示
- 既存の ComparisonOptions の機能を維持
- 4つのオプション:
  - Sort lines (行のソート)
  - Ignore case (大文字小文字を無視)
  - Ignore whitespace (空白を無視)
  - Ignore trailing newlines (末尾の改行を無視)
- 各オプションにツールチップ機能

### 2. 更新したコンポーネント

#### `HomePage.tsx` (src/pages/HomePage.tsx)
変更点:
1. **インポートの変更**:
   - `ComparisonOptionsSidebar` を削除
   - `Accordion` と `ComparisonOptionsHorizontal` を追加

2. **ハンドラーの変更**:
   - `handleClearOriginal` と `handleClearModified` を削除
   - `handleClearAll`: 両方のファイルを一度にクリアする関数を追加

3. **レイアウトの変更**:
   - Comparison Options Accordion を Compare Files ボタンの上に配置
   - Compare Files ボタンの横に "Clear All" リンクを追加
   - 各FileUploadAreaから `onClear` prop を削除（個別Clearボタンを非表示）
   - 画面下部の `ComparisonOptionsSidebar` を削除

### 3. 削除を検討可能なファイル

以下のファイルは今回の実装で使用されなくなりました:
- `src/components/diff/ComparisonOptionsSidebar.tsx` (固定サイドバー)

注: 元の `ComparisonOptions.tsx` は現時点では残していますが、今後 `ComparisonOptionsHorizontal.tsx` で完全に置き換えることも可能です。

## UI/UX の改善点

### Before (変更前)
- 画面右側に固定サイドバー
- トグルボタンでサイドバーを開閉
- オプションは縦並びで表示
- 各ファイルエリアに個別のClearボタン（2箇所）

### After (変更後)
- Compare Filesボタンの上にアコーディオン
- アコーディオンをクリックして開閉
- オプションは横並びで表示（コンパクト）
- Compare Filesボタンの横に統合されたClear Allリンク（1箇所）
  - ファイルが選択されている時のみ表示される
  - 両方のファイルを一度にクリア可能

## メリット

1. **画面スペースの有効活用**: 固定サイドバーがなくなり、差分表示エリアが広くなりました
2. **直感的な配置**: オプションが比較実行ボタンの近くにあり、関連性が明確
3. **操作の簡略化**: Clearボタンが1箇所に統合され、より使いやすくなりました
4. **レスポンシブ対応**: 横並びレイアウトは小さい画面でも自動的に折り返します

## テスト結果

- ✅ TypeScript ビルド成功
- ✅ Vite プロダクションビルド成功
- ✅ 開発サーバー起動確認

## 今後の課題

1. ComparisonOptionsSidebar.tsx の削除を検討
2. 元の ComparisonOptions.tsx の削除を検討（必要に応じて）
3. アコーディオンのデフォルト開閉状態をユーザー設定に保存する機能の追加
4. モバイル/タブレットでのレスポンシブ動作の確認

## 関連ファイル

- src/components/ui/Accordion.tsx (新規)
- src/components/diff/ComparisonOptionsHorizontal.tsx (新規)
- src/pages/HomePage.tsx (更新)
- src/components/diff/ComparisonOptionsSidebar.tsx (未使用)
