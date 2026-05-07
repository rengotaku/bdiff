import { describe, it, expect, vi, afterEach } from 'vitest';
import { DiffExporter } from '../../utils/diffExport';
import { DiffParser } from '../../utils/diffParsing';
import type { DiffLine } from '../../types/types';

const makeLine = (type: DiffLine['type'], content: string, lineNumber = 1): DiffLine => ({
  type,
  content,
  lineNumber,
});

const SAMPLE_LINES: DiffLine[] = [
  makeLine('added', 'new line', 1),
  makeLine('removed', 'old line', 2),
  makeLine('unchanged', 'same line', 3),
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DiffExporter - エラー伝播（console.error で握り潰さない）', () => {
  it('toPlainText: DiffParser.filterByType が例外を投げた場合、呼び出し側に伝播する', () => {
    vi.spyOn(DiffParser, 'filterByType').mockImplementation(() => {
      throw new Error('filterByType error');
    });
    expect(() => DiffExporter.toPlainText(SAMPLE_LINES)).toThrow('filterByType error');
  });

  it('toDiffFormat: DiffParser.filterByType が例外を投げた場合、呼び出し側に伝播する', () => {
    vi.spyOn(DiffParser, 'filterByType').mockImplementation(() => {
      throw new Error('filterByType error');
    });
    expect(() => DiffExporter.toDiffFormat(SAMPLE_LINES)).toThrow('filterByType error');
  });

  it('toMarkdown: DiffParser.filterByType が例外を投げた場合、呼び出し側に伝播する', () => {
    vi.spyOn(DiffParser, 'filterByType').mockImplementation(() => {
      throw new Error('filterByType error');
    });
    expect(() => DiffExporter.toMarkdown(SAMPLE_LINES)).toThrow('filterByType error');
  });

  it('toHtml: DiffParser.filterByType が例外を投げた場合、呼び出し側に伝播する', () => {
    vi.spyOn(DiffParser, 'filterByType').mockImplementation(() => {
      throw new Error('filterByType error');
    });
    expect(() => DiffExporter.toHtml(SAMPLE_LINES)).toThrow('filterByType error');
  });

  it('formatWithHeader: DiffParser.getDiffSummary が例外を投げた場合、呼び出し側に伝播する', () => {
    vi.spyOn(DiffParser, 'getDiffSummary').mockImplementation(() => {
      throw new Error('getDiffSummary error');
    });
    expect(() => DiffExporter.formatWithHeader(SAMPLE_LINES, { includeHeader: true })).toThrow(
      'getDiffSummary error'
    );
  });
});

describe('DiffExporter - noDifferencesMessage オプション（i18n対応）', () => {
  it('toMarkdown: filteredLines が空のとき noDifferencesMessage を使用する', () => {
    vi.spyOn(DiffParser, 'filterByType').mockReturnValue([]);
    const result = DiffExporter.toMarkdown(SAMPLE_LINES, {
      noDifferencesMessage: '差分なし',
    });
    expect(result).toContain('差分なし');
    expect(result).not.toContain('No differences to display');
  });

  it('toHtml: lines が空のとき noDifferencesMessage を使用する', () => {
    const result = DiffExporter.toHtml([], {
      noDifferencesMessage: '差分なし',
    });
    expect(result).toContain('差分なし');
    expect(result).not.toContain('No differences to display');
  });

  it('toHtml: filteredLines が空のとき noDifferencesMessage を使用する', () => {
    vi.spyOn(DiffParser, 'filterByType').mockReturnValue([]);
    const result = DiffExporter.toHtml(SAMPLE_LINES, {
      noDifferencesMessage: '差分なし',
    });
    expect(result).toContain('差分なし');
    expect(result).not.toContain('No differences to display');
  });

  it('toMarkdown: noDifferencesMessage 未指定時はハードコード英語を返さない', () => {
    vi.spyOn(DiffParser, 'filterByType').mockReturnValue([]);
    const result = DiffExporter.toMarkdown(SAMPLE_LINES);
    expect(result).not.toContain('No differences to display');
  });

  it('toHtml: noDifferencesMessage 未指定時はハードコード英語を返さない', () => {
    const result = DiffExporter.toHtml([]);
    expect(result).not.toContain('No differences to display');
  });
});

describe('DiffExporter - 正常系', () => {
  it('toPlainText: 行をプレーンテキストに変換する', () => {
    const result = DiffExporter.toPlainText(SAMPLE_LINES);
    expect(result).toContain('new line');
    expect(result).toContain('old line');
    expect(result).toContain('same line');
  });

  it('toPlainText: 空の配列は空文字列を返す', () => {
    expect(DiffExporter.toPlainText([])).toBe('');
  });

  it('toDiffFormat: diff記号（+/-）を含むテキストを返す', () => {
    const result = DiffExporter.toDiffFormat(SAMPLE_LINES);
    expect(result).toContain('+');
    expect(result).toContain('-');
  });

  it('toDiffFormat: 空の配列は空文字列を返す', () => {
    expect(DiffExporter.toDiffFormat([])).toBe('');
  });

  it('toMarkdown: ```diff コードブロックを含むMarkdownを返す', () => {
    const result = DiffExporter.toMarkdown(SAMPLE_LINES);
    expect(result).toContain('```diff');
    expect(result).toContain('```');
  });

  it('toMarkdown: 空の配列は空文字列を返す', () => {
    expect(DiffExporter.toMarkdown([])).toBe('');
  });

  it('toHtml: HTML構造を含む文字列を返す', () => {
    const result = DiffExporter.toHtml(SAMPLE_LINES);
    expect(result).toContain('<div');
    expect(result).toContain('new line');
  });

  it('formatWithHeader: ヘッダーなしの場合は format() の結果を返す', () => {
    const result = DiffExporter.formatWithHeader(SAMPLE_LINES, { includeHeader: false });
    expect(result).toContain('new line');
  });

  it('formatWithHeader: Markdownヘッダーを含む文字列を返す', () => {
    const result = DiffExporter.formatWithHeader(SAMPLE_LINES, {
      format: 'markdown',
      filename: 'test.txt',
      includeHeader: true,
    });
    expect(result).toContain('## test.txt');
  });
});
