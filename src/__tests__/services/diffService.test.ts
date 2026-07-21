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

  describe('calculateDiff - encoding normalization (issue #118)', () => {
    it('CRLF と LF の混在は差分を生まない', () => {
      const original = 'line1\r\nline2\r\nline3\r\n';
      const modified = 'line1\nline2\nline3\n';
      const result = DiffService.calculateDiff(original, modified, defaultOptions);
      expect(result.stats.added).toBe(0);
      expect(result.stats.removed).toBe(0);
      expect(result.stats.modified).toBe(0);
    });

    it('先頭 BOM の有無で差分が出ない', () => {
      const original = '﻿hello\nworld';
      const modified = 'hello\nworld';
      const result = DiffService.calculateDiff(original, modified, defaultOptions);
      expect(result.stats.added).toBe(0);
      expect(result.stats.removed).toBe(0);
    });

    it('Unicode NFC / NFD 差では差分を生まない (濁点の合成/分解)', () => {
      const composed = 'あがい';
      const decomposed = 'あがい';
      const result = DiffService.calculateDiff(composed, decomposed, defaultOptions);
      expect(result.stats.added).toBe(0);
      expect(result.stats.removed).toBe(0);
    });

    it('CR のみの改行 (旧 Mac) も LF と等価扱い', () => {
      const original = 'a\rb\rc';
      const modified = 'a\nb\nc';
      const result = DiffService.calculateDiff(original, modified, defaultOptions);
      expect(result.stats.added).toBe(0);
      expect(result.stats.removed).toBe(0);
    });
  });
});
