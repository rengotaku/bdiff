# Phase 4 RED Tests

## サマリー
- Phase: Phase 4 - HTMLエクスポート文字ハイライト (US1)
- FAIL テスト数: 18
- テストファイル: src/__tests__/services/export/HTMLRenderer.test.ts

## FAIL テスト一覧

| テストファイル | テストメソッド | 期待動作 |
|---------------|---------------|---------|
| HTMLRenderer.test.ts | renderCharSegments > converts unchanged segments to plain escaped text | CharSegment[] を HTML 文字列に変換 |
| HTMLRenderer.test.ts | renderCharSegments > wraps removed segments with char-removed class | removed セグメントを `<span class="char-removed">` でラップ |
| HTMLRenderer.test.ts | renderCharSegments > wraps added segments with char-added class | added セグメントを `<span class="char-added">` でラップ |
| HTMLRenderer.test.ts | renderCharSegments > combines multiple segments correctly | 複数セグメントを正しく結合 |
| HTMLRenderer.test.ts | renderCharSegments > escapes HTML special characters in segment text | セグメント内の HTML 特殊文字をエスケープ |
| HTMLRenderer.test.ts | renderCharSegments > handles empty segments array | 空配列を空文字列に変換 |
| HTMLRenderer.test.ts | renderCharSegments > handles segments with empty text | 空テキストセグメントを処理 |
| HTMLRenderer.test.ts | Unified View > renders character-level highlighting for similar removed/added pairs | 類似行ペアに文字ハイライト適用 |
| HTMLRenderer.test.ts | Unified View > applies char-removed class to deleted characters | 削除文字に char-removed クラス適用 |
| HTMLRenderer.test.ts | Unified View > applies char-added class to inserted characters | 追加文字に char-added クラス適用 |
| HTMLRenderer.test.ts | Unified View > correctly pairs multiple consecutive removed/added blocks | 連続ブロックを正しくペアリング |
| HTMLRenderer.test.ts | Side-by-Side View > renders character-level highlighting for paired removed/added lines | ペアリングされた行に文字ハイライト適用 |
| HTMLRenderer.test.ts | Side-by-Side View > applies char-removed in original panel | Original パネルに char-removed 適用 |
| HTMLRenderer.test.ts | Side-by-Side View > applies char-added in modified panel | Modified パネルに char-added 適用 |
| HTMLRenderer.test.ts | CSS Styles > includes char-removed CSS class definition | .char-removed CSS 定義を含む |
| HTMLRenderer.test.ts | CSS Styles > includes char-added CSS class definition | .char-added CSS 定義を含む |
| HTMLRenderer.test.ts | CSS Styles > char-removed style includes text-decoration line-through | 取り消し線スタイルを含む |
| HTMLRenderer.test.ts | Edge Cases > handles very long lines with character differences | 長い行でも文字ハイライト適用 |

## 実装ヒント

### 1. renderCharSegments メソッドの実装

`src/services/export/renderers/HTMLRenderer.ts` に以下を追加:

```typescript
import type { CharSegment } from '../../../types/types';

/**
 * Convert CharSegment[] to HTML string with highlighting
 */
private renderCharSegments(segments: CharSegment[]): string {
  return segments.map(seg => {
    const escapedText = this.escapeHtml(seg.text);
    if (seg.type === 'removed') {
      return `<span class="char-removed">${escapedText}</span>`;
    } else if (seg.type === 'added') {
      return `<span class="char-added">${escapedText}</span>`;
    }
    return escapedText;
  }).join('');
}
```

### 2. LinePairingService と CharDiffService のインポート

```typescript
import { LinePairingService } from '../../linePairingService';
import { CharDiffService } from '../../charDiffService';
```

### 3. generateUnifiedView の更新

LinePairingService.pairForUnifiedView を使用して行をペアリングし、
segments がある場合は renderCharSegments を使用:

```typescript
private generateUnifiedView(lines: DiffLine[], options: Required<HtmlExportOptions>): string {
  const pairedLines = LinePairingService.pairForUnifiedView(lines, true);
  // pairedLines.forEach で LineWithSegments を処理
  // lineWithSegments.segments が存在する場合は renderCharSegments を使用
}
```

### 4. generateSideBySideView の更新

LinePairingService.pairForSideBySideView を使用:

```typescript
private generateSideBySideView(lines: DiffLine[], options: Required<HtmlExportOptions>): string {
  const { original, modified } = LinePairingService.pairForSideBySideView(lines, true);
  // original と modified を別々にレンダリング
}
```

### 5. CSS スタイルの追加

getEmbeddedCSS メソッドに以下を追加:

```css
/* Character-level highlighting */
.char-removed {
  background-color: #fecaca;
  color: #991b1b;
  text-decoration: line-through;
}

.char-added {
  background-color: #bbf7d0;
  color: #166534;
}
```

## FAIL 出力例

```
FAIL: renderCharSegments > converts unchanged segments to plain escaped text
TypeError: renderer.renderCharSegments is not a function

FAIL: Unified View > renders character-level highlighting for similar removed/added pairs
AssertionError: expected '<!DOCTYPE html>...' to contain 'char-removed'

FAIL: CSS Styles > includes char-removed CSS class definition
AssertionError: expected '<!DOCTYPE html>...' to contain '.char-removed'
```

## テスト実行コマンド

```bash
# 全テスト実行
npm test

# HTMLRenderer テストのみ
npm test -- src/__tests__/services/export/HTMLRenderer.test.ts

# ウォッチモード
npm run test:watch
```

## 依存関係

- `LinePairingService` (Phase 2 で作成済み)
- `CharDiffService` (既存)
- `escapeHtml` (utils/htmlEscape.ts から継承済み)

## 注意事項

1. **renderCharSegments は private メソッド**: テストでは `(renderer as any).renderCharSegments` でアクセスするか、render 出力を通じて検証
2. **HTML エスケープ必須**: XSS 防止のため、セグメントテキストは必ずエスケープ
3. **類似度チェック**: CharDiffService.shouldShowCharDiff で類似度を確認し、十分に類似している場合のみ文字ハイライトを適用
4. **既存テストを壊さない**: 50 テストが既に PASS しているので、それらを壊さないこと
