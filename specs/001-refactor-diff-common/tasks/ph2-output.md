# Phase 2 Output: User Story 3 - LinePairingService (GREEN)

**Date**: 2026-02-07
**Status**: ✅ Complete

## 作業概要

- Phase 2 - User Story 3: removed/addedペアリングロジックの共通化
- FAIL テスト 28 件を PASS させた（全テスト PASS）
- LinePairingService を新規作成し、DiffViewer から抽出したペアリングロジックを共通化

## 修正ファイル一覧

### 新規作成

- `src/services/linePairingService.ts` - ペアリングロジックサービス
  - `pairForUnifiedView()`: Unified view 用のペアリング処理
  - `pairForSideBySideView()`: Side-by-side view 用のペアリング処理

### 修正

- `src/types/types.ts` - 型定義追加
  - `LineWithSegments` interface を追加（DiffLine + オプショナルな CharSegment[]）

## 実装内容

### LinePairingService.pairForUnifiedView()

**アルゴリズム**:
1. 連続する removed 行ブロックを収集
2. 続く added 行ブロックを収集
3. removed[i] と added[i] を位置インデックスで対応付け
4. enableCharDiff=true かつ類似度が高い場合のみ CharDiffService で文字セグメント計算
5. 類似度が低い、または enableCharDiff=false の場合は segments なしで追加

**特徴**:
- ペアリングは enableCharDiff の値に関わらず常に実行
- enableCharDiff は文字セグメント計算の有無のみを制御
- removed > added または removed < added の不均衡ケースに対応

### LinePairingService.pairForSideBySideView()

**アルゴリズム**:
1. 行を original (unchanged + removed) と modified (unchanged + added) に分離
2. original[i] と modified[i] を位置インデックスで対応付け
3. 両方が removed/added のペアで、類似度が高い場合のみ CharDiffService で計算
4. それ以外は segments なしで追加

**特徴**:
- 2カラム表示のため、行の分離が最初に実行される
- ペアリングは分離後の配列間で行う

## テスト結果

```
✓ src/__tests__/services/linePairingService.test.ts (30 tests) 227ms

Test Files  1 passed (1)
     Tests  30 passed (30)
```

### テストカバレッジ

- **pairForUnifiedView**: 11 テスト
  - 空配列処理
  - unchanged 行のパススルー
  - 連続 removed/added のペアリング
  - 文字セグメント計算（enableCharDiff=true）
  - 複数ペアの処理
  - removed > added、removed < added の不均衡ケース
  - 類似度が低い行の処理
  - mixed unchanged/changed 行
  - removed のみ、added のみのケース

- **pairForSideBySideView**: 10 テスト
  - 空配列処理
  - original/modified への分離
  - 文字セグメント計算
  - 位置ベースペアリング
  - unchanged のみ、removed のみ、added のみ
  - enableCharDiff=false の処理
  - 不均衡ケース

- **Edge Cases**: 9 テスト
  - 空文字列
  - 10000文字超の長い行
  - Unicode 文字
  - 日本語文字
  - 特殊文字
  - 空白のみ
  - 改行文字を含む
  - 1文字のみの行
  - modified タイプの行

## ビルド検証

```
npm run build → ✅ PASS
- 134 modules transformed
- dist/index.js: 465.81 kB (gzip: 141.11 kB)
- Built in 976ms
```

## 注意点

### 次 Phase への引き継ぎ

1. **Phase 3 (ユーティリティ統一)**: LinePairingService は独立しているため、Phase 3 と並行実行可能
2. **Phase 4 (HTMLRenderer 統合)**: HTMLRenderer から LinePairingService を利用する際は、以下を import:
   ```typescript
   import { LinePairingService } from '../../services/linePairingService';
   import type { LineWithSegments } from '../../types/types';
   ```
3. **Phase 5 (DiffViewer 統合)**: DiffViewer から既存のペアリングロジックを削除し、LinePairingService に置き換え

### 既存コードへの影響

- **影響なし**: DiffViewer はまだ既存ロジックを使用中
- **型定義追加**: LineWithSegments が types.ts に追加されたが、既存コードには影響なし
- **リグレッションなし**: 既存のビルド・実行には一切影響なし

## 実装のミス・課題

**初期実装ミス**:
- 当初、`enableCharDiff=false` の場合に `lines.map(line => ({ line }))` で early return していた
- これによりペアリングロジック自体がスキップされ、テストが失敗
- 修正: ペアリングロジックは常に実行し、`enableCharDiff` は文字セグメント計算の有無のみを制御

**学び**:
- ペアリング（行の並び順の最適化）と文字差分計算（segments 追加）は独立した関心事
- enableCharDiff はあくまで「文字レベルのハイライト表示」のフラグであり、「ペアリングの実行」のフラグではない
- DiffViewer の既存実装を正確に理解することが重要

## 成果物の確認

- [x] `src/services/linePairingService.ts` 存在確認 → ✅
- [x] `src/types/types.ts` に `LineWithSegments` 追加 → ✅
- [x] `npm test` 全テスト PASS → ✅ (30/30)
- [x] `npm run build` ビルド成功 → ✅

## 次 Phase の準備状態

Phase 3 (ユーティリティ統一) の実行準備完了。
