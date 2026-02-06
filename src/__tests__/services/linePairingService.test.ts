import { describe, it, expect } from 'vitest';
import { LinePairingService } from '../../services/linePairingService';
import type { DiffLine } from '../../types/types';

/**
 * LinePairingService Unit Tests
 *
 * Test coverage:
 * - pairForUnifiedView: Unified view pairing logic
 * - pairForSideBySideView: Side-by-side view pairing logic
 * - Edge cases: empty arrays, mismatched counts, non-paired lines
 */
describe('LinePairingService', () => {
  // Helper to create DiffLine
  const createLine = (
    type: DiffLine['type'],
    content: string,
    lineNumber: number
  ): DiffLine => ({
    type,
    content,
    lineNumber,
  });

  describe('pairForUnifiedView', () => {
    it('returns empty array for empty input', () => {
      const result = LinePairingService.pairForUnifiedView([], false);
      expect(result).toEqual([]);
    });

    it('passes through unchanged lines without segments', () => {
      const lines: DiffLine[] = [
        createLine('unchanged', 'line 1', 1),
        createLine('unchanged', 'line 2', 2),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, false);

      expect(result).toHaveLength(2);
      expect(result[0].line).toEqual(lines[0]);
      expect(result[0].segments).toBeUndefined();
      expect(result[1].line).toEqual(lines[1]);
      expect(result[1].segments).toBeUndefined();
    });

    it('pairs consecutive removed and added lines with char diff disabled', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'old text', 1),
        createLine('added', 'new text', 2),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, false);

      expect(result).toHaveLength(2);
      expect(result[0].line.type).toBe('removed');
      expect(result[0].segments).toBeUndefined();
      expect(result[1].line.type).toBe('added');
      expect(result[1].segments).toBeUndefined();
    });

    it('computes character segments for similar removed/added pairs with char diff enabled', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'hello world', 1),
        createLine('added', 'hello there', 2),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, true);

      expect(result).toHaveLength(2);
      // Removed line should have segments
      expect(result[0].line.type).toBe('removed');
      expect(result[0].segments).toBeDefined();
      expect(result[0].segments!.length).toBeGreaterThan(0);
      // Added line should have segments
      expect(result[1].line.type).toBe('added');
      expect(result[1].segments).toBeDefined();
      expect(result[1].segments!.length).toBeGreaterThan(0);
    });

    it('handles multiple consecutive removed lines followed by multiple added lines', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'old line 1', 1),
        createLine('removed', 'old line 2', 2),
        createLine('added', 'new line 1', 3),
        createLine('added', 'new line 2', 4),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, true);

      expect(result).toHaveLength(4);
      // First pair: removed[0] with added[0]
      expect(result[0].line.content).toBe('old line 1');
      expect(result[1].line.content).toBe('new line 1');
      // Second pair: removed[1] with added[1]
      expect(result[2].line.content).toBe('old line 2');
      expect(result[3].line.content).toBe('new line 2');
    });

    it('handles more removed lines than added lines', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'line 1', 1),
        createLine('removed', 'line 2', 2),
        createLine('removed', 'line 3', 3),
        createLine('added', 'new line', 4),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, false);

      expect(result).toHaveLength(4);
      // All lines should be present
      expect(result.map(r => r.line.content)).toEqual([
        'line 1',
        'new line',
        'line 2',
        'line 3',
      ]);
    });

    it('handles more added lines than removed lines', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'old line', 1),
        createLine('added', 'new line 1', 2),
        createLine('added', 'new line 2', 3),
        createLine('added', 'new line 3', 4),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, false);

      expect(result).toHaveLength(4);
      // All lines should be present
      expect(result.map(r => r.line.content)).toEqual([
        'old line',
        'new line 1',
        'new line 2',
        'new line 3',
      ]);
    });

    it('does not compute char diff for dissimilar lines', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'completely different', 1),
        createLine('added', 'xyz', 2),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, true);

      expect(result).toHaveLength(2);
      // Lines are too different, should not have segments
      expect(result[0].segments).toBeUndefined();
      expect(result[1].segments).toBeUndefined();
    });

    it('handles mixed unchanged and changed lines', () => {
      const lines: DiffLine[] = [
        createLine('unchanged', 'context 1', 1),
        createLine('removed', 'old text', 2),
        createLine('added', 'new text', 3),
        createLine('unchanged', 'context 2', 4),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, false);

      expect(result).toHaveLength(4);
      expect(result[0].line.type).toBe('unchanged');
      expect(result[1].line.type).toBe('removed');
      expect(result[2].line.type).toBe('added');
      expect(result[3].line.type).toBe('unchanged');
    });

    it('handles lines with only removed (no added following)', () => {
      const lines: DiffLine[] = [
        createLine('unchanged', 'keep', 1),
        createLine('removed', 'deleted', 2),
        createLine('unchanged', 'keep 2', 3),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, true);

      expect(result).toHaveLength(3);
      expect(result[1].line.type).toBe('removed');
      expect(result[1].segments).toBeUndefined();
    });

    it('handles lines with only added (no removed before)', () => {
      const lines: DiffLine[] = [
        createLine('unchanged', 'keep', 1),
        createLine('added', 'inserted', 2),
        createLine('unchanged', 'keep 2', 3),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, true);

      expect(result).toHaveLength(3);
      expect(result[1].line.type).toBe('added');
      expect(result[1].segments).toBeUndefined();
    });
  });

  describe('pairForSideBySideView', () => {
    it('returns empty arrays for empty input', () => {
      const result = LinePairingService.pairForSideBySideView([], false);
      expect(result.original).toEqual([]);
      expect(result.modified).toEqual([]);
    });

    it('separates lines into original and modified correctly', () => {
      const lines: DiffLine[] = [
        createLine('unchanged', 'same line', 1),
        createLine('removed', 'old line', 2),
        createLine('added', 'new line', 3),
      ];

      const result = LinePairingService.pairForSideBySideView(lines, false);

      // Original: unchanged + removed
      expect(result.original).toHaveLength(2);
      expect(result.original[0].line.content).toBe('same line');
      expect(result.original[1].line.content).toBe('old line');

      // Modified: unchanged + added
      expect(result.modified).toHaveLength(2);
      expect(result.modified[0].line.content).toBe('same line');
      expect(result.modified[1].line.content).toBe('new line');
    });

    it('computes char segments for paired removed/added lines', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'hello world', 1),
        createLine('added', 'hello there', 2),
      ];

      const result = LinePairingService.pairForSideBySideView(lines, true);

      // Original side should have segments
      expect(result.original).toHaveLength(1);
      expect(result.original[0].segments).toBeDefined();
      expect(result.original[0].segments!.length).toBeGreaterThan(0);

      // Modified side should have segments
      expect(result.modified).toHaveLength(1);
      expect(result.modified[0].segments).toBeDefined();
      expect(result.modified[0].segments!.length).toBeGreaterThan(0);
    });

    it('pairs by position index for multiple removed/added', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'old 1', 1),
        createLine('removed', 'old 2', 2),
        createLine('added', 'new 1', 3),
        createLine('added', 'new 2', 4),
      ];

      const result = LinePairingService.pairForSideBySideView(lines, true);

      // Should pair old 1 with new 1, old 2 with new 2
      expect(result.original).toHaveLength(2);
      expect(result.modified).toHaveLength(2);

      // Both pairs should have segments if similar enough
      expect(result.original[0].line.content).toBe('old 1');
      expect(result.modified[0].line.content).toBe('new 1');
      expect(result.original[1].line.content).toBe('old 2');
      expect(result.modified[1].line.content).toBe('new 2');
    });

    it('handles unchanged-only input', () => {
      const lines: DiffLine[] = [
        createLine('unchanged', 'line 1', 1),
        createLine('unchanged', 'line 2', 2),
      ];

      const result = LinePairingService.pairForSideBySideView(lines, false);

      expect(result.original).toHaveLength(2);
      expect(result.modified).toHaveLength(2);
      expect(result.original[0].segments).toBeUndefined();
      expect(result.modified[0].segments).toBeUndefined();
    });

    it('handles removed-only input', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'deleted 1', 1),
        createLine('removed', 'deleted 2', 2),
      ];

      const result = LinePairingService.pairForSideBySideView(lines, false);

      // Original has the removed lines
      expect(result.original).toHaveLength(2);
      // Modified is empty
      expect(result.modified).toHaveLength(0);
    });

    it('handles added-only input', () => {
      const lines: DiffLine[] = [
        createLine('added', 'inserted 1', 1),
        createLine('added', 'inserted 2', 2),
      ];

      const result = LinePairingService.pairForSideBySideView(lines, false);

      // Original is empty
      expect(result.original).toHaveLength(0);
      // Modified has the added lines
      expect(result.modified).toHaveLength(2);
    });

    it('does not compute char diff when enableCharDiff is false', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'hello world', 1),
        createLine('added', 'hello there', 2),
      ];

      const result = LinePairingService.pairForSideBySideView(lines, false);

      expect(result.original[0].segments).toBeUndefined();
      expect(result.modified[0].segments).toBeUndefined();
    });

    it('handles mismatched counts (more removed than added)', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'old 1', 1),
        createLine('removed', 'old 2', 2),
        createLine('added', 'new 1', 3),
      ];

      const result = LinePairingService.pairForSideBySideView(lines, false);

      expect(result.original).toHaveLength(2);
      expect(result.modified).toHaveLength(1);
    });

    it('handles mismatched counts (more added than removed)', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'old 1', 1),
        createLine('added', 'new 1', 2),
        createLine('added', 'new 2', 3),
      ];

      const result = LinePairingService.pairForSideBySideView(lines, false);

      expect(result.original).toHaveLength(1);
      expect(result.modified).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string content', () => {
      const lines: DiffLine[] = [
        createLine('removed', '', 1),
        createLine('added', '', 2),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, true);

      expect(result).toHaveLength(2);
      expect(result[0].line.content).toBe('');
      expect(result[1].line.content).toBe('');
    });

    it('handles very long lines', () => {
      const longContent = 'a'.repeat(10000);
      const lines: DiffLine[] = [
        createLine('removed', longContent, 1),
        createLine('added', longContent + 'b', 2),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, true);

      expect(result).toHaveLength(2);
      // Should still compute segments for similar long lines
      expect(result[0].segments).toBeDefined();
      expect(result[1].segments).toBeDefined();
    });

    it('handles Unicode content', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'Hello World', 1),
        createLine('added', 'Hello World!', 2),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, true);

      expect(result).toHaveLength(2);
      expect(result[0].segments).toBeDefined();
      expect(result[1].segments).toBeDefined();
    });

    it('handles Japanese characters', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'Hello', 1),
        createLine('added', 'Goodbye', 2),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, true);

      expect(result).toHaveLength(2);
      // Lines should still be processed
      expect(result[0].line.content).toBe('Hello');
      expect(result[1].line.content).toBe('Goodbye');
    });

    it('handles special characters', () => {
      const lines: DiffLine[] = [
        createLine('removed', '<div class="foo">&amp;</div>', 1),
        createLine('added', '<div class="bar">&amp;</div>', 2),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, true);

      expect(result).toHaveLength(2);
      expect(result[0].segments).toBeDefined();
      expect(result[1].segments).toBeDefined();
    });

    it('handles whitespace-only content', () => {
      const lines: DiffLine[] = [
        createLine('removed', '   ', 1),
        createLine('added', '    ', 2),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, true);

      expect(result).toHaveLength(2);
    });

    it('handles newline characters in content', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'line\nbreak', 1),
        createLine('added', 'line\nbreak!', 2),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, true);

      expect(result).toHaveLength(2);
    });

    it('handles single character lines', () => {
      const lines: DiffLine[] = [
        createLine('removed', 'a', 1),
        createLine('added', 'b', 2),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, true);

      expect(result).toHaveLength(2);
      // Too different for char diff
      expect(result[0].segments).toBeUndefined();
      expect(result[1].segments).toBeUndefined();
    });

    it('handles modified type lines', () => {
      const lines: DiffLine[] = [
        createLine('modified', 'modified content', 1),
        createLine('unchanged', 'unchanged content', 2),
      ];

      const result = LinePairingService.pairForUnifiedView(lines, false);

      expect(result).toHaveLength(2);
      expect(result[0].line.type).toBe('modified');
      expect(result[1].line.type).toBe('unchanged');
    });
  });
});
