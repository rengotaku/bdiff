# Issue #22: 一列の文字列が長いと差分表示の際に途切れてしまう

**Issue URL**: https://github.com/rengotaku/bdiff/issues/22

## 作業概要
phase1 - 長い文字列が差分表示で適切に折り返されない問題を修正

## ベースブランチ
origin/main

## ブランチ名
Issue-22-long-string-diff-display-issue-phase1

## 作成日時
2025-11-05

---

## 作業ログ

### 問題の分析
- 日本語テキストは自動で折り返されるが、半角文字のみの長い文字列（スペースなし）は折り返されない
- 具体例: `aabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb1`
- 原因: `whitespace-pre-wrap` は使用しているが、`break-words` が適用されていない

### 実装した修正
1. **DiffViewer.tsx (line 48)**: メインの diff 表示コンポーネントに `break-words` を追加
2. **diffRendering.ts (line 8)**: ライン表示のベースクラスに `break-words` を追加
3. **global.css**: 追加のCSS規則でテキスト折り返しを強化
4. **ErrorBoundary.tsx (line 95)**: エラー表示でも一貫性を保つため `break-words` を追加

### 技術的詳細
- Tailwind CSS の `break-words` クラスを使用
- `overflow-wrap: anywhere` を CSS で直接指定（Tailwind にクラスがないため）
- `whitespace-pre-wrap` と `break-words` の組み合わせで、空白の保持と長い文字列の折り返しを両立

### テストケース
作成したテストファイル:
- `test_long_strings.md`: 様々な長い文字列のテストケース
- `test_long_strings_modified.md`: 差分テスト用の修正版

テスト内容:
1. 日本語の長い文
2. 半角文字のみの連続した長い文字列
3. 業務文書の長い説明文（実際のケース）
4. 長いURL
5. 長い変数名を含むコード
6. 混合コンテンツ

### 確認事項
- ✅ ビルドエラーなし
- ✅ TypeScript型チェック通過
- ✅ 開発サーバー起動成功
- ✅ テストファイル作成完了

### 影響範囲
- 差分表示の全ての箇所でテキスト折り返しが適用される
- HTML エクスポート機能では既に適切な折り返し設定済み
- エラー表示でも同様に折り返しが適用される

### Next Steps
- PR作成前に実際のブラウザでテスト確認
- 既存の機能に影響がないことを確認
- リグレッションテストの実行