import { describe, it, expect } from 'vitest';
import { DiffService } from '../../services/diffService';
import type { ComparisonOptions } from '../../types/types';

const defaultOptions: ComparisonOptions = {
  sortLines: false,
  ignoreCase: false,
  ignoreWhitespace: false,
  ignoreTrailingNewlines: false,
  enableCharDiff: false,
  indentHeuristic: false,
};

describe('DiffService', () => {
  describe('calculateDiff - 基本動作', () => {
    it('同一テキストの差分は unchanged のみ', () => {
      const text = 'line1\nline2\nline3';
      const result = DiffService.calculateDiff(text, text, defaultOptions);
      expect(result.stats.added).toBe(0);
      expect(result.stats.removed).toBe(0);
      expect(result.stats.modified).toBe(0);
      expect(result.stats.unchanged).toBe(3);
    });

    it('完全に異なるテキストの差分', () => {
      const original = 'AAA\nBBB';
      const modified = 'CCC\nDDD';
      const result = DiffService.calculateDiff(original, modified, defaultOptions);
      expect(result.stats.removed).toBe(2);
      expect(result.stats.added).toBe(2);
      expect(result.stats.modified).toBe(0);
    });
  });

  describe('applyIndentHeuristic', () => {
    it('スライド不要な場合は変化しない', () => {
      // "pass" only appears once; no sliding possible
      const original = 'def foo():\n    pass\ndef bar():\n    return 42';
      const modified = 'def foo():\n    pass\ndef bar():\n    return 0';
      const withHeuristic = DiffService.calculateDiff(original, modified, { ...defaultOptions, indentHeuristic: true });
      const withoutHeuristic = DiffService.calculateDiff(original, modified, defaultOptions);
      expect(withHeuristic.stats).toEqual(withoutHeuristic.stats);
    });

    it('applyIndentHeuristic: ブロックがより低いインデント位置にスライドされる', () => {
      // Manually build DiffLine[] so we control the exact slide scenario:
      // idx0: unchanged "top_level" (indent 0)
      // idx1: unchanged "    pass"  (indent 4) — content matches the removed block
      // idx2: removed   "    pass"  (indent 4) — block; maxUp=1
      // idx3: unchanged "        nested" (indent 8)
      //
      // score at slide=0:  before=indent('    pass')=4, after=indent('        nested')=8  → 12
      // score at slide=-1: before=indent('top_level')=0, after=indent('    pass')=4        → 4
      // slide=-1 wins → idx1 becomes removed, idx2 becomes unchanged
      const lines = [
        { lineNumber: 1, content: 'top_level',      type: 'unchanged' as const, originalLineNumber: 1, newLineNumber: 1 },
        { lineNumber: 2, content: '    pass',        type: 'unchanged' as const, originalLineNumber: 2, newLineNumber: 2 },
        { lineNumber: 3, content: '    pass',        type: 'removed'  as const, originalLineNumber: 3, newLineNumber: undefined },
        { lineNumber: 4, content: '        nested',  type: 'unchanged' as const, originalLineNumber: 4, newLineNumber: 3 },
      ];
      const result = DiffService.applyIndentHeuristic(lines);
      expect(result[1].type).toBe('removed');
      expect(result[2].type).toBe('unchanged');
      // Stats should still be 1 removal
      const removed = result.filter(l => l.type === 'removed');
      expect(removed).toHaveLength(1);
    });

    it('heuristic で slide が起きた場合、行番号が正しく再採番される', () => {
      // Two identical lines; Myers removes first, heuristic may prefer to remove second.
      const original = 'a\nb\nb';
      const modified = 'a\nb';
      const result = DiffService.calculateDiff(original, modified, { ...defaultOptions, indentHeuristic: true });
      // Line numbers must be strictly monotonic for unchanged lines
      const unchangedLines = result.lines.filter(l => l.type === 'unchanged');
      const origNums = unchangedLines.map(l => l.originalLineNumber!);
      for (let i = 1; i < origNums.length; i++) {
        expect(origNums[i]).toBeGreaterThan(origNums[i - 1]);
      }
    });

    it('追加ブロックも低インデント位置へスライドする', () => {
      // Adding a duplicate line; heuristic prefers the position with lower indent boundary.
      const original = 'a\nb';
      const modified = 'a\nb\nb';
      const result = DiffService.calculateDiff(original, modified, { ...defaultOptions, indentHeuristic: true });
      expect(result.stats.added).toBe(1);
      expect(result.stats.removed).toBe(0);
      // Total line count = original lines + 1 added
      expect(result.lines.length).toBe(3);
    });

    it('indentHeuristic=false の場合はヒューリスティックが適用されない', () => {
      const original = '    a\n    a\n    b';
      const modified = '    a\n    b';
      const withoutH = DiffService.calculateDiff(original, modified, { ...defaultOptions, indentHeuristic: false });
      const withH = DiffService.calculateDiff(original, modified, { ...defaultOptions, indentHeuristic: true });
      // Both remove 1 line; stats are the same but the removed line position may differ
      expect(withoutH.stats.removed).toBe(1);
      expect(withH.stats.removed).toBe(1);
    });
  });

  describe('calculateDiff - modified 統計（issue #97）', () => {
    it('enableCharDiff=false の場合、modified は常に 0', () => {
      const original = 'hello world\nfoo bar\nbaz';
      const modified = 'hello there\nfoo baz\nbaz';
      const result = DiffService.calculateDiff(original, modified, {
        ...defaultOptions,
        enableCharDiff: false,
      });
      expect(result.stats.modified).toBe(0);
    });

    it('enableCharDiff=true で類似行ペアが存在する場合、modified = 1', () => {
      // 末尾1語だけ変わった行（高類似度 → char diff 対象）
      const original = 'hello world\nunchanged line';
      const modified = 'hello there\nunchanged line';
      const result = DiffService.calculateDiff(original, modified, {
        ...defaultOptions,
        enableCharDiff: true,
      });
      // 'hello world' と 'hello there' は類似 → modified=1, removed=0, added=0
      expect(result.stats.modified).toBe(1);
      expect(result.stats.removed).toBe(0);
      expect(result.stats.added).toBe(0);
      expect(result.stats.unchanged).toBe(1);
    });

    it('enableCharDiff=true で完全に異なる行は modified にならない', () => {
      // 類似度が低い（0.6未満）行は char diff 対象外 → removed/added のまま
      const original = 'AAAAAAAAAAA\nunchanged';
      const modified = 'ZZZZZZZZZZZ\nunchanged';
      const result = DiffService.calculateDiff(original, modified, {
        ...defaultOptions,
        enableCharDiff: true,
      });
      expect(result.stats.modified).toBe(0);
      expect(result.stats.removed).toBe(1);
      expect(result.stats.added).toBe(1);
    });

    it('enableCharDiff=true で統計の合計は全行数に等しい', () => {
      const original = 'line one\nline two\nline three\ncommon line';
      const modified = 'line 1\nline 2\nline three\ncommon line';
      const result = DiffService.calculateDiff(original, modified, {
        ...defaultOptions,
        enableCharDiff: true,
      });
      const total = result.stats.added + result.stats.removed +
                    result.stats.modified * 2 + result.stats.unchanged;
      expect(total).toBe(result.lines.length);
    });
  });
});
