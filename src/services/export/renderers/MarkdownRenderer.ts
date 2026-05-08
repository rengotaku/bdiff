/**
 * Markdown Renderer
 * Generates Markdown-formatted output from diff results
 */

import type { DiffLine, FileInfo } from '../../../types/types';
import type { MarkdownExportOptions, ExportLabels } from '../types';
import { BaseRenderer } from './BaseRenderer';

type MarkdownRenderOptions = Required<Omit<MarkdownExportOptions, 'filename' | 'originalFile' | 'modifiedFile' | 'labels'>> &
  Pick<MarkdownExportOptions, 'filename' | 'originalFile' | 'modifiedFile' | 'labels'>;

/**
 * Default markdown export options
 */
const DEFAULT_OPTIONS: MarkdownRenderOptions = {
  useCodeBlocks: true,
  includeDiffSymbols: true,
  includeLineNumbers: false,
  includeStats: true,
  includeHeader: true,
  title: 'Diff Comparison',
  collapseUnchanged: false,
};

/**
 * Markdown format renderer
 */
export class MarkdownRenderer extends BaseRenderer {
  /**
   * Render diff lines to Markdown
   */
  render(lines: DiffLine[], options: MarkdownExportOptions = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options } as MarkdownRenderOptions;
    const sections: string[] = [];

    // Add title
    if (opts.title) {
      sections.push(`# ${opts.title}`);
      sections.push('');
    }

    // Add header if requested
    if (opts.includeHeader && opts.originalFile && opts.modifiedFile) {
      sections.push(this.generateHeader(opts, opts.originalFile, opts.modifiedFile));
      sections.push('');
    }

    // Add stats if requested
    if (opts.includeStats) {
      sections.push(this.generateStats(lines, opts.labels));
      sections.push('');
    }

    // Add diff content
    sections.push(`## ${opts.labels?.diffContent ?? 'Diff Content'}`);
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
  private generateHeader(opts: MarkdownRenderOptions, originalFile: FileInfo, modifiedFile: FileInfo): string {
    const l = opts.labels ?? {};
    const lines: string[] = [];

    lines.push(`## ${l.fileInformation ?? 'File Information'}`);
    lines.push('');
    lines.push(`**${l.generated ?? 'Generated:'}** ${this.formatDate(new Date())}`);
    lines.push('');
    lines.push('| File | Name | Size |');
    lines.push('|------|------|------|');
    lines.push(`| ${l.original ?? 'Original'} | \`${originalFile.name}\` | ${originalFile.size} bytes |`);
    lines.push(`| ${l.modified ?? 'Modified'} | \`${modifiedFile.name}\` | ${modifiedFile.size} bytes |`);

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

    const output: string[] = [];
    output.push(`## ${l.statistics ?? 'Statistics'}`);
    output.push('');
    output.push('| Metric | Count |');
    output.push('|--------|-------|');
    output.push(`| ${l.added ?? 'Added'} | \`+${stats.added}\` |`);
    output.push(`| ${l.removed ?? 'Removed'} | \`-${stats.removed}\` |`);
    output.push(`| ${l.modifiedStat ?? 'Modified'} | \`~${stats.modified}\` |`);
    output.push(`| ${l.unchanged ?? 'Unchanged'} | \`${stats.unchanged}\` |`);
    output.push(`| ${l.similarityStat ?? 'Similarity'} | **${similarity}%** |`);

    return output.join('\n');
  }

  /**
   * Generate diff content
   */
  private generateDiffContent(
    lines: DiffLine[],
    opts: MarkdownRenderOptions
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
    opts: MarkdownRenderOptions
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
    opts: MarkdownRenderOptions
  ): string {
    return lines
      .map(line => this.formatInlineLine(line, opts))
      .join('\n');
  }

  /**
   * Format a single diff line for inline display
   */
  private formatInlineLine(line: DiffLine, opts: MarkdownRenderOptions): string {
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
