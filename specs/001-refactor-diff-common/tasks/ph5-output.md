# Phase 5 Output

## 作業概要
- Phase 5 - DiffViewer 統合の実装完了
- DiffViewer.tsx を LinePairingService 使用に変更
- 独自のペアリングロジック（107 行）を削除し、共通サービスに統合

## 修正ファイル一覧
- `src/components/diff/DiffViewer.tsx` - LinePairingService 統合
  - CharDiffService import を LinePairingService に変更
  - types.ts の LineWithSegments を import に追加
  - 独自の LineWithSegments interface 定義削除（lines 88-91）
  - Side-by-side view のペアリングロジック（52 行）を LinePairingService.pairForSideBySideView 呼び出しに置き換え
  - Unified view のペアリングロジック（67 行）を LinePairingService.pairForUnifiedView 呼び出しに置き換え
  - コード行数: 299 行 → 192 行（35.8% 削減）

## テスト結果
- 合計: 84 tests
- 成功: 84 tests (100%)
- 失敗: 0 tests

**前 Phase からの改善**: Phase 4 で失敗していた 1 件のテスト（char-removed style）が Phase 4 の修正により PASS に変更されました。

## 実装の詳細

### 1. Import 変更
```typescript
// 変更前
import { CharDiffService } from '../../services/charDiffService';

// 変更後
import type { DiffLine, ViewMode, CharSegment, LineWithSegments } from '../../types/types';
import { LinePairingService } from '../../services/linePairingService';
```

### 2. 重複インターフェース削除
独自の `LineWithSegments` interface（lines 88-91）を削除し、types.ts の定義を使用するように変更。

### 3. Side-by-side View ペアリング簡素化
```typescript
// 変更前（52 行の独自ペアリングロジック）
const originalLines = lines.filter(l => l.type !== 'added');
const modifiedLines = lines.filter(l => l.type !== 'removed');
// ... 47 行の位置ベースマッチング + CharDiffService 呼び出し ...

// 変更後（3 行）
const { original, modified } = LinePairingService.pairForSideBySideView(lines, enableCharDiff);
return {
  originalLinesWithSegments: original,
  modifiedLinesWithSegments: modified
};
```

### 4. Unified View ペアリング簡素化
```typescript
// 変更前（67 行の独自ペアリングロジック）
const result: LineWithSegments[] = [];
let i = 0;
while (i < lines.length) {
  // ... 64 行のブロック収集 + 位置マッチング + CharDiffService 呼び出し ...
}
return result;

// 変更後（1 行）
return LinePairingService.pairForUnifiedView(lines, enableCharDiff);
```

## 検証結果

### テスト検証
- ✅ 全 84 テストが PASS（100%）
- ✅ Phase 4 の失敗テスト 1 件も解決
- ✅ LinePairingService のテスト 30 件を含む

### ビルド検証
- ✅ TypeScript コンパイル成功
- ✅ Vite ビルド成功
- ✅ バンドルサイズ: 466.29 kB (gzip: 141.29 kB)

### コード品質検証
- ✅ 重複コード削除: 107 行（35.8%）
- ✅ 単一責任原則: ペアリングロジックがサービス層に集約
- ✅ 型安全性: types.ts の統一 interface 使用
- ✅ 保守性向上: DiffViewer と HTMLRenderer が同一サービスを使用

## 注意点

### 次 Phase への引き継ぎ
- Phase 6 (Polish) で最終クリーンアップを実施
- 不要な import がないか確認
- TODO コメントがないか確認
- quickstart.md の検証チェックリスト実行

### 画面表示の動作
LinePairingService を使用することで、DiffViewer と HTMLRenderer が**完全に同一のペアリングロジック**を共有するようになりました。

**利点**:
1. 画面表示と HTML エクスポートの一貫性保証
2. バグ修正が 1 箇所（LinePairingService）で完結
3. テストカバレッジの向上（サービス層でテスト済み）

### アーキテクチャの改善

**変更前**:
```
DiffViewer.tsx (299 行)
├─ 独自 LineWithSegments interface
├─ Side-by-side ペアリングロジック (52 行)
└─ Unified ペアリングロジック (67 行)

HTMLRenderer.ts
├─ 独自ペアリングロジック
└─ CharDiffService 統合
```

**変更後**:
```
LinePairingService (156 行) ← 単一ソース
├─ pairForSideBySideView()
└─ pairForUnifiedView()
    ↓ 共通利用
DiffViewer.tsx (192 行) ← 35.8% 削減
HTMLRenderer.ts ← 既に統合済み（Phase 4）
```

## 実装のミス・課題
特になし。設計通りに実装完了。

LinePairingService への統合により、以下の目標を達成:
- ✅ FR-006: ペアリングロジックがサービス層に抽出され、両方のコンポーネントから利用可能
- ✅ SC-004: ペアリングロジックが 1 箇所に集約
- ✅ SC-005: 既存の画面表示機能に影響なし（全テスト PASS）

## リファクタリングの効果

| 指標 | 変更前 | 変更後 | 改善 |
|------|--------|--------|------|
| DiffViewer.tsx 行数 | 299 行 | 192 行 | -107 行（-35.8%） |
| 重複ペアリングロジック | 2 箇所 | 0 箇所 | 完全共通化 |
| ペアリングロジックテスト | なし | 30 tests | 新規カバレッジ |
| 保守対象ファイル数 | 2 ファイル | 1 サービス | 一元管理 |
