# Phase 1 Output: Setup (Vitest導入・既存コード確認)

**Date**: 2026-02-07
**Status**: ✅ Complete

## Completed Tasks

- [x] T001: Install Vitest and dependencies (`npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom`)
- [x] T002: Create vitest.config.ts at project root
- [x] T003: Update package.json test scripts
- [x] T004: Read DiffViewer.tsx
- [x] T005: Read HTMLRenderer.ts
- [x] T006: Read charDiffService.ts
- [x] T007: Read diffRendering.ts
- [x] T008: Read htmlEscape.ts
- [x] T009: Verify `npm run build` passes

## Setup Summary

### Vitest Configuration

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

### Package.json Scripts

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

## Existing Code Analysis

### DiffViewer.tsx (src/components/diff/DiffViewer.tsx)

**Key Findings**:
- Contains `LineWithSegments` interface (line 88-91) - same as planned for LinePairingService
- Pairing logic for unified view (lines 219-272)
- Pairing logic for side-by-side view (lines 153-203)
- Uses `CharDiffService.shouldShowCharDiff` and `CharDiffService.calculateCharDiff`
- Already imports from `utils/diffRendering` (`getLineClassName`, `getPrefixSymbol`)

**Extraction Target**:
- Unified view pairing logic → `LinePairingService.pairForUnifiedView`
- Side-by-side pairing logic → `LinePairingService.pairForSideBySideView`

### HTMLRenderer.ts (src/services/export/renderers/HTMLRenderer.ts)

**Key Findings**:
- Has its own `getDiffSymbol` method (lines 268-279) - duplicate of `getPrefixSymbol`
- No character-level highlighting implementation
- Uses `this.escapeHtml` from BaseRenderer
- `generateUnifiedView` and `generateSideBySideView` need updating for char diff

**Missing**:
- CharDiffService integration
- LinePairingService integration
- Character highlight CSS (`.char-removed`, `.char-added`)

### charDiffService.ts (src/services/charDiffService.ts)

**Key Findings**:
- Complete Myers algorithm implementation
- `calculateCharDiff(original, modified)` → `{originalSegments, modifiedSegments}`
- `shouldShowCharDiff(original, modified, threshold=0.6)` → boolean
- Uses LCS for similarity check

**Status**: Ready for use in HTMLRenderer

### diffRendering.ts (src/utils/diffRendering.ts)

**Key Findings**:
- `getPrefixSymbol` returns with trailing space (`'+ '`, `'- '`)
- Other implementations return without space (`'+'`, `'-'`)
- Needs modification to remove trailing space for consistency

### htmlEscape.ts (src/utils/htmlEscape.ts)

**Key Findings**:
- Already shared utility
- `escapeHtml(text)` function ready for use
- Also has `escapeMarkdown` for future use

## Duplicate Methods Identified

| Method | Location 1 | Location 2 | Action |
|--------|-----------|-----------|--------|
| `getPrefixSymbol` | diffRendering.ts (space) | HTMLRenderer.getDiffSymbol (no space) | Unify to diffRendering.ts, remove space |
| `escapeHtml` | htmlEscape.ts | BaseRenderer.escapeHtml | Use htmlEscape.ts, remove from BaseRenderer |

## Next Phase Prerequisites

For Phase 2 (LinePairingService):
1. Types: `LineWithSegments` interface needs to be added to `types/types.ts`
2. Service: Create `src/services/linePairingService.ts`
3. Tests: Create `src/__tests__/services/linePairingService.test.ts`

## Build Verification

```
npm run build → ✅ PASS
- 134 modules transformed
- dist/index.js: 465.81 kB (gzip: 141.11 kB)
- Built in 977ms
```
