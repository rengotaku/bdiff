# Phase 2 RED Tests

## Summary
- Phase: Phase 2 - User Story 3: Pairing Logic Common Foundation
- FAIL test count: 1 suite (28 tests)
- Test files: `src/__tests__/services/linePairingService.test.ts`

## FAIL Tests List

| Test File | Test Method | Expected Behavior |
|-----------|-------------|-------------------|
| linePairingService.test.ts | pairForUnifiedView - returns empty array for empty input | Empty array input returns empty array |
| linePairingService.test.ts | pairForUnifiedView - passes through unchanged lines | Unchanged lines returned without segments |
| linePairingService.test.ts | pairForUnifiedView - pairs consecutive removed/added with char diff disabled | Lines paired but no segments when disabled |
| linePairingService.test.ts | pairForUnifiedView - computes char segments for similar pairs | Similar lines get character segments |
| linePairingService.test.ts | pairForUnifiedView - handles multiple removed followed by added | Position-based pairing for blocks |
| linePairingService.test.ts | pairForUnifiedView - handles more removed than added | All lines preserved |
| linePairingService.test.ts | pairForUnifiedView - handles more added than removed | All lines preserved |
| linePairingService.test.ts | pairForUnifiedView - does not compute char diff for dissimilar | Dissimilar lines have no segments |
| linePairingService.test.ts | pairForUnifiedView - handles mixed unchanged and changed | Correct type ordering |
| linePairingService.test.ts | pairForUnifiedView - handles lines with only removed | Removed without added has no segments |
| linePairingService.test.ts | pairForUnifiedView - handles lines with only added | Added without removed has no segments |
| linePairingService.test.ts | pairForSideBySideView - returns empty arrays for empty input | Both original and modified empty |
| linePairingService.test.ts | pairForSideBySideView - separates lines correctly | Original = unchanged + removed, Modified = unchanged + added |
| linePairingService.test.ts | pairForSideBySideView - computes char segments for pairs | Paired lines get segments |
| linePairingService.test.ts | pairForSideBySideView - pairs by position index | Multiple pairs matched by index |
| linePairingService.test.ts | pairForSideBySideView - handles unchanged-only | Both sides same unchanged lines |
| linePairingService.test.ts | pairForSideBySideView - handles removed-only | Original has lines, modified empty |
| linePairingService.test.ts | pairForSideBySideView - handles added-only | Original empty, modified has lines |
| linePairingService.test.ts | pairForSideBySideView - no char diff when disabled | No segments when enableCharDiff = false |
| linePairingService.test.ts | pairForSideBySideView - handles mismatched counts | Handles more removed than added |
| linePairingService.test.ts | Edge Cases - handles empty string content | Empty content processed |
| linePairingService.test.ts | Edge Cases - handles very long lines | 10000+ char lines work |
| linePairingService.test.ts | Edge Cases - handles Unicode content | Non-ASCII chars work |
| linePairingService.test.ts | Edge Cases - handles Japanese characters | CJK chars work |
| linePairingService.test.ts | Edge Cases - handles special characters | HTML entities work |
| linePairingService.test.ts | Edge Cases - handles whitespace-only content | Spaces/tabs work |
| linePairingService.test.ts | Edge Cases - handles newline characters | Embedded newlines work |
| linePairingService.test.ts | Edge Cases - handles single character lines | Single chars work |

## Implementation Hints

### Required Interface (src/types/types.ts)

```typescript
export interface LineWithSegments {
  line: DiffLine;
  segments?: CharSegment[];
}
```

### Required Service (src/services/linePairingService.ts)

```typescript
import type { DiffLine, CharSegment } from '../types/types';
import { CharDiffService } from './charDiffService';

export interface LineWithSegments {
  line: DiffLine;
  segments?: CharSegment[];
}

export class LinePairingService {
  /**
   * Unified view pairing - finds removed/added blocks and pairs by position
   * @param lines - All diff lines
   * @param enableCharDiff - Whether to compute character-level diff
   * @returns Lines with optional character segments
   */
  static pairForUnifiedView(
    lines: DiffLine[],
    enableCharDiff: boolean
  ): LineWithSegments[]

  /**
   * Side-by-side view pairing - separates into original/modified columns
   * @param lines - All diff lines
   * @param enableCharDiff - Whether to compute character-level diff
   * @returns Separated lines for each column
   */
  static pairForSideBySideView(
    lines: DiffLine[],
    enableCharDiff: boolean
  ): {
    original: LineWithSegments[];
    modified: LineWithSegments[];
  }
}
```

### Key Implementation Notes

1. **Unified View Logic** (from DiffViewer.tsx lines 219-272):
   - Collect consecutive removed lines into a block
   - Collect consecutive added lines that follow
   - Match removed[i] with added[i] by position
   - Use `CharDiffService.shouldShowCharDiff()` to determine if char diff applies
   - Use `CharDiffService.calculateCharDiff()` to compute segments

2. **Side-by-Side View Logic** (from DiffViewer.tsx lines 153-203):
   - Filter: original = lines where type !== 'added'
   - Filter: modified = lines where type !== 'removed'
   - Match removed[i] with added[i] across columns
   - Apply char diff if enabled and lines are similar

3. **CharDiffService Integration**:
   - Already exists at `src/services/charDiffService.ts`
   - `shouldShowCharDiff(original, modified, threshold=0.6)` - returns boolean
   - `calculateCharDiff(original, modified)` - returns `{originalSegments, modifiedSegments}`

## FAIL Output Example

```
FAIL src/__tests__/services/linePairingService.test.ts [ src/__tests__/services/linePairingService.test.ts ]
Error: Failed to resolve import "../../services/linePairingService" from "src/__tests__/services/linePairingService.test.ts". Does the file exist?
Plugin: vite:import-analysis
File: /data/projects/bdiff/src/__tests__/services/linePairingService.test.ts:2:35
  1  |  import { describe, it, expect } from "vitest";
  2  |  import { LinePairingService } from "../../services/linePairingService";
     |                                      ^
  3  |  describe("LinePairingService", () => {

Test Files  1 failed (1)
      Tests  no tests
   Duration  358ms
```

## Next Steps

1. Add `LineWithSegments` interface to `src/types/types.ts`
2. Create `src/services/linePairingService.ts` with:
   - `pairForUnifiedView()` method
   - `pairForSideBySideView()` method
3. Run `npm test` to verify GREEN (all tests pass)
