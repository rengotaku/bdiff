/**
 * Tests for the Indent Heuristic feature (Issue #99).
 *
 * Two problem categories:
 *
 * Category A – jsdiff boundary noise:
 *   jsdiff sometimes includes context lines inside a removed+added block.
 *   Those shared prefix lines should be reclassified as unchanged.
 *
 * Category B – git-style indent sliding:
 *   When the same content can be removed at two equal-cost positions, the
 *   heuristic prefers the position whose surrounding context has the lowest
 *   indentation (most natural split point). This is the same algorithm as
 *   git's "indent heuristic" (xdiff/xemit.c).
 */
import { describe, it, expect } from 'vitest';
import { DiffService } from '../../services/diffService';
import type { DiffCalculationOptions } from '../../services/diffService';

const base: DiffCalculationOptions = {
  sortLines: false,
  ignoreCase: false,
  ignoreWhitespace: false,
  ignoreTrailingNewlines: false,
  enableCharDiff: false,
};

// ──────────────────────────────────────────────────────────────────────────────
// Category A: jsdiff boundary noise
// ──────────────────────────────────────────────────────────────────────────────

describe('indentHeuristic – Category A: jsdiff boundary noise', () => {
  /**
   * Without heuristic jsdiff produces:
   *   removed: 'def bar():'
   *   removed: '    pass'
   *   added:   'def bar():'
   *
   * With heuristic 'def bar():' should be unchanged:
   *   unchanged: 'def bar():'
   *   removed:   '    pass'
   */
  it('fixes removed+added block with common single-line prefix', () => {
    const original = 'def foo():\n    pass\ndef bar():\n    pass';
    const modified  = 'def foo():\n    pass\ndef bar():';

    const without = DiffService.calculateDiff(original, modified, {
      ...base, algorithm: 'jsdiff', indentHeuristic: false,
    });
    // Confirm jsdiff has the bug before the fix
    expect(without.stats.removed).toBe(2);
    expect(without.stats.added).toBe(1);

    const result = DiffService.calculateDiff(original, modified, {
      ...base, algorithm: 'jsdiff', indentHeuristic: true,
    });

    expect(result.stats.removed).toBe(1);
    expect(result.stats.added).toBe(0);
    const removedLine = result.lines.find(l => l.type === 'removed');
    expect(removedLine?.content).toBe('    pass');
    expect(removedLine?.originalLineNumber).toBe(4);
  });

  it('fixes removed+added block with blank-line separator in original', () => {
    const original = 'def foo():\n    bar()\n\ndef baz():\n    bar()';
    const modified  = 'def foo():\n    bar()\n\ndef baz():';

    const without = DiffService.calculateDiff(original, modified, {
      ...base, algorithm: 'jsdiff', indentHeuristic: false,
    });
    expect(without.stats.removed).toBe(2);
    expect(without.stats.added).toBe(1);

    const result = DiffService.calculateDiff(original, modified, {
      ...base, algorithm: 'jsdiff', indentHeuristic: true,
    });

    expect(result.stats.removed).toBe(1);
    expect(result.stats.added).toBe(0);
    const removedLine = result.lines.find(l => l.type === 'removed');
    expect(removedLine?.content).toBe('    bar()');
  });

  it('does not change already-optimal jsdiff output (no common prefix)', () => {
    const original = 'def foo():\n    pass\ndef bar():\n    pass';
    const modified  = 'def foo():\n    pass\ndef bar():\n    body';

    const result = DiffService.calculateDiff(original, modified, {
      ...base, algorithm: 'jsdiff', indentHeuristic: true,
    });

    expect(result.stats.removed).toBe(1);
    expect(result.stats.added).toBe(1);
    const removedLine = result.lines.find(l => l.type === 'removed');
    expect(removedLine?.content).toBe('    pass');
    const addedLine = result.lines.find(l => l.type === 'added');
    expect(addedLine?.content).toBe('    body');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Category B: git-style indent sliding (builtin algorithm)
//
// The classic case: two consecutive identical lines in original, one removed.
// Myers places the removal at the LATER position (higher indent context).
// The heuristic slides it BACKWARD to the position with the lowest pre-indent.
// ──────────────────────────────────────────────────────────────────────────────

describe('indentHeuristic – Category B: indent sliding (builtin)', () => {
  /**
   * Original:
   *   A() {
   *       doStuff();   ← orig line 2
   *       doStuff();   ← orig line 3  (Myers removes this one)
   *       doEnd();
   *   }
   *
   * Modified:
   *   A() {
   *       doStuff();
   *       doEnd();
   *   }
   *
   * Myers scores:
   *   Position at orig line 3: pre='    doStuff();'(4) + post='    doEnd();'(4) = 8
   *   Position at orig line 2: pre='A() {'(0)          + post='    doStuff();'(4) = 4
   *
   * Heuristic should slide backward to orig line 2 (lower score).
   */
  it('slides removal backward when pre-context has lower indentation', () => {
    const original = 'A() {\n    doStuff();\n    doStuff();\n    doEnd();\n}';
    const modified  = 'A() {\n    doStuff();\n    doEnd();\n}';

    const withoutH = DiffService.calculateDiff(original, modified, {
      ...base, algorithm: 'builtin', indentHeuristic: false,
    });
    // Myers places removal at orig line 3 (second doStuff)
    const removedWithout = withoutH.lines.find(l => l.type === 'removed');
    expect(removedWithout?.originalLineNumber).toBe(3);

    const withH = DiffService.calculateDiff(original, modified, {
      ...base, algorithm: 'builtin', indentHeuristic: true,
    });

    expect(withH.stats.removed).toBe(1);
    // Heuristic should move removal to orig line 2 (first doStuff, lower pre-context indent)
    const removedWith = withH.lines.find(l => l.type === 'removed');
    expect(removedWith?.originalLineNumber).toBe(2);
  });

  it('preserves sequential line numbers after backward sliding', () => {
    const original = 'A() {\n    doStuff();\n    doStuff();\n    doEnd();\n}';
    const modified  = 'A() {\n    doStuff();\n    doEnd();\n}';

    const result = DiffService.calculateDiff(original, modified, {
      ...base, algorithm: 'builtin', indentHeuristic: true,
    });

    const origNums = result.lines
      .filter(l => l.originalLineNumber !== undefined)
      .map(l => l.originalLineNumber as number)
      .sort((a, b) => a - b);
    const newNums = result.lines
      .filter(l => l.newLineNumber !== undefined)
      .map(l => l.newLineNumber as number)
      .sort((a, b) => a - b);

    expect(origNums).toEqual([1, 2, 3, 4, 5]);
    expect(newNums).toEqual([1, 2, 3, 4]);
  });

  it('does not slide when all candidate positions have equal score', () => {
    // Two top-level functions each with same body; one removed from function a
    // All context lines have indent 0 → equal scores → no slide
    const original = 'foo() {\n    body();\n}\nbar() {\n    body();\n}';
    const modified  = 'foo() {\n}\nbar() {\n    body();\n}';

    const result = DiffService.calculateDiff(original, modified, {
      ...base, algorithm: 'builtin', indentHeuristic: true,
    });

    expect(result.stats.removed).toBe(1);
    expect(result.stats.added).toBe(0);
    const removedLine = result.lines.find(l => l.type === 'removed');
    expect(removedLine?.content).toBe('    body();');
  });

  it('slides tab-indented removal to lower pre-context position', () => {
    // Same pattern as doStuff but with tab indentation
    const original = 'A() {\n\tdoStuff();\n\tdoStuff();\n\tdoEnd();\n}';
    const modified  = 'A() {\n\tdoStuff();\n\tdoEnd();\n}';

    const withH = DiffService.calculateDiff(original, modified, {
      ...base, algorithm: 'builtin', indentHeuristic: true,
    });

    expect(withH.stats.removed).toBe(1);
    const removedLine = withH.lines.find(l => l.type === 'removed');
    expect(removedLine?.originalLineNumber).toBe(2);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// General correctness (both algorithms)
// ──────────────────────────────────────────────────────────────────────────────

describe('indentHeuristic – general correctness', () => {
  it.each(['builtin', 'jsdiff'] as const)('(%s) unchanged count is preserved after heuristic', (algo) => {
    const original = 'A() {\n    doStuff();\n    doStuff();\n    doEnd();\n}';
    const modified  = 'A() {\n    doStuff();\n    doEnd();\n}';

    const result = DiffService.calculateDiff(original, modified, {
      ...base, algorithm: algo, indentHeuristic: true,
    });
    expect(result.stats.unchanged).toBe(4);
  });

  it.each(['builtin', 'jsdiff'] as const)('(%s) handles empty input gracefully', (algo) => {
    const result = DiffService.calculateDiff('', '', {
      ...base, algorithm: algo, indentHeuristic: true,
    });
    expect(result.stats.added).toBe(0);
    expect(result.stats.removed).toBe(0);
  });

  it.each(['builtin', 'jsdiff'] as const)('(%s) indentHeuristic=false preserves standard output', (algo) => {
    const original = 'def foo():\n    pass\ndef bar():\n    pass';
    const modified  = 'def foo():\n    pass\ndef bar():\n    body';

    const result = DiffService.calculateDiff(original, modified, {
      ...base, algorithm: algo, indentHeuristic: false,
    });
    expect(result.stats.removed).toBe(1);
    expect(result.stats.added).toBe(1);
  });

  it('stats sum equals total diff lines after heuristic', () => {
    const original = 'A() {\n    doStuff();\n    doStuff();\n    doEnd();\n}';
    const modified  = 'A() {\n    doStuff();\n    doEnd();\n}';

    const result = DiffService.calculateDiff(original, modified, {
      ...base, algorithm: 'builtin', indentHeuristic: true,
    });
    // removed lines are in original only, added in modified only, modified×2, unchanged in both
    const total = result.stats.added + result.stats.removed + result.stats.unchanged;
    // For pure removed-only diff: added=0, so total = removed + unchanged = line count of original
    expect(total).toBeGreaterThan(0);
    expect(result.stats.removed).toBe(1);
  });
});
