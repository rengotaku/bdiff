/**
 * Plain Text Renderer
 * Generates plain text output from diff results
 */

import type { DiffLine } from '../../../types/types';
import type { PlainTextExportOptions, ExportLabels } from '../types';
import { BaseRenderer } from './BaseRenderer';

/**
 * Default plain text export options
 */
const DEFAULT_OPTIONS: Required<PlainTextExportOptions> = {
  includeDiffSymbols: true,
  includeLineNumbers: true,
  includeStats: true,
  includeHeader: true,
  columnWidth: 80,
  title: 'Diff Comparison',
  filename: undefined as any,
  originalFile: undefined as any,
  modifiedFile: undefined as any,
  collapseUnchanged: false,
  labels: undefined as any,
};

/**
 * Plain text format renderer
 */
export class PlainTextRenderer extends BaseRenderer {
  /**
   * Render diff lines to plain text
   */
  render(lines: DiffLine[], options: PlainTextExportOptions = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const sections: string[] = [];

    // Add header if requested
    if (opts.includeHeader && opts.originalFile && opts.modifiedFile) {
      sections.push(this.generateHeader(opts));
      sections.push(''); // Empty line
    }

    // Add stats if requested
    if (opts.includeStats) {
      sections.push(this.generateStats(lines, opts.labels));
      sections.push(''); // Empty line
    }

    // Add separator
    sections.push('='.repeat(opts.columnWidth));
    sections.push('');

    // Add diff content
    sections.push(this.generateDiffContent(lines, opts));

    return sections.join('\n');
  }

  /**
   * Get MIME type for plain text
   */
  getMimeType(): string {
    return 'text/plain;charset=utf-8';
  }

  /**
   * Get file extension
   */
  protected getFileExtension(): string {
    return '.txt';
  }

  /**
   * Generate header section
   */
  private generateHeader(opts: Required<PlainTextExportOptions>): string {
    const l = opts.labels ?? {};
    const lines: string[] = [];
    const title = opts.title || l.diffComparison || 'Diff Comparison';

    lines.push(title);
    lines.push('='.repeat(title.length));
    lines.push('');
    lines.push(`${l.generated ?? 'Generated:'} ${this.formatDate(new Date())}`);
    lines.push('');
    lines.push(`${l.original ?? 'Original'}:  ${opts.originalFile.name} (${opts.originalFile.size} bytes)`);
    lines.push(`${l.modified ?? 'Modified'}:  ${opts.modifiedFile.name} (${opts.modifiedFile.size} bytes)`);

    return lines.join('\n');
  }

  /**
   * Generate statistics section
   */
  private generateStats(lines: DiffLine[], labels?: ExportLabels): string {
    const stats = this.getLineStats(lines);
    const total = lines.length;
    const similarity = total > 0 ? Math.round((stats.unchanged / total) * 100) : 100;
    const l = labels ?? {};

    return [
      `${l.statisticsLabel ?? 'Statistics:'}`,
      `  ${l.added ?? 'Added'}:     ${stats.added}`,
      `  ${l.removed ?? 'Removed'}:   ${stats.removed}`,
      `  ${l.modifiedStat ?? 'Modified'}:  ${stats.modified}`,
      `  ${l.unchanged ?? 'Unchanged'}: ${stats.unchanged}`,
      `  ${l.similarityStat ?? 'Similarity'}: ${similarity}%`,
    ].join('\n');
  }

  /**
   * Generate diff content
   */
  private generateDiffContent(
    lines: DiffLine[],
    opts: Required<PlainTextExportOptions>
  ): string {
    return lines
      .map(line => this.formatLine(line, opts))
      .join('\n');
  }

  /**
   * Format a single diff line
   */
  private formatLine(line: DiffLine, opts: Required<PlainTextExportOptions>): string {
    const parts: string[] = [];

    // Line number (if enabled)
    if (opts.includeLineNumbers) {
      parts.push(line.lineNumber.toString().padStart(4, ' '));
    }

    // Diff symbol (if enabled)
    if (opts.includeDiffSymbols) {
      parts.push(this.getPrefixSymbol(line.type));
    }

    // Content
    parts.push(line.content || '');

    return parts.join(' ');
  }
}
