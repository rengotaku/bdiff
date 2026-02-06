import { describe, it, expect } from 'vitest';
import { getPrefixSymbol, getLineClassName, formatLineForCopy } from '../../utils/diffRendering';
import type { DiffLine } from '../../types/types';

describe('diffRendering', () => {
  describe('getPrefixSymbol', () => {
    /**
     * FR-003: getPrefixSymbol関数は画面表示とHTMLエクスポートで共通化されなければならない
     *
     * 統一仕様: スペースなしで記号のみを返す
     * - 'added' → '+'
     * - 'removed' → '-'
     * - 'modified' → '~'
     * - 'unchanged' → ' '
     */

    it('added タイプは "+" を返す（スペースなし）', () => {
      expect(getPrefixSymbol('added')).toBe('+');
    });

    it('removed タイプは "-" を返す（スペースなし）', () => {
      expect(getPrefixSymbol('removed')).toBe('-');
    });

    it('modified タイプは "~" を返す（スペースなし）', () => {
      expect(getPrefixSymbol('modified')).toBe('~');
    });

    it('unchanged タイプは " "（スペース1文字）を返す', () => {
      expect(getPrefixSymbol('unchanged')).toBe(' ');
    });

    describe('edge cases', () => {
      it('返り値は常に1文字である', () => {
        const types: DiffLine['type'][] = ['added', 'removed', 'modified', 'unchanged'];
        for (const type of types) {
          expect(getPrefixSymbol(type)).toHaveLength(1);
        }
      });
    });
  });

  describe('getLineClassName', () => {
    /**
     * FR-004: getLineClassName関数は画面表示で使用されるTailwindクラスを返す
     *
     * 注: CSSクラス名用には別途 diffStyling.ts の getLineClass を使用
     */

    it('added タイプは緑系のTailwindクラスを含む', () => {
      const className = getLineClassName('added');
      expect(className).toContain('bg-green-50');
      expect(className).toContain('border-green-400');
      expect(className).toContain('text-green-800');
    });

    it('removed タイプは赤系のTailwindクラスを含む', () => {
      const className = getLineClassName('removed');
      expect(className).toContain('bg-red-50');
      expect(className).toContain('border-red-400');
      expect(className).toContain('text-red-800');
    });

    it('modified タイプは青系のTailwindクラスを含む', () => {
      const className = getLineClassName('modified');
      expect(className).toContain('bg-blue-50');
      expect(className).toContain('border-blue-400');
      expect(className).toContain('text-blue-800');
    });

    it('unchanged タイプは白/グレー系のTailwindクラスを含む', () => {
      const className = getLineClassName('unchanged');
      expect(className).toContain('bg-white');
      expect(className).toContain('border-gray-200');
      expect(className).toContain('text-gray-700');
    });

    it('全タイプで共通の基本クラスを含む', () => {
      const types: DiffLine['type'][] = ['added', 'removed', 'modified', 'unchanged'];
      for (const type of types) {
        const className = getLineClassName(type);
        expect(className).toContain('font-mono');
        expect(className).toContain('text-sm');
        expect(className).toContain('border-l-4');
        expect(className).toContain('px-4');
        expect(className).toContain('py-1');
        expect(className).toContain('whitespace-pre-wrap');
      }
    });
  });

  describe('formatLineForCopy', () => {
    /**
     * コピー用フォーマット: "記号 内容" の形式
     */

    it('added 行は "+ 内容" 形式でフォーマットされる', () => {
      const line: DiffLine = { type: 'added', content: 'new line', lineNumber: 1 };
      expect(formatLineForCopy(line)).toBe('+ new line');
    });

    it('removed 行は "- 内容" 形式でフォーマットされる', () => {
      const line: DiffLine = { type: 'removed', content: 'old line', lineNumber: 1 };
      expect(formatLineForCopy(line)).toBe('- old line');
    });

    it('modified 行は "~ 内容" 形式でフォーマットされる', () => {
      const line: DiffLine = { type: 'modified', content: 'changed line', lineNumber: 1 };
      expect(formatLineForCopy(line)).toBe('~ changed line');
    });

    it('unchanged 行は "  内容" 形式でフォーマットされる（スペース + 内容）', () => {
      const line: DiffLine = { type: 'unchanged', content: 'same line', lineNumber: 1 };
      expect(formatLineForCopy(line)).toBe('  same line');
    });

    it('空の content は空文字列として扱われる', () => {
      const line: DiffLine = { type: 'added', content: '', lineNumber: 1 };
      expect(formatLineForCopy(line)).toBe('+ ');
    });

    it('undefined の content は空文字列として扱われる', () => {
      const line = { type: 'added', content: undefined, lineNumber: 1 } as unknown as DiffLine;
      expect(formatLineForCopy(line)).toBe('+ ');
    });

    describe('edge cases', () => {
      it('日本語を含む行を正しくフォーマットする', () => {
        const line: DiffLine = { type: 'added', content: 'こんにちは世界', lineNumber: 1 };
        expect(formatLineForCopy(line)).toBe('+ こんにちは世界');
      });

      it('特殊文字を含む行を正しくフォーマットする', () => {
        const line: DiffLine = { type: 'removed', content: '<script>alert("xss")</script>', lineNumber: 1 };
        expect(formatLineForCopy(line)).toBe('- <script>alert("xss")</script>');
      });

      it('空白のみの行を正しくフォーマットする', () => {
        const line: DiffLine = { type: 'unchanged', content: '   ', lineNumber: 1 };
        expect(formatLineForCopy(line)).toBe('     ');
      });

      it('タブ文字を含む行を正しくフォーマットする', () => {
        const line: DiffLine = { type: 'added', content: '\tindented', lineNumber: 1 };
        expect(formatLineForCopy(line)).toBe('+ \tindented');
      });
    });
  });
});
