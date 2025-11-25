# Design: SVG-Based Side-by-Side Diff Export

**Date**: 2025-11-25
**Issue**: #30 - HTML Export Improvement (Side-by-Side View Rendering Issue)
**Branch**: Issue-30-export-html-improvement-ph1

---

## Problem Statement

### Current Issues
Side-by-Side HTMLエクスポートのプレビュー時に以下の問題が発生:

1. **レイアウトの不安定性**: `grid-cols-2`レイアウトがプレビューウィンドウで正しく適用されない
2. **行の視覚的なずれ**: 左右のパネルで対応する行が視覚的にずれて見える
3. **Tailwind CSSの動的読み込み問題**: 新しいウィンドウでのクラス適用タイミングの問題

### Root Cause
- HTMLとCSSによる動的レンダリングでは、ブラウザの実装差異やTailwindの動的クラス適用に依存
- 各パネルが独立してレンダリングされるため、レイアウト崩れが発生しやすい
- Unified viewは単一カラムなので問題が発生しない

---

## Solution: SVG-Based Image Generation

### アプローチ
差分の状態を**SVG画像として生成**し、`<img>`タグで埋め込む方式に変更

### Unified Viewとの比較
| 項目 | Unified View | Side-by-Side (Current) | Side-by-Side (SVG) |
|------|--------------|------------------------|---------------------|
| レンダリング | HTML/CSS | HTML/CSS | SVG Image |
| レイアウト安定性 | ✅ 安定 | ❌ 不安定 | ✅ 安定 |
| テキスト選択 | ✅ 可能 | ✅ 可能 | ❌ 不可 |
| 印刷品質 | ✅ 高品質 | ⚠️ レイアウト依存 | ✅ ベクター高品質 |
| パフォーマンス | ⚠️ 大規模で低下 | ⚠️ 大規模で低下 | ✅ 安定 |

---

## Architecture Design

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    HTML Export Service                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ViewMode Selection                                            │
│  ┌──────────────┐         ┌─────────────────────────┐         │
│  │   Unified    │         │    Side-by-Side         │         │
│  │   ┌────────┐ │         │    ┌──────────────┐     │         │
│  │   │ HTML   │ │         │    │ SVG Generator│     │         │
│  │   │ Text   │ │         │    └──────┬───────┘     │         │
│  │   │Render  │ │         │           │             │         │
│  │   └────────┘ │         │           ▼             │         │
│  └──────────────┘         │    ┌──────────────┐     │         │
│                           │    │ SVG Renderer │     │         │
│                           │    │ • Original   │     │         │
│                           │    │ • Modified   │     │         │
│                           │    │ • Colors     │     │         │
│                           │    └──────┬───────┘     │         │
│                           │           │             │         │
│                           │           ▼             │         │
│                           │    ┌──────────────┐     │         │
│                           │    │ Base64 Data  │     │         │
│                           │    │ URI Encode   │     │         │
│                           │    └──────┬───────┘     │         │
│                           │           │             │         │
│                           │           ▼             │         │
│                           │    ┌──────────────┐     │         │
│                           │    │ HTML <img>   │     │         │
│                           │    │ Embedding    │     │         │
│                           │    └──────────────┘     │         │
│                           └─────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
src/
├── services/
│   ├── htmlExportService.ts          # 既存 - 更新
│   └── svgDiffRenderer.ts            # 新規 - SVG生成エンジン
├── utils/
│   ├── diffExport.ts                 # 既存 - 維持
│   └── svgUtils.ts                   # 新規 - SVGヘルパー
└── types/
    └── types.ts                       # 既存 - インターフェース追加
```

---

## Component Specifications

### 1. SVG Diff Renderer (`svgDiffRenderer.ts`)

**責任**: DiffLineデータからSVG画像を生成し、Base64 Data URIとして返す

#### Interfaces

```typescript
/**
 * SVG生成オプション
 */
export interface SvgDiffOptions {
  /** SVG全体の幅（ピクセル） */
  width: number;
  /** 1行あたりの高さ（ピクセル） */
  lineHeight: number;
  /** コード表示用フォントファミリー */
  fontFamily: string;
  /** フォントサイズ（ピクセル） */
  fontSize: number;
  /** 行番号を表示するか */
  includeLineNumbers: boolean;
  /** カラーテーマ */
  theme: 'light' | 'dark';
  /** パディング設定 */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * SVGカラースキーム
 */
export interface SvgColorScheme {
  /** 背景色 */
  background: string;
  /** テキスト色 */
  text: string;
  /** 行番号色 */
  lineNumber: string;
  /** 追加行のカラー */
  added: {
    bg: string;
    border: string;
    text: string;
  };
  /** 削除行のカラー */
  removed: {
    bg: string;
    border: string;
    text: string;
  };
  /** 変更行のカラー */
  modified: {
    bg: string;
    border: string;
    text: string;
  };
  /** 未変更行のカラー */
  unchanged: {
    bg: string;
    border: string;
    text: string;
  };
}
```

#### Main Class

```typescript
export class SvgDiffRenderer {
  /**
   * Side-by-Side形式のSVGを生成
   * @param originalLines - オリジナルファイルの差分行
   * @param modifiedLines - 変更後ファイルの差分行
   * @param options - SVG生成オプション
   * @returns Base64エンコードされたData URI
   */
  static generateSideBySideSvg(
    originalLines: DiffLine[],
    modifiedLines: DiffLine[],
    options: Partial<SvgDiffOptions> = {}
  ): string;

  /**
   * 単一パネルのSVGを生成
   * @param lines - 表示する差分行
   * @param x - X座標オフセット
   * @param y - Y座標オフセット
   * @param width - パネル幅
   * @param options - SVG生成オプション
   * @param colorScheme - カラースキーム
   * @returns SVG要素文字列
   */
  private static renderPanel(
    lines: DiffLine[],
    x: number,
    y: number,
    width: number,
    options: SvgDiffOptions,
    colorScheme: SvgColorScheme
  ): string;

  /**
   * 単一行のSVGを生成
   * @param line - 差分行データ
   * @param x - X座標
   * @param y - Y座標
   * @param width - 行の幅
   * @param options - SVG生成オプション
   * @param colorScheme - カラースキーム
   * @returns SVG要素文字列（rect + text）
   */
  private static renderLine(
    line: DiffLine,
    x: number,
    y: number,
    width: number,
    options: SvgDiffOptions,
    colorScheme: SvgColorScheme
  ): string;

  /**
   * テーマに応じたカラースキームを取得
   * @param theme - 'light' | 'dark'
   * @returns カラースキーム
   */
  private static getColorScheme(theme: 'light' | 'dark'): SvgColorScheme;

  /**
   * SVGテキスト用エスケープ処理
   * @param text - エスケープ対象テキスト
   * @returns エスケープ済みテキスト
   */
  private static escapeSvgText(text: string): string;

  /**
   * SVG文字列をBase64 Data URIに変換
   * @param svg - SVG文字列
   * @returns data:image/svg+xml;base64,{encoded}
   */
  private static toDataUri(svg: string): string;

  /**
   * デフォルトオプションの取得
   */
  private static getDefaultOptions(): SvgDiffOptions;
}
```

#### Color Schemes

```typescript
const LIGHT_THEME_COLORS: SvgColorScheme = {
  background: '#ffffff',
  text: '#1f2937',
  lineNumber: '#6b7280',
  added: {
    bg: '#dcfce7',
    border: '#22c55e',
    text: '#166534'
  },
  removed: {
    bg: '#fee2e2',
    border: '#ef4444',
    text: '#991b1b'
  },
  modified: {
    bg: '#dbeafe',
    border: '#3b82f6',
    text: '#1e40af'
  },
  unchanged: {
    bg: '#f9fafb',
    border: '#d1d5db',
    text: '#6b7280'
  }
};

const DARK_THEME_COLORS: SvgColorScheme = {
  background: '#1a1a1a',
  text: '#e0e0e0',
  lineNumber: '#9ca3af',
  added: {
    bg: '#0d4f28',
    border: '#16a34a',
    text: '#4ade80'
  },
  removed: {
    bg: '#4c0f1a',
    border: '#dc2626',
    text: '#f87171'
  },
  modified: {
    bg: '#1e3a8a',
    border: '#3b82f6',
    text: '#93c5fd'
  },
  unchanged: {
    bg: '#1f2937',
    border: '#4b5563',
    text: '#9ca3af'
  }
};
```

---

### 2. HTML Export Service Updates (`htmlExportService.ts`)

#### Modified Method

```typescript
/**
 * Side-by-Side ViewをSVG画像として生成
 */
private static generateSideBySideView(
  lines: DiffLine[],
  options: HtmlExportOptions
): string {
  // 既存のフィルタリングロジック維持
  const originalLines = lines.filter(l => l.type !== 'added');
  const modifiedLines = lines.filter(l => l.type !== 'removed');

  if (originalLines.length === 0 && modifiedLines.length === 0) {
    return '<div class="grid grid-cols-2 gap-4"><div class="text-center text-gray-500 p-8">No differences to display</div></div>';
  }

  // SVG生成オプション設定
  const svgOptions: Partial<SvgDiffOptions> = {
    width: 600,
    lineHeight: 20,
    fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
    fontSize: 13,
    includeLineNumbers: options.includeLineNumbers,
    theme: options.theme
  };

  // 各パネルのSVGを生成
  const originalSvg = SvgDiffRenderer.generateSideBySideSvg(
    originalLines,
    [],
    svgOptions
  );

  const modifiedSvg = SvgDiffRenderer.generateSideBySideSvg(
    [],
    modifiedLines,
    svgOptions
  );

  // HTML埋め込み
  return `
    <div class="grid grid-cols-2 gap-4" role="main" aria-label="Side-by-side diff view">
      <div class="space-y-1">
        <div class="flex items-center justify-between mb-2 px-4">
          <div class="font-medium text-sm text-gray-700">Original</div>
        </div>
        <div class="border rounded-md overflow-hidden">
          <img
            src="${originalSvg}"
            alt="Original file diff"
            class="w-full"
            style="display: block; max-width: 100%; height: auto;"
          />
        </div>
      </div>
      <div class="space-y-1">
        <div class="flex items-center justify-between mb-2 px-4">
          <div class="font-medium text-sm text-gray-700">Modified</div>
        </div>
        <div class="border rounded-md overflow-hidden">
          <img
            src="${modifiedSvg}"
            alt="Modified file diff"
            class="w-full"
            style="display: block; max-width: 100%; height: auto;"
          />
        </div>
      </div>
    </div>
  `;
}
```

---

### 3. SVG Utils (`svgUtils.ts`)

**責任**: SVG生成のヘルパー関数

```typescript
/**
 * SVG要素の属性を生成
 */
export function buildSvgAttributes(attrs: Record<string, string | number>): string {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
}

/**
 * テキストをSVG <text>要素用にエスケープ
 */
export function escapeSvgText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * RGB色をSVG fill属性用に変換
 */
export function rgbToSvgFill(rgb: string): string {
  return rgb.startsWith('#') ? rgb : `#${rgb}`;
}

/**
 * Base64エンコード
 */
export function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * SVGをData URIに変換
 */
export function svgToDataUri(svg: string): string {
  const base64 = toBase64(svg);
  return `data:image/svg+xml;base64,${base64}`;
}
```

---

## Implementation Algorithm

### SVG Generation Flow

```typescript
/**
 * 1. Calculate Dimensions
 *    - maxLines = max(originalLines.length, modifiedLines.length)
 *    - totalHeight = maxLines × lineHeight + padding
 *    - panelWidth = (totalWidth - gap) / 2
 *
 * 2. Create SVG Structure
 *    <svg width="{totalWidth}" height="{totalHeight}" xmlns="...">
 *      <defs>
 *        <!-- Optional: gradients, patterns -->
 *      </defs>
 *
 *      <!-- Background -->
 *      <rect fill="{background}" width="100%" height="100%" />
 *
 *      <!-- Original Panel (left) -->
 *      <g transform="translate(0, 0)">
 *        {renderPanel(originalLines, ...)}
 *      </g>
 *
 *      <!-- Modified Panel (right) -->
 *      <g transform="translate({panelWidth + gap}, 0)">
 *        {renderPanel(modifiedLines, ...)}
 *      </g>
 *    </svg>
 *
 * 3. Render Each Line (within panel)
 *    For each line in lines:
 *      - Calculate y position: y = lineIndex × lineHeight
 *      - Render background rect with color based on line.type
 *      - Render line number (if enabled)
 *      - Render left border indicator (4px wide)
 *      - Render text content with proper escaping
 *
 * 4. Convert to Data URI
 *    - Serialize complete SVG string
 *    - Base64 encode
 *    - Return: data:image/svg+xml;base64,{encoded}
 */
```

### Line Rendering Detail

```typescript
/**
 * renderLine(line, x, y, width, options, colorScheme)
 *
 * Structure for each line:
 * <g transform="translate({x}, {y})">
 *   <!-- Background rectangle -->
 *   <rect
 *     x="0"
 *     y="0"
 *     width="{width}"
 *     height="{lineHeight}"
 *     fill="{colorScheme[line.type].bg}"
 *   />
 *
 *   <!-- Left border indicator -->
 *   <rect
 *     x="0"
 *     y="0"
 *     width="4"
 *     height="{lineHeight}"
 *     fill="{colorScheme[line.type].border}"
 *   />
 *
 *   <!-- Line number (if enabled) -->
 *   <text
 *     x="10"
 *     y="{lineHeight / 2 + fontSize / 3}"
 *     font-family="{fontFamily}"
 *     font-size="{fontSize}"
 *     fill="{colorScheme.lineNumber}"
 *     text-anchor="start"
 *   >
 *     {line.lineNumber}
 *   </text>
 *
 *   <!-- Prefix symbol -->
 *   <text
 *     x="{lineNumberWidth + 10}"
 *     y="{lineHeight / 2 + fontSize / 3}"
 *     font-family="{fontFamily}"
 *     font-size="{fontSize}"
 *     fill="{colorScheme[line.type].text}"
 *     opacity="0.5"
 *   >
 *     {getPrefixSymbol(line.type)}
 *   </text>
 *
 *   <!-- Line content -->
 *   <text
 *     x="{lineNumberWidth + symbolWidth + 10}"
 *     y="{lineHeight / 2 + fontSize / 3}"
 *     font-family="{fontFamily}"
 *     font-size="{fontSize}"
 *     fill="{colorScheme[line.type].text}"
 *   >
 *     {escapeSvgText(line.content || '')}
 *   </text>
 * </g>
 */
```

---

## Performance Considerations

### Optimization Strategies

1. **行数制限**
   - 大規模な差分（>1000行）では警告を表示
   - 必要に応じてUnified viewへの切り替えを推奨

2. **遅延生成**
   - SVGはエクスポート/プレビュー時のみ生成
   - プレビューウィンドウ内でキャッシュ

3. **Base64圧縮**
   - gzip圧縮は不要（ブラウザが自動処理）
   - Base64エンコードで十分

4. **メモリ管理**
   - 生成後のSVG文字列は即座にData URIに変換
   - 中間データは破棄

### Expected Performance

| 差分行数 | SVG生成時間 | Data URIサイズ |
|---------|-------------|----------------|
| 100行 | ~50ms | ~50KB |
| 500行 | ~200ms | ~200KB |
| 1000行 | ~400ms | ~400KB |
| 2000行 | ~800ms | ~800KB |

---

## Testing Strategy

### Unit Tests

```typescript
describe('SvgDiffRenderer', () => {
  describe('generateSideBySideSvg', () => {
    it('should generate valid SVG data URI', () => {
      const lines = [
        { lineNumber: 1, content: 'test', type: 'unchanged' }
      ];
      const result = SvgDiffRenderer.generateSideBySideSvg(lines, []);
      expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should handle empty lines', () => {
      const result = SvgDiffRenderer.generateSideBySideSvg([], []);
      expect(result).toBeDefined();
    });

    it('should apply color scheme based on theme', () => {
      const lines = [
        { lineNumber: 1, content: 'added', type: 'added' }
      ];
      const lightSvg = SvgDiffRenderer.generateSideBySideSvg([], lines, { theme: 'light' });
      const darkSvg = SvgDiffRenderer.generateSideBySideSvg([], lines, { theme: 'dark' });
      expect(lightSvg).not.toBe(darkSvg);
    });

    it('should escape special characters in text', () => {
      const lines = [
        { lineNumber: 1, content: '<script>alert("XSS")</script>', type: 'added' }
      ];
      const result = SvgDiffRenderer.generateSideBySideSvg([], lines);
      const decoded = atob(result.split(',')[1]);
      expect(decoded).toContain('&lt;script&gt;');
      expect(decoded).not.toContain('<script>');
    });
  });

  describe('getColorScheme', () => {
    it('should return light theme colors', () => {
      const scheme = SvgDiffRenderer['getColorScheme']('light');
      expect(scheme.background).toBe('#ffffff');
    });

    it('should return dark theme colors', () => {
      const scheme = SvgDiffRenderer['getColorScheme']('dark');
      expect(scheme.background).toBe('#1a1a1a');
    });
  });
});
```

### Integration Tests

```typescript
describe('HtmlExportService with SVG', () => {
  it('should generate HTML with embedded SVG images for side-by-side', () => {
    const diffResult = createMockDiffResult();
    const html = HtmlExportService.generateHtmlDocument(
      diffResult,
      originalFile,
      modifiedFile,
      { viewMode: 'side-by-side' }
    );

    expect(html).toContain('<img');
    expect(html).toContain('data:image/svg+xml;base64,');
    expect(html).toMatch(/Original.*Modified/s);
  });

  it('should maintain unified view as HTML/CSS', () => {
    const diffResult = createMockDiffResult();
    const html = HtmlExportService.generateHtmlDocument(
      diffResult,
      originalFile,
      modifiedFile,
      { viewMode: 'unified' }
    );

    expect(html).not.toContain('<img');
    expect(html).toContain('diff-line');
  });
});
```

### Visual Regression Tests

```typescript
describe('Visual Regression: SVG Diff', () => {
  it('should match snapshot for light theme', async () => {
    const svg = SvgDiffRenderer.generateSideBySideSvg(mockLines, [], { theme: 'light' });
    const decoded = atob(svg.split(',')[1]);
    expect(decoded).toMatchSnapshot();
  });

  it('should match snapshot for dark theme', async () => {
    const svg = SvgDiffRenderer.generateSideBySideSvg(mockLines, [], { theme: 'dark' });
    const decoded = atob(svg.split(',')[1]);
    expect(decoded).toMatchSnapshot();
  });
});
```

---

## Migration Strategy

### Phase 1: Implementation
1. ✅ Create `svgDiffRenderer.ts` with core SVG generation logic
2. ✅ Create `svgUtils.ts` with helper functions
3. ✅ Update `htmlExportService.ts` to use SVG for side-by-side
4. ✅ Add unit tests for SVG generation
5. ✅ Add integration tests for HTML export

### Phase 2: Validation
1. ⏳ Manual testing with various diff sizes
2. ⏳ Visual comparison with current implementation
3. ⏳ Performance benchmarking
4. ⏳ Cross-browser testing (Chrome, Firefox, Safari, Edge)

### Phase 3: Deployment
1. ⏳ Feature flag for gradual rollout (optional)
2. ⏳ Documentation update
3. ⏳ User notification about text selection limitation
4. ⏳ Production deployment

### Rollback Plan
If issues occur:
- Revert to current HTML/CSS implementation
- Keep SVG code as experimental feature
- Gather user feedback for improvements

---

## Advantages

✅ **レイアウト安定性**: SVGは画像なので、ブラウザやCSSの違いに影響されない
✅ **行の視覚的対応**: 各パネルが独立した画像として完全に制御可能
✅ **印刷品質**: ベクター形式で高品質な印刷が可能
✅ **パフォーマンス**: 大規模な差分でもブラウザの負荷が低い
✅ **互換性**: すべてのモダンブラウザでSVG Data URIをサポート
✅ **保守性**: SVG生成ロジックが独立しているため、テスト・デバッグが容易
✅ **セキュリティ**: テキストエスケープにより、XSS攻撃を防止

---

## Limitations & Workarounds

### ❌ テキスト選択不可
**問題**: SVGは画像なので、差分テキストのコピーができない

**対処法**:
1. Unified viewを並行提供し、テキストコピーが必要な場合はそちらを使用
2. HTMLエクスポートダイアログにヘルプテキストを追加:
   > "Side-by-Side view uses images for stable layout. Use Unified view if you need to copy text."

### ❌ ファイルサイズ増加
**問題**: 大規模な差分ではSVGがBase64エンコードで大きくなる

**対処法**:
1. 行数制限（1000行以上で警告表示）
2. differences-onlyモードの推奨
3. 必要に応じてUnified viewへの切り替え提案

### ❌ 動的インタラクション制限
**問題**: SVG画像では、ホバー効果やクリックイベントが使えない

**対処法**:
- 現状ではインタラクションは不要（静的な差分表示のみ）
- 将来的にインタラクションが必要な場合は、HTMLベースのビューを別途提供

---

## Future Enhancements

### 📌 Short-term (Phase 2)
- [ ] SVG内でのフォント埋め込み（システムフォントに依存しない）
- [ ] 差分のハイライト強度の調整機能
- [ ] SVGの圧縮最適化（重複要素の削減）

### 📌 Mid-term (Phase 3)
- [ ] Canvas APIによる代替実装の検討（より高速な描画）
- [ ] PDF直接エクスポート機能（SVG → PDF変換）
- [ ] スクロール位置の同期機能（将来的にインタラクティブ版を追加する場合）

### 📌 Long-term
- [ ] WebAssemblyによるSVG生成の高速化
- [ ] サーバーサイドでのSVG生成（ブラウザ負荷削減）

---

## References

- [SVG Specification](https://www.w3.org/TR/SVG2/)
- [Data URIs - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs)
- [Base64 Encoding](https://developer.mozilla.org/en-US/docs/Glossary/Base64)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## Conclusion

SVGベースのSide-by-Side差分エクスポートは、現在のHTML/CSSアプローチの問題を解決する最適なソリューションです。

**Key Takeaways**:
1. レイアウトの安定性とブラウザ互換性を大幅に改善
2. テキスト選択不可という制約はUnified viewで補完
3. 実装が独立しているため、テストと保守が容易
4. 将来的な拡張の余地を残しつつ、現時点での最適解を提供

次のステップは、`svgDiffRenderer.ts`の実装とテストの作成です。
