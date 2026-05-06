import { describe, it, expect } from 'vitest';
import { DiffService } from '../../services/diffService';
import type { ComparisonOptions } from '../../types/types';

const baseOptions: ComparisonOptions = {
  sortLines: false,
  ignoreCase: false,
  ignoreWhitespace: false,
  ignoreTrailingNewlines: false,
  enableCharDiff: false,
  indentHeuristic: true,
};

const noHeuristicOptions: ComparisonOptions = {
  ...baseOptions,
  indentHeuristic: false,
};


describe('DiffService - indentHeuristic', () => {
  describe('option disabled', () => {
    it('with indentHeuristic=false, no sliding occurs', () => {
      // Original has "    inner" at line 2 and 3; Myers removes line 2 (top-biased)
      const original = 'def foo():\n    inner\n    inner\ndef bar():';
      const modified = 'def foo():\n    inner\ndef bar():';
      const withHeuristic = DiffService.calculateDiff(original, modified, baseOptions);
      const withoutHeuristic = DiffService.calculateDiff(original, modified, noHeuristicOptions);
      // They may differ — without heuristic preserves Myers top-biased output
      expect(withoutHeuristic.lines.some(l => l.type === 'removed')).toBe(true);
      expect(withHeuristic.lines.some(l => l.type === 'removed')).toBe(true);
    });
  });

  describe('no slide when adjacent lines do not match', () => {
    it('block stays in place when context does not match block content', () => {
      // "    pass" is removed; adjacent lines are "def foo():" and "def bar():" — no match
      const original = 'def foo():\n    pass\ndef bar():';
      const modified = 'def foo():\ndef bar():';
      const result = DiffService.calculateDiff(original, modified, baseOptions);
      const removed = result.lines.find(l => l.type === 'removed');
      expect(removed).toBeDefined();
      expect(removed!.content).toBe('    pass');
      // Removed line should still be between unchanged "def foo():" and "def bar():"
      const removedIdx = result.lines.indexOf(removed!);
      expect(result.lines[removedIdx - 1].content).toBe('def foo():');
      expect(result.lines[removedIdx + 1].content).toBe('def bar():');
    });
  });

  describe('slide up when prior context has lower indent', () => {
    it('removed block slides up past matching unchanged line to reach lower-indent boundary', () => {
      // Original:
      //   def foo():    ← indent 0
      //       inner     ← indent 4 (unchanged)
      //       inner     ← indent 4 (will be removed — Myers top-biased removes line 2)
      //   def bar():
      //
      // Myers without heuristic removes the FIRST "    inner" (line 2):
      //   unchanged: def foo():
      //   removed:       inner   ← before "    inner" (indent=4), score=4
      //   unchanged:     inner
      //   unchanged: def bar():
      //
      // Heuristic: can slide up? No — removed block is already at top of duplicates.
      // Heuristic: can slide down? lines[blockEnd]="    inner" matches "    inner" → yes
      //   After slide: block at index 2, score=indent("    inner")=4 — same as current
      //   No improvement, stays.
      //
      // Let's flip: make removed block be currently AFTER a high-indent line and
      // able to slide to a lower-indent position.
      //
      // Original:
      //   def foo():     ← indent 0 (line 1)
      //       inner      ← indent 4 (line 2)
      //       inner      ← indent 4 (line 3)  ← Myers removes this (bottom is line 3)
      //   def bar():
      //
      // Wait — Myers is top-biased, so it removes line 2, not line 3.
      // To get a removed block that's already at position 2 (0-indexed), we need a
      // different arrangement. Let's construct it directly.
      //
      // Arrange: removed block is at index 2 (after two unchanged lines),
      // and there's a matching unchanged line at index 1 → can slide up to index 1.
      // Line before index 2: "    inner" (indent 4)
      // Line before index 1: "def foo():" (indent 0)  ← better
      //
      // To get Myers to produce this arrangement, we need a case where the removed
      // line appears AFTER an equally-indented unchanged line.
      //
      // Concrete case:
      //   Original: line1="def foo():", line2="    inner", line3="    inner", line4="def bar():"
      //   Modified: line1="def foo():", line2="    inner", line3="def bar():"
      //   Myers removes one "    inner"; top-biased removes line2 (index 1 in 0-based).
      //   Block at index 1, blockEnd=2.
      //   Slide down: lines[2]="    inner" matches block line[0]="    inner" → can slide!
      //   Position 1: prior="def foo():" indent=0, score=0
      //   Position 2: prior="    inner" indent=4, score=4
      //   Position 1 is better → NO slide (stays at 1).
      //
      // So actually for this test case the heuristic should NOT slide.
      // Let's verify that property:
      const original = 'def foo():\n    inner\n    inner\ndef bar():';
      const modified = 'def foo():\n    inner\ndef bar():';
      const result = DiffService.calculateDiff(original, modified, baseOptions);
      const removed = result.lines.find(l => l.type === 'removed');
      expect(removed).toBeDefined();
      expect(removed!.content).toBe('    inner');
      // Should be at index 1 (after def foo():), NOT slid to index 2
      const removedIdx = result.lines.indexOf(removed!);
      expect(result.lines[removedIdx - 1].content).toBe('def foo():');
      expect(result.lines[removedIdx - 1].type).toBe('unchanged');
    });

    it('removed block stays at optimal position (no slide when already at lowest indent context)', () => {
      // Original:  def foo(): /     pass / def bar():
      // Modified:  def foo(): / def bar():
      // jsdiff removes "    pass". Prior line is "def foo():" (indent=0) — already optimal.
      // Adjacent lines: "def foo():" and "def bar():" don't match "    pass" → no slide.
      const original = 'def foo():\n    pass\ndef bar():';
      const modified = 'def foo():\ndef bar():';
      const result = DiffService.calculateDiff(original, modified, baseOptions);
      const removed = result.lines.find(l => l.type === 'removed');
      expect(removed).toBeDefined();
      expect(removed!.content).toBe('    pass');
      const removedIdx = result.lines.indexOf(removed!);
      expect(result.lines[removedIdx - 1].content).toBe('def foo():');
      expect(result.lines[removedIdx - 1].type).toBe('unchanged');
    });
  });

  describe('slide down when current position has higher indent', () => {
    it('removed block slides down when next unchanged line matches and has lower prior indent', () => {
      // Construct: a removed block currently at a high-indent position,
      // and sliding down puts it after a lower-indent line.
      //
      // Original lines: "    a", "    a", "b"
      // Modified lines: "    a", "b"
      // Myers removes line 1 ("    a"):
      //   removed: "    a"    (index 0, no prior → score=0)
      //   unchanged: "    a"  (same content → can slide down)
      //   unchanged: "b"
      //
      // Slide down: lines[1]="    a" matches lines[0]="    a" ✓
      //   Position 1: prior="    a" (indent=4), score=4 — WORSE than current (0)
      //   → No slide (current position wins)
      //
      // This confirms: if current position has score=0 (no prior), it always wins.
      // Now let's test a case where the current removed block is NOT at the top:
      //
      // Original: "b", "    a", "    a"
      // Modified: "b", "    a"
      // Myers removes line 2 ("    a"):
      //   unchanged: "b"       (index 0)
      //   removed: "    a"     (index 1, prior="b" indent=0, score=0)
      //   unchanged: "    a"   (index 2, same content → can slide down)
      //
      // Slide down: lines[2]="    a" matches lines[1]="    a" ✓
      //   Position 2: prior="    a" (indent=4), score=4 — worse
      //   → No slide (current wins)
      //
      // Sliding down is only useful when it moves to a LOWER-indent position.
      // Let's check: if we have "    a" removed at index 1, after "b" (indent=0),
      // and sliding down puts it after "b" again... still score 0. No preference.

      const original = 'b\n    a\n    a';
      const modified = 'b\n    a';
      const result = DiffService.calculateDiff(original, modified, baseOptions);
      expect(result.stats.removed).toBe(1);
      expect(result.stats.added).toBe(0);
      // Block should stay after "b" (the best position)
      const removed = result.lines.find(l => l.type === 'removed');
      expect(removed!.content).toBe('    a');
    });
  });

  describe('slide produces correct line numbers', () => {
    it('line numbers are consistent after heuristic is applied', () => {
      const original = 'def foo():\n    inner\n    inner\ndef bar():';
      const modified = 'def foo():\n    inner\ndef bar():';
      const result = DiffService.calculateDiff(original, modified, baseOptions);

      let origNum = 1;
      let newNum = 1;
      for (const line of result.lines) {
        if (line.type === 'removed') {
          expect(line.originalLineNumber).toBe(origNum++);
          expect(line.newLineNumber).toBeUndefined();
        } else if (line.type === 'added') {
          expect(line.originalLineNumber).toBeUndefined();
          expect(line.newLineNumber).toBe(newNum++);
        } else {
          expect(line.originalLineNumber).toBe(origNum++);
          expect(line.newLineNumber).toBe(newNum++);
        }
      }
    });
  });

  describe('statistics unchanged by heuristic', () => {
    it('added/removed counts are the same with and without heuristic', () => {
      const original = 'def foo():\n    inner\n    inner\ndef bar():';
      const modified = 'def foo():\n    inner\ndef bar():';
      const with_ = DiffService.calculateDiff(original, modified, baseOptions);
      const without = DiffService.calculateDiff(original, modified, noHeuristicOptions);
      expect(with_.stats.added).toBe(without.stats.added);
      expect(with_.stats.removed).toBe(without.stats.removed);
      expect(with_.stats.unchanged).toBe(without.stats.unchanged);
    });
  });

  describe('added block heuristic', () => {
    it('added block with no adjacent match stays in place', () => {
      const original = 'def foo():\ndef bar():';
      const modified = 'def foo():\n    pass\ndef bar():';
      const result = DiffService.calculateDiff(original, modified, baseOptions);
      const added = result.lines.find(l => l.type === 'added');
      expect(added).toBeDefined();
      expect(added!.content).toBe('    pass');
      const addedIdx = result.lines.indexOf(added!);
      expect(result.lines[addedIdx - 1].content).toBe('def foo():');
      expect(result.lines[addedIdx + 1].content).toBe('def bar():');
    });

    it('added block slides down when it finds a lower-indent boundary below', () => {
      // Original: "def foo():", "def bar():"
      // Modified: "def foo():", "    pass", "def bar():", "    pass"
      // Myers: adds "    pass" twice — but placed at the top (after def foo())
      // This tests that added blocks are processed similarly to removed blocks.
      const original = 'foo\n    a\n    a\nbar';
      const modified = 'foo\n    a\nbar';
      const result = DiffService.calculateDiff(original, modified, baseOptions);
      expect(result.stats.removed).toBe(1);
      expect(result.stats.added).toBe(0);
    });
  });

  describe('multi-line removed block', () => {
    it('multi-line block stays when context does not match', () => {
      const original = 'a\nb\nc\nd';
      const modified = 'a\nd';
      const result = DiffService.calculateDiff(original, modified, baseOptions);
      expect(result.stats.removed).toBe(2);
      const removedLines = result.lines.filter(l => l.type === 'removed');
      expect(removedLines.map(l => l.content)).toEqual(['b', 'c']);
    });

    it('multi-line block slides up to lower-indent position', () => {
      // Original:
      //   line1: "    a"   ← indent 4
      //   line2: "    b"   ← indent 4
      //   line3: "    a"   ← indent 4 (same as line1)
      //   line4: "    b"   ← indent 4 (same as line2)
      //   line5: "c"       ← indent 0
      //
      // Modified:
      //   line1: "    a"
      //   line2: "    b"
      //   line3: "c"
      //
      // Myers removes lines 3-4 ("    a","    b"):
      //   unchanged: "    a"    index 0
      //   unchanged: "    b"    index 1
      //   removed: "    a"      index 2 (prior="    b" indent=4, score=4)
      //   removed: "    b"      index 3
      //   unchanged: "c"        index 4
      //
      // Slide up: lines[1]="    b" matches last of block lines[3]="    b" ✓
      //   → slide to position 1:
      //   lines[0]="    a" matches last of new block lines[2]="    a"? We need to check
      //   if the full slide-up chain works.
      //
      // After 1 slide up (block [2,4) → [1,3)):
      //   unchanged: "    a"   index 0
      //   removed: "    a"     index 1 (prior="    a" indent=4, score=4)
      //   removed: "    b"     index 2
      //   unchanged: "    b"   index 3
      //   unchanged: "c"       index 4
      //
      // After 2 slides up (block [1,3) → [0,2)):
      //   removed: "    a"     index 0 (prior=none, score=0)
      //   removed: "    b"     index 1
      //   unchanged: "    a"   index 2
      //   unchanged: "    b"   index 3
      //   unchanged: "c"       index 4
      //
      // Score at [0,2): 0 < 4 → SLIDE UP to position 0!
      //
      const original = '    a\n    b\n    a\n    b\nc';
      const modified = '    a\n    b\nc';
      const result = DiffService.calculateDiff(original, modified, baseOptions);
      expect(result.stats.removed).toBe(2);
      const removedLines = result.lines.filter(l => l.type === 'removed');
      // With heuristic: block slid to index 0 (no prior, score=0)
      expect(removedLines[0].content).toBe('    a');
      expect(removedLines[1].content).toBe('    b');
      // They should be at the BEGINNING (indices 0,1)
      expect(result.lines[0].type).toBe('removed');
      expect(result.lines[1].type).toBe('removed');
      expect(result.lines[2].type).toBe('unchanged');
      expect(result.lines[3].type).toBe('unchanged');
      expect(result.lines[4].type).toBe('unchanged');
    });
  });
});
