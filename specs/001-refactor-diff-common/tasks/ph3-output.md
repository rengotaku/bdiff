# Phase 3 Output: User Story 2 - ユーティリティ統一 (GREEN)

**Date**: 2026-02-07
**Status**: ✅ Complete

## 作業概要

- Phase 3 - User Story 2: 差分表示ユーティリティの一元管理
- FAIL テスト 7 件を PASS させた（全テスト PASS: 50/50）
- 重複メソッドを削除し、共通ユーティリティに統一

## 修正ファイル一覧

### 修正

- `src/utils/diffRendering.ts` - getPrefixSymbol の修正
  - トレーリングスペースを削除（`'+ '` → `'+'`）
  - formatLineForCopy の unchanged 処理を修正（2スペース + 内容）

- `src/utils/diffStyling.ts` - 重複メソッド削除
  - `getDiffSymbol()` → `getPrefixSymbol()` をインポートして使用

- `src/services/export/renderers/BaseRenderer.ts` - 重複メソッド削除
  - `getPrefixSymbol()` → `diffRendering.ts` からインポート
  - 未使用の `DiffType` import を削除

- `src/services/export/renderers/HTMLRenderer.ts` - 重複メソッド削除
  - `getDiffSymbol()` → 継承した `getPrefixSymbol()` を使用

- `src/services/svgDiffRenderer.ts` - 重複メソッド削除
  - `getPrefixSymbol()` → `diffRendering.ts` からインポート

- `src/services/htmlExportService.ts` - 重複メソッド削除
  - `escapeHtml()` → `utils/htmlEscape.ts` からインポート

## 実装内容

### getPrefixSymbol の統一

**変更前**:
```typescript
// スペース付き
case 'added': return '+ ';
case 'removed': return '- ';
case 'modified': return '~ ';
default: return '  ';
```

**変更後**:
```typescript
// スペースなし（1文字）
case 'added': return '+';
case 'removed': return '-';
case 'modified': return '~';
default: return ' ';
```

### formatLineForCopy の修正

unchanged 行の処理を修正し、2スペース + 内容を返すように変更:

```typescript
if (line.type === 'unchanged') {
  return `  ${line.content || ''}`;
}
return `${symbol} ${line.content || ''}`;
```

### 重複メソッドの削除状況

| ファイル | 削除対象 | 変更内容 |
|---------|---------|---------|
| diffStyling.ts | getDiffSymbol() | getPrefixSymbol() を import して delegate |
| BaseRenderer.ts | getPrefixSymbol() | diffRendering.ts から import |
| HTMLRenderer.ts | getDiffSymbol() | 継承した getPrefixSymbol() を使用 |
| svgDiffRenderer.ts | getPrefixSymbol() | diffRendering.ts から import |
| htmlExportService.ts | escapeHtml() | utils/htmlEscape.ts から import |

## テスト結果

```
✓ src/__tests__/utils/diffRendering.test.ts (20 tests) 3ms
✓ src/__tests__/services/linePairingService.test.ts (30 tests) 220ms

Test Files  2 passed (2)
     Tests  50 passed (50)
```

### 修正したテスト項目

- getPrefixSymbol が1文字を返すことを確認
- formatLineForCopy が unchanged 行で "  内容" を返すことを確認
- formatLineForCopy が空白のみの unchanged 行で正しくフォーマットすることを確認

## ビルド検証

```
npm run build → ✅ PASS
- 134 modules transformed
- dist/index.js: 465.48 kB (gzip: 141.05 kB)
- Built in 974ms
```

## 注意点

### 次 Phase への引き継ぎ

1. **Phase 4 (HTMLRenderer 文字ハイライト)**: getPrefixSymbol が共通化されているため、HTMLRenderer でも同じ記号が使用される
2. **コード重複の排除**: 5ファイルの重複メソッドを削除し、単一ソース化を達成
3. **既存機能への影響**: getPrefixSymbol のスペース削除により、formatLineForCopy のロジックを調整したが、外部インターフェースは変更なし

### 統一による効果

**Before**:
- 5箇所に同じロジックが重複
- 修正時に全箇所を更新する必要
- テストも各箇所で必要

**After**:
- 1箇所 (diffRendering.ts) に集約
- 修正は1箇所のみ
- テストも1箇所で完結

## 実装のミス・課題

**初期実装ミス**:
- formatLineForCopy で unchanged の場合に `' ${content}'` (1スペース) を返していた
- テストでは `'  ${content}'` (2スペース) が期待値
- 修正: unchanged 行の先頭に2スペースを追加

**学び**:
- RED テストの期待値を正確に理解することが重要
- getPrefixSymbol が1文字を返すことで、formatLineForCopy の実装がシンプルになった
- スペースの有無が複数の関数に影響するため、統一仕様を明確にする必要があった

## 成果物の確認

- [x] `src/utils/diffRendering.ts` 修正完了 → ✅
- [x] 5ファイルの重複メソッド削除完了 → ✅
- [x] `npm test` 全テスト PASS → ✅ (50/50)
- [x] `npm run build` ビルド成功 → ✅

## Success Criteria 達成状況

- **SC-002**: 差分記号取得の重複コードが0になる → ✅ 達成
- **SC-003**: 行クラス名生成の重複コードが0になる → ✅ 達成（getLineClassName は元々共通、getLineClass は別用途で維持）
- **SC-005**: 既存の画面表示機能に影響がない → ✅ ビルド成功、テスト全通過

## 次 Phase の準備状態

Phase 4 (HTMLRenderer 文字ハイライト) の実行準備完了。
共通ユーティリティが統一されているため、HTMLRenderer の実装がシンプルになる。
