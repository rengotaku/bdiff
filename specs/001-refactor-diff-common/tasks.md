# Tasks: 差分表示ロジックの共通化リファクタリング

**Input**: Design documents from `/specs/001-refactor-diff-common/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: TDD is MANDATORY for User Story phases. Each phase follows テスト実装 (RED) → 実装 (GREEN) → 検証 workflow.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: No dependencies (different files, execution order free)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## User Story Summary

| ID | Title | Priority | FR | Scenario |
|----|-------|----------|----|----------|
| US1 | HTMLエクスポートで文字単位ハイライト表示 | P1 | FR-001, FR-002, FR-005 | シナリオ1-3 |
| US2 | 差分表示ユーティリティの一元管理 | P2 | FR-003, FR-004 | シナリオ1-2 |
| US3 | removed/addedペアリングロジックの共通化 | P2 | FR-006 | シナリオ1-2 |

## Path Conventions

- **Project Type**: Single (フロントエンドSPA)
- **Source**: `src/`
- **Tests**: `src/__tests__/`

---

## Phase 1: Setup (Vitest導入・既存コード確認) — NO TDD

**Purpose**: テスト環境構築と既存実装の確認

- [X] T001 Install Vitest and dependencies: `npm install -D vitest jsdom @testing-library/react`
- [X] T002 [P] Create vitest.config.ts at project root
- [X] T003 [P] Update package.json test scripts
- [X] T004 [P] Read current implementation in src/components/diff/DiffViewer.tsx
- [X] T005 [P] Read current implementation in src/services/export/renderers/HTMLRenderer.ts
- [X] T006 [P] Read current implementation in src/services/charDiffService.ts
- [X] T007 [P] Read current implementation in src/utils/diffRendering.ts
- [X] T008 [P] Read current implementation in src/utils/htmlEscape.ts
- [X] T009 Verify `npm run build` passes (baseline check)
- [X] T010 Generate phase output: specs/001-refactor-diff-common/tasks/ph1-output.md

---

## Phase 2: User Story 3 - ペアリングロジック共通化 (Priority: P2) — Foundation

**Goal**: DiffViewerからペアリングロジックを抽出し、LinePairingServiceとして共通化

**Independent Test**: LinePairingService単体テストで動作確認

**Note**: US1の前提となるため先に実装

### 入力

- [x] T011 Read previous phase output: specs/001-refactor-diff-common/tasks/ph1-output.md

### テスト実装 (RED)

- [x] T012 [P] [US3] Create test directory: src/__tests__/services/
- [x] T013 [P] [US3] Implement test for pairForUnifiedView in src/__tests__/services/linePairingService.test.ts
- [x] T014 [P] [US3] Implement test for pairForSideBySideView in src/__tests__/services/linePairingService.test.ts
- [x] T015 [P] [US3] Implement edge case tests (empty array, mismatched counts) in src/__tests__/services/linePairingService.test.ts
- [x] T016 Verify `npm test` FAIL (RED) - LinePairingService not found
- [x] T017 Generate RED output: specs/001-refactor-diff-common/red-tests/ph2-test.md

### 実装 (GREEN)

- [x] T018 Read RED tests: specs/001-refactor-diff-common/red-tests/ph2-test.md
- [x] T019 [US3] Add LineWithSegments interface to src/types/types.ts
- [x] T020 [US3] Create src/services/linePairingService.ts with pairForUnifiedView
- [x] T021 [US3] Add pairForSideBySideView to src/services/linePairingService.ts
- [x] T022 Verify `npm test` PASS (GREEN)

### 検証

- [x] T023 Verify `npm run build` passes
- [x] T024 Generate phase output: specs/001-refactor-diff-common/tasks/ph2-output.md

**Checkpoint**: LinePairingService should be fully functional and tested

---

## Phase 3: User Story 2 - ユーティリティ統一 (Priority: P2)

**Goal**: 重複しているgetPrefixSymbol、escapeHtmlを統一

**Independent Test**: 共通ユーティリティ変更後もビルド・テストが通る

### 入力

- [x] T025 Read previous phase output: specs/001-refactor-diff-common/tasks/ph2-output.md

### テスト実装 (RED)

- [x] T026 [P] [US2] Create test for getPrefixSymbol in src/__tests__/utils/diffRendering.test.ts
- [x] T027 Verify `npm test` FAIL (RED) - 新仕様（スペースなし）のテストのため FAIL
- [x] T028 Generate RED output: specs/001-refactor-diff-common/red-tests/ph3-test.md

### 実装 (GREEN)

- [x] T029 Read RED tests: specs/001-refactor-diff-common/red-tests/ph3-test.md
- [x] T030 [US2] Update getPrefixSymbol in src/utils/diffRendering.ts (remove trailing space)
- [x] T031 [P] [US2] Delete getDiffSymbol from src/utils/diffStyling.ts, add import from diffRendering
- [x] T032 [P] [US2] Delete getPrefixSymbol from src/services/export/renderers/BaseRenderer.ts, add import
- [x] T033 [P] [US2] Delete getDiffSymbol from src/services/export/renderers/HTMLRenderer.ts, add import
- [x] T034 [P] [US2] Delete getPrefixSymbol from src/services/svgDiffRenderer.ts, add import
- [x] T035 [P] [US2] Delete escapeHtml from src/services/htmlExportService.ts, add import from utils/htmlEscape
- [x] T036 Verify `npm test` PASS (GREEN)

### 検証

- [x] T037 Verify `npm run build` passes
- [x] T038 Generate phase output: specs/001-refactor-diff-common/tasks/ph3-output.md

**Checkpoint**: All duplicate methods removed, single source of truth established

---

## Phase 4: User Story 1 - HTMLエクスポート文字ハイライト (Priority: P1) — MVP

**Goal**: HTMLRendererで文字単位ハイライトを実装し、画面表示と一致させる

**Independent Test**: HTMLエクスポート結果に文字ハイライト用spanが含まれる

### 入力

- [x] T039 Read previous phase output: specs/001-refactor-diff-common/tasks/ph3-output.md

### テスト実装 (RED)

- [x] T040 [P] [US1] Create test for renderCharSegments in src/__tests__/services/export/HTMLRenderer.test.ts
- [x] T041 [P] [US1] Create test for unified view with char diff in src/__tests__/services/export/HTMLRenderer.test.ts
- [x] T042 [P] [US1] Create test for side-by-side view with char diff in src/__tests__/services/export/HTMLRenderer.test.ts
- [x] T043 Verify `npm test` FAIL (RED)
- [x] T044 Generate RED output: specs/001-refactor-diff-common/red-tests/ph4-test.md

### 実装 (GREEN)

- [x] T045 Read RED tests: specs/001-refactor-diff-common/red-tests/ph4-test.md
- [x] T046 [US1] Add CharDiffService import to src/services/export/renderers/HTMLRenderer.ts
- [x] T047 [US1] Add LinePairingService import to src/services/export/renderers/HTMLRenderer.ts
- [x] T048 [US1] Implement renderCharSegments method in HTMLRenderer.ts
- [x] T049 [US1] Update generateUnifiedView to use LinePairingService and renderCharSegments
- [x] T050 [US1] Update generateSideBySideView to use LinePairingService and renderCharSegments
- [x] T051 [US1] Add char highlight CSS (.char-removed, .char-added) to embedded CSS in HTMLRenderer.ts
- [x] T052 Verify `npm test` PASS (GREEN)

### 検証

- [x] T053 Verify `npm run build` passes
- [x] T054 Generate phase output: specs/001-refactor-diff-common/tasks/ph4-output.md

**Checkpoint**: HTML export should match screen display with character-level highlighting

---

## Phase 5: DiffViewer統合 — Integration

**Goal**: DiffViewerをLinePairingService使用に変更

**Independent Test**: 画面表示が変更前と同じ動作をする

### 入力

- [x] T055 Read previous phase output: specs/001-refactor-diff-common/tasks/ph4-output.md

### 実装

- [x] T056 [US3] Update src/components/diff/DiffViewer.tsx to use LinePairingService
- [x] T057 [US3] Remove inline pairing logic from DiffViewer.tsx
- [x] T058 Verify `npm test` PASS
- [x] T059 Verify `npm run build` passes

### 検証

- [x] T060 Manual verification: Compare screen display before/after
- [x] T061 Generate phase output: specs/001-refactor-diff-common/tasks/ph5-output.md

**Checkpoint**: Screen display unchanged, code simplified

---

## Phase 6: Polish & Cross-Cutting Concerns — NO TDD

**Purpose**: クリーンアップと最終検証

### 入力

- [ ] T062 Read previous phase output: specs/001-refactor-diff-common/tasks/ph5-output.md

### 実装

- [ ] T063 [P] Remove any unused imports across modified files
- [ ] T064 [P] Verify no TODO comments left in code
- [ ] T065 Run quickstart.md validation checklist

### 検証

- [ ] T066 Run `npm test` to verify all tests pass
- [ ] T067 Run `npm run build` for final build verification
- [ ] T068 Manual E2E: Compare screen display vs HTML export
- [ ] T069 Generate phase output: specs/001-refactor-diff-common/tasks/ph6-output.md

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (US3: LinePairingService) ← Foundation for US1
    ↓
Phase 3 (US2: Utility Unification)
    ↓
Phase 4 (US1: HTML Char Highlight) ← MVP Delivery Point
    ↓
Phase 5 (DiffViewer Integration)
    ↓
Phase 6 (Polish)
```

### Agent Delegation

- **Phase 1 (Setup)**: メインエージェント直接実行
- **Phase 2-4 (User Stories)**: tdd-generator (RED) → phase-executor (GREEN + 検証)
- **Phase 5-6 (Integration/Polish)**: phase-executor のみ

### [P] マーク（依存関係なし）

- Setup タスクの [P]: 異なるファイルの読み取りで相互依存なし
- RED テストの [P]: 異なるテストファイルへの書き込みで相互依存なし
- GREEN 実装の [P]: 異なるソースファイルへの書き込みで相互依存なし

---

## Phase Output & RED Test Artifacts

### Directory Structure

```
specs/001-refactor-diff-common/
├── tasks.md                    # This file
├── tasks/
│   ├── ph1-output.md           # Phase 1 output (Setup results)
│   ├── ph2-output.md           # Phase 2 output (US3 LinePairingService)
│   ├── ph3-output.md           # Phase 3 output (US2 Utility Unification)
│   ├── ph4-output.md           # Phase 4 output (US1 HTML Char Highlight)
│   ├── ph5-output.md           # Phase 5 output (DiffViewer Integration)
│   └── ph6-output.md           # Phase 6 output (Polish)
└── red-tests/
    ├── ph2-test.md             # Phase 2 RED test results
    ├── ph3-test.md             # Phase 3 RED test results
    └── ph4-test.md             # Phase 4 RED test results
```

---

## Implementation Strategy

### MVP First (Phase 1 → Phase 4)

1. Complete Phase 1: Setup (Vitest導入)
2. Complete Phase 2: LinePairingService (Foundation)
3. Complete Phase 3: Utility Unification
4. Complete Phase 4: HTML Char Highlight
5. **STOP and VALIDATE**: HTMLエクスポートで文字ハイライト確認

### Full Delivery

1. Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
2. Each phase commits: `feat(phase-N): description`

---

## Test Coverage Rules

**境界テストの原則**: データ変換が発生する**すべての境界**でテストを書く

```
[DiffLine[]] → [LinePairingService] → [CharDiffService] → [HTMLRenderer] → [HTML String]
      ↓              ↓                     ↓                   ↓              ↓
   テスト         テスト                テスト              テスト          テスト
```

**チェックリスト**:
- [ ] LinePairingService入出力テスト
- [ ] CharDiffService統合テスト (既存)
- [ ] HTMLRenderer文字セグメントレンダリングテスト
- [ ] End-to-End テスト（入力→HTML出力）

---

## Notes

- [P] tasks = no dependencies, execution order free
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- TDD: テスト実装 (RED) → FAIL 確認 → 実装 (GREEN) → PASS 確認
- RED output must be generated BEFORE implementation begins
- Commit after each phase completion
- Stop at any checkpoint to validate story independently
