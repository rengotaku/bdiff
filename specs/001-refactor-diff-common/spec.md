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

## Clarifications

### Session 2026-02-06

- Q: 共通化すべき箇所・すべきでない箇所は何か → A: 下記「共通化分析結果」参照
- Q: 共通化の判断基準は何か → A: 下記「共通化判断基準」参照
- Q: 共通化コンポーネントはどこに置くか → A: 下記「ファイル配置方針」参照
- Q: テストフレームワークは何を使うか → A: **Vitest**（Viteネイティブ、設定簡単、高速）

## 共通化判断基準

### 共通化すべき条件

| 基準 | 説明 |
|------|------|
| **同一ロジック・同一出力** | 入力が同じなら出力も同じであるべき |
| **バグ修正の波及** | 1箇所修正したら全箇所に反映すべき |
| **テスト容易性** | 1箇所テストすれば全体をカバー |
| **副作用なし** | 状態を持たない純粋関数 |

### 共通化すべきでない条件

| 基準 | 説明 |
|------|------|
| **出力形式が異なる** | 同じ概念でも出力が違う（Tailwind vs CSSクラス名） |
| **依存先が異なる** | React vs 静的HTML |
| **拡張方向が異なる** | 将来的に分岐する可能性 |
| **コンテキスト依存** | 実行環境に依存（DOM操作等） |

### 判断フロー

```
同じ機能か？
  ├─ Yes → 出力形式は同じか？
  │         ├─ Yes → 依存先は同じか？
  │         │         ├─ Yes → ✅ 共通化すべき
  │         │         └─ No  → ⚠️ アダプターで吸収検討
  │         └─ No  → ❌ 共通化すべきでない
  └─ No  → ❌ 共通化すべきでない
```

## ファイル配置方針

### 配置ルール

| 種類 | 配置先 | 基準 |
|------|--------|------|
| **純粋関数** | `src/utils/` | 副作用なし、入力→出力のみ |
| **ビジネスロジック** | `src/services/` | 複雑な計算、状態管理 |
| **型定義** | `src/types/` | interface, type のみ |
| **UIコンポーネント** | `src/components/` | React専用（共通化対象外） |

### 新規作成ファイル

| ファイル | 内容 |
|---------|------|
| `src/services/linePairingService.ts` | ペアリングロジック抽出 |
| `vitest.config.ts` | Vitest設定 |
| `src/services/__tests__/linePairingService.test.ts` | ペアリングロジックのテスト |
| `src/services/__tests__/charDiffService.test.ts` | 文字差分計算のテスト |

### 削除対象メソッド

| ファイル | 削除対象 |
|---------|---------|
| `services/export/renderers/HTMLRenderer.ts` | `getDiffSymbol()` |
| `services/export/renderers/BaseRenderer.ts` | `getPrefixSymbol()` |
| `services/svgDiffRenderer.ts` | `getPrefixSymbol()` |
| `utils/diffStyling.ts` | `getDiffSymbol()` |
| `services/htmlExportService.ts` | `escapeHtml()`

## 共通化分析結果

### 共通化すべき箇所（重複排除対象）

| 機能 | 現在の実装箇所 | 推奨統一先 | 理由 |
|------|---------------|-----------|------|
| **差分記号取得** | `utils/diffRendering.ts::getPrefixSymbol` | `utils/diffRendering.ts` | 既に共通化されているが未使用箇所あり |
| | `utils/diffStyling.ts::DiffStyler.getDiffSymbol` | （削除） | 重複 |
| | `services/export/renderers/BaseRenderer.ts::getPrefixSymbol` | （削除） | 重複 |
| | `services/export/renderers/HTMLRenderer.ts::getDiffSymbol` | （削除） | 重複 |
| | `services/svgDiffRenderer.ts::getPrefixSymbol` | （削除） | 重複 |
| **行クラス名生成** | `utils/diffRendering.ts::getLineClassName` | `utils/diffRendering.ts` | Tailwindクラス用（React向け） |
| | `utils/diffStyling.ts::DiffStyler.getLineClass` | 維持（CSS用） | 別用途：CSSクラス名のみ返す |
| **HTMLエスケープ** | `utils/htmlEscape.ts::escapeHtml` | `utils/htmlEscape.ts` | 既に共通化済み |
| | `services/htmlExportService.ts::escapeHtml` | （削除） | 重複・DOM依存 |
| **文字差分計算** | `services/charDiffService.ts` | 維持 | HTMLRendererで流用すべき |
| **ペアリングロジック** | `components/diff/DiffViewer.tsx`（内部） | 新規抽出：`services/linePairingService.ts` | 共通化必須 |

### 共通化すべきでない箇所（維持）

| 機能 | ファイル | 理由 |
|------|---------|------|
| **React用行スタイル** | `utils/diffRendering.ts::getLineClassName` | Tailwindクラス文字列を返す（React専用） |
| **CSS用行クラス** | `utils/diffStyling.ts::DiffStyler.getLineClass` | CSSクラス名のみ返す（HTML/SVG用） |
| **CharSegmentRenderer** | `components/diff/DiffViewer.tsx` | Reactコンポーネント（HTML版は別実装必要） |
| **SideBySidePanel/UnifiedPanel** | `components/diff/DiffViewer.tsx` | Reactコンポーネント（レンダリング層は分離） |
| **埋め込みCSS生成** | `services/tailwindEmbedded.ts` | HTMLエクスポート専用 |
| **SVG生成ロジック** | `services/svgDiffRenderer.ts` | SVGエクスポート専用（削除候補かは別検討） |

### 統合後の構成

```
src/
├── utils/
│   ├── diffRendering.ts      # 共通ユーティリティ（統一版）
│   │   ├── getPrefixSymbol()  # 差分記号（全箇所で使用）
│   │   ├── getLineClassName() # Tailwindクラス（React用）
│   │   └── formatLineForCopy()
│   ├── diffStyling.ts        # CSSクラス名（HTML/SVG用）
│   │   └── DiffStyler.getLineClass()
│   └── htmlEscape.ts         # HTMLエスケープ（共通）
├── services/
│   ├── charDiffService.ts    # 文字差分計算（共通）
│   ├── linePairingService.ts # 【新規】ペアリングロジック
│   └── export/
│       └── renderers/
│           └── HTMLRenderer.ts # CharDiffService + LinePairingService使用
└── components/
    └── diff/
        └── DiffViewer.tsx    # CharDiffService + LinePairingService使用
```

## 前提条件

- CharDiffServiceは既に実装済みで、画面表示で正常動作している
- 既存のHTMLエクスポート機能のテストが存在する場合、それらが引き続きパスする
- TypeScriptの型安全性を維持する
