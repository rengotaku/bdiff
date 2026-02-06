# Research: 差分表示ロジックの共通化リファクタリング

**Branch**: `001-refactor-diff-common`
**Date**: 2026-02-06

## 調査項目

### 1. テストフレームワーク選定

**Decision**: Vitest

**Rationale**:
- Viteプロジェクトとのネイティブ統合
- 設定不要（vite.config.tsを自動読み込み）
- Jest互換API（移行コスト低）
- 高速なHMRベースのテスト実行

**Alternatives considered**:
- Jest: 広く普及しているが、Viteとの統合に追加設定が必要
- テストなし: リファクタリングにはリグレッション検出が必須のため却下

### 2. getPrefixSymbol統一方法

**Decision**: `utils/diffRendering.ts::getPrefixSymbol`を正規版とし、他の実装を削除

**Rationale**:
- 既に存在する共通関数を活用
- 5箇所の重複実装をすべて置き換え
- スペース有無の差異は呼び出し側で対応（`.trim()`または別途フォーマット）

**現状分析**:
| 実装箇所 | 戻り値 | 備考 |
|---------|-------|------|
| `diffRendering.ts` | `'+ '` | スペース付き |
| `diffStyling.ts` | `'+'` | スペースなし |
| `BaseRenderer.ts` | `'+'` | スペースなし |
| `HTMLRenderer.ts` | `'+'` | スペースなし |
| `svgDiffRenderer.ts` | `'+'` | スペースなし |

**統一案**: スペースなし版を標準とし、`diffRendering.ts`を修正

### 3. LinePairingServiceの設計

**Decision**: DiffViewerから抽出したロジックをサービス化

**Rationale**:
- 画面表示とHTMLエクスポートで同一結果を保証
- 純粋関数として実装（テスト容易）
- CharDiffServiceと組み合わせて使用

**API設計**:
```typescript
class LinePairingService {
  // Unified view用
  static pairForUnifiedView(
    lines: DiffLine[],
    enableCharDiff: boolean
  ): LineWithSegments[]

  // Side-by-side view用
  static pairForSideBySideView(
    lines: DiffLine[],
    enableCharDiff: boolean
  ): { original: LineWithSegments[], modified: LineWithSegments[] }
}
```

### 4. HTMLRenderer文字ハイライト実装

**Decision**: CharDiffServiceを直接使用し、HTML文字列として出力

**Rationale**:
- 既存のCharDiffServiceのロジックを再利用
- ReactのJSXではなくHTML文字列生成
- CSSクラスでスタイリング

**実装方針**:
```typescript
// CharSegment[] → HTML文字列
private renderCharSegments(segments: CharSegment[]): string {
  return segments.map(seg => {
    const className = seg.type === 'removed'
      ? 'char-removed'
      : seg.type === 'added'
        ? 'char-added'
        : '';
    return className
      ? `<span class="${className}">${escapeHtml(seg.text)}</span>`
      : escapeHtml(seg.text);
  }).join('');
}
```

### 5. Vitest設定

**Decision**: 最小限の設定でVitestを導入

**設定ファイル**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

**パッケージ追加**:
```bash
npm install -D vitest @testing-library/react jsdom
```

## 未解決事項

なし（すべてのNEEDS CLARIFICATIONが解決済み）
