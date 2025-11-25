/**
 * Markdown Renderer
 * Generates Markdown-formatted output from diff results
 */

import type { DiffLine } from '../../../types/types';
import type { MarkdownExportOptions } from '../types';
import { BaseRenderer } from './BaseRenderer';

/**
 * Default markdown export options
 */
const DEFAULT_OPTIONS: Required<MarkdownExportOptions> = {
  useCodeBlocks: true,
  includeDiffSymbols: true,
  includeLineNumbers: false, // Less useful in markdown
  includeStats: true,
  includeHeader: true,
  title: 'Diff Comparison',
  originalFile: undefined as any,
  modifiedFile: undefined as any,
};

/**
 * Markdown format renderer
 */
export class MarkdownRenderer extends BaseRenderer {
  /**
   * Render diff lines to Markdown
   */
  render(lines: DiffLine[], options: MarkdownExportOptions = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const sections: string[] = [];

    // Add title
    if (opts.title) {
      sections.push(`# ${opts.title}`);
      sections.push('');
    }

    // Add header if requested
    if (opts.includeHeader && opts.originalFile && opts.modifiedFile) {
      sections.push(this.generateHeader(opts));
      sections.push('');
    }

    // Add stats if requested
    if (opts.includeStats) {
      sections.push(this.generateStats(lines));
      sections.push('');
    }

    // Add diff content
    sections.push('## Diff Content');
    sections.push('');
    sections.push(this.generateDiffContent(lines, opts));

    return sections.join('\n');
  }

  /**
   * Get MIME type for Markdown
   */
  getMimeType(): string {
    return 'text/markdown;charset=utf-8';
  }

  /**
   * Get file extension
   */
  protected getFileExtension(): string {
    return '.md';
  }

  /**
   * Generate header section
   */
  private generateHeader(opts: Required<MarkdownExportOptions>): string {
    const lines: string[] = [];

    lines.push('## File Information');
    lines.push('');
    lines.push(`**Generated:** ${this.formatDate(new Date())}`);
    lines.push('');
    lines.push('| File | Name | Size |');
    lines.push('|------|------|------|');
    lines.push(`| Original | \`${opts.originalFile.name}\` | ${opts.originalFile.size} bytes |`);
    lines.push(`| Modified | \`${opts.modifiedFile.name}\` | ${opts.modifiedFile.size} bytes |`);

    return lines.join('\n');
  }

  /**
   * Generate statistics section
   */
  private generateStats(lines: DiffLine[]): string {
    const stats = this.getLineStats(lines);
    const total = lines.length;
    const similarity = total > 0 ? Math.round((stats.unchanged / total) * 100) : 100;

    const output: string[] = [];
    output.push('## Statistics');
    output.push('');
    output.push('| Metric | Count |');
    output.push('|--------|-------|');
    output.push(`| Added | \`+${stats.added}\` |`);
    output.push(`| Removed | \`-${stats.removed}\` |`);
    output.push(`| Modified | \`~${stats.modified}\` |`);
    output.push(`| Unchanged | \`${stats.unchanged}\` |`);
    output.push(`| Similarity | **${similarity}%** |`);

    return output.join('\n');
  }

  /**
   * Generate diff content
   */
  private generateDiffContent(
    lines: DiffLine[],
    opts: Required<MarkdownExportOptions>
  ): string {
    if (opts.useCodeBlocks) {
      return this.generateCodeBlockDiff(lines, opts);
    } else {
      return this.generateInlineDiff(lines, opts);
    }
  }

  /**
   * Generate diff as code block
   */
  private generateCodeBlockDiff(
    lines: DiffLine[],
    opts: Required<MarkdownExportOptions>
  ): string {
    const content = lines
      .map(line => {
        const symbol = opts.includeDiffSymbols ? this.getPrefixSymbol(line.type) : '';
        const prefix = symbol ? `${symbol} ` : '';
        return `${prefix}${line.content || ''}`;
      })
      .join('\n');

    return '```diff\n' + content + '\n```';
  }

  /**
   * Generate diff as inline formatted text
   */
  private generateInlineDiff(
    lines: DiffLine[],
    opts: Required<MarkdownExportOptions>
  ): string {
    return lines
      .map(line => this.formatInlineLine(line, opts))
      .join('\n');
  }

  /**
   * Format a single diff line for inline display
   */
  private formatInlineLine(line: DiffLine, opts: Required<MarkdownExportOptions>): string {
    const symbol = opts.includeDiffSymbols ? this.getPrefixSymbol(line.type) : '';
    const content = line.content || '';

    // Apply formatting based on type
    switch (line.type) {
      case 'added':
        return `${symbol} **${content}** (added)`;
      case 'removed':
        return `${symbol} ~~${content}~~ (removed)`;
      case 'modified':
        return `${symbol} *${content}* (modified)`;
      default:
        return `${symbol} ${content}`;
    }
  }
}
