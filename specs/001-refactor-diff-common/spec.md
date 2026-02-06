# Feature Specification: 差分表示ロジックの共通化リファクタリング

**Feature Branch**: `001-refactor-diff-common`
**Created**: 2026-02-06
**Status**: Draft
**Input**: リファクタリング。共通化を進める

## 背景

現在、画面表示（DiffViewer.tsx）とHTMLエクスポート（HTMLRenderer.ts）で以下の重複・非共通化が発生している：

| 機能 | 画面表示 | HTMLエクスポート | 共通化レベル |
|------|---------|-----------------|-------------|
| 文字単位ハイライト | CharDiffService使用 | 未実装 | 0% |
| 差分記号取得 | getPrefixSymbol() | getDiffSymbol() | 0%（重複） |
| 行クラス名生成 | getLineClassName() | インライン実装 | 0%（重複） |
| removed/addedペアリング | ブロック収集+位置マッチ | 単純フィルタ | 0% |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - HTMLエクスポートで文字単位ハイライト表示 (Priority: P1)

ユーザーが差分を含むファイルをHTMLエクスポートした際、画面表示と同様に変更された文字が個別にハイライトされる。

**Why this priority**: 画面表示とエクスポート結果の一貫性がユーザー体験の核心。現在最も大きな機能差分。

**Independent Test**: HTMLエクスポートを実行し、出力HTMLで削除文字に赤背景+取り消し線、追加文字に緑背景が適用されていることを確認。

**Acceptance Scenarios**:

1. **Given** 2つのテキストに文字レベルの差分がある、**When** HTMLエクスポートを実行、**Then** 出力HTMLで変更文字が個別にハイライト表示される
2. **Given** Unified表示モードで差分がある、**When** HTMLエクスポートを実行、**Then** 画面表示と同じペアリングロジックで文字ハイライトが適用される
3. **Given** Side-by-side表示モードで差分がある、**When** HTMLエクスポートを実行、**Then** 画面表示と同じペアリングロジックで文字ハイライトが適用される

---

### User Story 2 - 差分表示ユーティリティの一元管理 (Priority: P2)

開発者が差分表示に関する変更を行う際、単一のソースから変更できる。

**Why this priority**: 保守性とバグ修正の効率化。重複コードの排除により将来の機能追加が容易になる。

**Independent Test**: getPrefixSymbol、getLineClassNameを変更した際、画面表示とHTMLエクスポートの両方に反映されることを確認。

**Acceptance Scenarios**:

1. **Given** 差分記号の表示形式を変更したい、**When** 共通ユーティリティを修正、**Then** 画面表示とHTMLエクスポートの両方で変更が反映される
2. **Given** 行のスタイリングルールを変更したい、**When** 共通ユーティリティを修正、**Then** 画面表示とHTMLエクスポートの両方で変更が反映される

---

### User Story 3 - removed/addedペアリングロジックの共通化 (Priority: P2)

Unified表示でのremoved行とadded行のペアリングが、画面表示とHTMLエクスポートで同一の結果を返す。

**Why this priority**: 文字ハイライトの前提となるロジック。共通化により一貫した差分表示が可能。

**Independent Test**: 同じ入力データでDiffViewerとHTMLRendererのペアリング結果が一致することを確認。

**Acceptance Scenarios**:

1. **Given** 連続するremoved行とadded行がある、**When** ペアリング処理を実行、**Then** 画面表示とHTMLエクスポートで同じペアが生成される
2. **Given** removed行数とadded行数が異なる、**When** ペアリング処理を実行、**Then** 位置インデックスベースで正しくマッチングされる

---

### Edge Cases

- 非常に長い行（1000文字以上）での文字ハイライトのパフォーマンス
- 空行のみの差分でのペアリング動作
- removed/addedブロックが交互に出現する複雑なパターン
- 文字ハイライトが無効化されている場合のフォールバック

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: HTMLRendererはCharDiffServiceを使用して文字単位の差分を計算しなければならない
- **FR-002**: HTMLRendererはremoved/added行のペアリングにDiffViewerと同一のロジックを使用しなければならない
- **FR-003**: getPrefixSymbol関数は画面表示とHTMLエクスポートで共通化されなければならない
- **FR-004**: getLineClassName関数は画面表示とHTMLエクスポートで共通化されなければならない
- **FR-005**: エクスポートHTMLのCSSは文字レベルのハイライトスタイル（赤背景+取り消し線、緑背景）を含まなければならない
- **FR-006**: ペアリングロジックはサービス層に抽出され、両方のコンポーネントから利用可能でなければならない

### Key Entities

- **CharSegment**: 文字差分セグメント（type: 'unchanged' | 'removed' | 'added', text: string）
- **LineWithSegments**: 行データと文字セグメントのペア
- **DiffLine**: 差分行データ（type, content, lineNumber）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: HTMLエクスポート結果が画面表示と視覚的に一致する（文字ハイライト含む）
- **SC-002**: 差分記号取得の重複コードが0になる（単一ソース化）
- **SC-003**: 行クラス名生成の重複コードが0になる（単一ソース化）
- **SC-004**: ペアリングロジックが1箇所に集約される
- **SC-005**: 既存の画面表示機能に影響がない（リグレッションなし）

## 前提条件

- CharDiffServiceは既に実装済みで、画面表示で正常動作している
- 既存のHTMLエクスポート機能のテストが存在する場合、それらが引き続きパスする
- TypeScriptの型安全性を維持する
