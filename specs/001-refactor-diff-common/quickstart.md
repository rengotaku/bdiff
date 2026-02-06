# Quickstart: 差分表示ロジックの共通化リファクタリング

**Branch**: `001-refactor-diff-common`
**Date**: 2026-02-06

## 前提条件

- Node.js 18+
- npm

## セットアップ

```bash
# ブランチに切り替え
git checkout 001-refactor-diff-common

# 依存関係インストール（Vitest含む）
npm install

# 開発サーバー起動
npm run dev
```

## テスト実行

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ
npm run test:coverage
```

## 実装順序

### Step 1: Vitest導入

```bash
npm install -D vitest jsdom @testing-library/react
```

`vitest.config.ts`:
```typescript
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

`package.json`に追加:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Step 2: getPrefixSymbol統一

`src/utils/diffRendering.ts`:
```typescript
// スペースを削除（統一）
export const getPrefixSymbol = (type: DiffLine['type']): string => {
  switch (type) {
    case 'added': return '+';
    case 'removed': return '-';
    case 'modified': return '~';
    default: return ' ';
  }
};
```

各ファイルで重複メソッドを削除し、importに置き換え:
```typescript
import { getPrefixSymbol } from '../utils/diffRendering';
```

### Step 3: LinePairingService作成

`src/services/linePairingService.ts`:
```typescript
import { DiffLine, CharSegment } from '../types/types';
import { CharDiffService } from './charDiffService';

export interface LineWithSegments {
  line: DiffLine;
  segments?: CharSegment[];
}

export class LinePairingService {
  static pairForUnifiedView(
    lines: DiffLine[],
    enableCharDiff: boolean
  ): LineWithSegments[] {
    // DiffViewerから移植したロジック
  }

  static pairForSideBySideView(
    lines: DiffLine[],
    enableCharDiff: boolean
  ): { original: LineWithSegments[]; modified: LineWithSegments[] } {
    // DiffViewerから移植したロジック
  }
}
```

### Step 4: HTMLRenderer更新

`src/services/export/renderers/HTMLRenderer.ts`:
```typescript
import { CharDiffService } from '../../charDiffService';
import { LinePairingService } from '../../linePairingService';
import { getPrefixSymbol } from '../../../utils/diffRendering';
import { escapeHtml } from '../../../utils/htmlEscape';

// renderCharSegmentsメソッド追加
private renderCharSegments(segments: CharSegment[]): string {
  return segments.map(seg => {
    if (seg.type === 'removed') {
      return `<span class="char-removed">${escapeHtml(seg.text)}</span>`;
    } else if (seg.type === 'added') {
      return `<span class="char-added">${escapeHtml(seg.text)}</span>`;
    }
    return escapeHtml(seg.text);
  }).join('');
}
```

### Step 5: CSS追加

埋め込みCSSに追加:
```css
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

## 検証チェックリスト

- [ ] `npm run build` が成功する
- [ ] `npm test` が全てパスする
- [ ] 画面表示で文字ハイライトが動作する
- [ ] HTMLエクスポートで文字ハイライトが含まれる
- [ ] Side-by-side / Unified 両モードで正常動作

## トラブルシューティング

### Vitestが見つからない

```bash
npm install -D vitest
```

### テストが失敗する

```bash
# 詳細ログ
npm test -- --reporter=verbose
```

### ビルドエラー

```bash
# 型チェック
npx tsc --noEmit
```
