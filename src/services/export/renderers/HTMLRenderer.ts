/**
 * HTML Renderer
 * Generates standalone HTML documents from diff results
 */

import type { DiffLine, CharSegment, LineWithSegments, FileInfo } from '../../../types/types';
import { isCollapsedBlock, isUnifiedCollapsedBlock } from '../../../types/types';
import type { HtmlExportOptions, ExportLabels } from '../types';
import { BaseRenderer } from './BaseRenderer';
import { TAILWIND_CSS } from '../../tailwindEmbedded';
import { LinePairingService } from '../../linePairingService';

type HtmlRenderOptions = Required<Omit<HtmlExportOptions, 'filename' | 'originalFile' | 'modifiedFile' | 'labels'>> &
  Pick<HtmlExportOptions, 'filename' | 'originalFile' | 'modifiedFile' | 'labels'>;

/**
 * Default HTML export options
 */
const DEFAULT_OPTIONS: HtmlRenderOptions = {
  includeLineNumbers: true,
  includeHeader: true,
  includeStats: true,
  theme: 'light',
  differencesOnly: false,
  viewMode: 'unified',
  title: 'BDiff Comparison Report',
  collapseUnchanged: false,
};

/**
 * HTML format renderer
 */
export class HTMLRenderer extends BaseRenderer {
  private hasCharHighlighting = false;

  /**
   * Render diff lines to standalone HTML document
   */
  render(lines: DiffLine[], options: HtmlExportOptions = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options } as HtmlRenderOptions;
    this.hasCharHighlighting = false; // Reset for each render

    // Filter lines if differences-only mode is enabled
    const linesToExport = this.filterLines(lines, opts.differencesOnly);

    // Generate diff content HTML based on view mode
    const diffHtml =
      opts.viewMode === 'side-by-side'
        ? this.generateSideBySideView(linesToExport, opts)
        : this.generateUnifiedView(linesToExport, opts);

    const timestamp = new Date().toISOString();

    return this.generateHtmlDocument(diffHtml, opts, timestamp, linesToExport);
  }

  /**
   * Get MIME type for HTML
   */
  getMimeType(): string {
    return 'text/html;charset=utf-8';
  }

  /**
   * Get file extension
   */
  protected getFileExtension(): string {
    return '.html';
  }

  /**
   * Generate complete HTML document
   */
  private generateHtmlDocument(
    diffHtml: string,
    opts: HtmlRenderOptions,
    timestamp: string,
    linesToRender: DiffLine[]
  ): string {
    return `<!DOCTYPE html>
<html lang="ja" data-theme="${opts.theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="https://bdiff.v41.me/favicon.svg">
  <title>${this.escapeHtml(opts.title)}</title>
  <style>
${this.getEmbeddedCSS(opts.theme)}
  </style>
</head>
<body>
  <div class="container">
    ${opts.includeHeader && opts.originalFile && opts.modifiedFile ? this.generateHeader(opts.originalFile, opts.modifiedFile, timestamp, opts.labels) : ''}
    ${opts.includeStats ? this.generateStatsSection(linesToRender) : ''}
    <section class="diff-section">
      <div class="diff-content">
        ${diffHtml}
      </div>
    </section>
    ${this.generateFooter(opts.labels)}
  </div>
</body>
</html>`;
  }

  /**
   * Generate HTML header section with file metadata
   */
  private generateHeader(
    originalFile: FileInfo,
    modifiedFile: FileInfo,
    timestamp: string,
    labels?: ExportLabels
  ): string {
    const l = {
      comparisonReport: labels?.comparisonReport ?? 'BDiff Comparison Report',
      generated: labels?.generated ?? 'Generated:',
      originalFile: labels?.originalFile ?? '📄 Original File',
      modifiedFile: labels?.modifiedFile ?? '📄 Modified File',
      name: labels?.name ?? 'Name:',
      size: labels?.size ?? 'Size:',
      lines: labels?.lines ?? 'Lines:',
      lastModified: labels?.lastModified ?? 'Modified:',
    };

    return `
    <header class="report-header">
      <details class="header-details">
        <summary class="header-summary">
          <h1>${this.escapeHtml(l.comparisonReport)}</h1>
          <span class="toggle-icon">▶</span>
        </summary>
        <div class="metadata">
          <div class="metadata-row">
            <span class="label">${this.escapeHtml(l.generated)}</span>
            <span class="value">${this.formatDate(new Date(timestamp))}</span>
          </div>
          <div class="file-comparison">
            <div class="file-info original-file">
              <h3>${this.escapeHtml(l.originalFile)}</h3>
              <div class="file-details">
                <div><strong>${this.escapeHtml(l.name)}</strong> ${this.escapeHtml(originalFile.name)}</div>
                <div><strong>${this.escapeHtml(l.size)}</strong> ${originalFile.size.toLocaleString()} bytes</div>
                <div><strong>${this.escapeHtml(l.lines)}</strong> ${originalFile.content.split('\n').length.toLocaleString()}</div>
                ${originalFile.lastModified ? `<div><strong>${this.escapeHtml(l.lastModified)}</strong> ${this.formatDate(originalFile.lastModified, 'en-US')}</div>` : ''}
              </div>
            </div>
            <div class="comparison-arrow">↔️</div>
            <div class="file-info modified-file">
              <h3>${this.escapeHtml(l.modifiedFile)}</h3>
              <div class="file-details">
                <div><strong>${this.escapeHtml(l.name)}</strong> ${this.escapeHtml(modifiedFile.name)}</div>
                <div><strong>${this.escapeHtml(l.size)}</strong> ${modifiedFile.size.toLocaleString()} bytes</div>
                <div><strong>${this.escapeHtml(l.lines)}</strong> ${modifiedFile.content.split('\n').length.toLocaleString()}</div>
                ${modifiedFile.lastModified ? `<div><strong>${this.escapeHtml(l.lastModified)}</strong> ${this.formatDate(modifiedFile.lastModified, 'en-US')}</div>` : ''}
              </div>
            </div>
          </div>
        </div>
      </details>
    </header>`;
  }

  /**
   * Generate statistics summary section
   */
  private generateStatsSection(lines: DiffLine[]): string {
    const stats = this.getLineStats(lines);
    const total = lines.length;
    const similarity = total > 0 ? Math.round((stats.unchanged / total) * 100) : 100;

    return `
    <section class="stats-section">
      <div class="stats-inline">
        <span class="stat-item added">+${stats.added.toLocaleString()}</span>
        <span class="stat-item removed">-${stats.removed.toLocaleString()}</span>
        <span class="stat-item modified">~${stats.modified.toLocaleString()}</span>
        <span class="stat-item unchanged">=${stats.unchanged.toLocaleString()}</span>
        <span class="stat-item similarity">${similarity}%</span>
      </div>
    </section>`;
  }

  /**
   * Generate footer section
   */
  private generateFooter(labels?: ExportLabels): string {
    const footerText = labels?.footerText
      ? this.escapeHtml(labels.footerText)
      : 'Generated by <a href="https://bdiff.v41.me" target="_blank">BDiff</a> - File Comparison Tool';

    return `
    <footer class="report-footer">
      <p>${footerText}</p>
    </footer>`;
  }

  /**
   * Render character-level segments to HTML with highlighting
   */
  private renderCharSegments(segments: CharSegment[]): string {
    return segments.map(seg => {
      const escapedText = this.escapeHtml(seg.text);
      if (seg.type === 'removed') {
        return `<span class="char-removed">${escapedText}</span>`;
      } else if (seg.type === 'added') {
        return `<span class="char-added">${escapedText}</span>`;
      }
      return escapedText;
    }).join('');
  }

  /**
   * Generate unified view using HTML
   */
  private generateUnifiedView(
    lines: DiffLine[],
    options: HtmlRenderOptions
  ): string {
    if (lines.length === 0) {
      const noDiffText = options.labels?.noDifferences ?? 'No differences to display';
      return `<div class="text-center text-gray-500 p-8">${this.escapeHtml(noDiffText)}</div>`;
    }

    // Use LinePairingService to get lines with character segments
    const pairedLines = LinePairingService.pairForUnifiedView(lines, true);

    // Apply context filtering if collapseUnchanged is enabled
    const rows = options.collapseUnchanged
      ? LinePairingService.applyContextFilterUnified(pairedLines, 3)
      : pairedLines;

    const lineElements = rows.map(row => {
      if (isUnifiedCollapsedBlock(row)) {
        const colSpan = options.includeLineNumbers ? 3 : 2;
        const hiddenText = options.labels?.linesHidden
          ? (options.labels.linesHidden as string).replace('{{count}}', String(row.count))
          : `⋯ ${row.count} lines hidden ⋯`;
        return `
            <tr class="collapsed-row">
              <td colspan="${colSpan}" class="collapsed-cell">${this.escapeHtml(hiddenText)}</td>
            </tr>`;
      }
      return this.renderDiffLineWithSegments(row, options);
    }).join('\n');

    return `
      <div class="diff-table-container">
        <table class="diff-table unified-view">
          <tbody>
            ${lineElements}
          </tbody>
        </table>
      </div>`;
  }

  /**
   * Generate side-by-side view using HTML
   */
  private generateSideBySideView(
    lines: DiffLine[],
    options: HtmlRenderOptions
  ): string {
    if (lines.length === 0) {
      const noDiffText = options.labels?.noDifferences ?? 'No differences to display';
      return `<div class="grid grid-cols-2 gap-4"><div class="text-center text-gray-500 p-8">${this.escapeHtml(noDiffText)}</div></div>`;
    }

    // Use LinePairingService to get properly paired lines (same as screen display)
    const pairs = LinePairingService.pairLinesForSideBySide(lines, true);

    // Apply context filtering if collapseUnchanged is enabled
    const rows = options.collapseUnchanged
      ? LinePairingService.applyContextFilter(pairs, 3)
      : pairs;

    const colCount = options.includeLineNumbers ? 6 : 4;
    const pairRows = rows.map(row => {
      if (isCollapsedBlock(row)) {
        const hiddenText = options.labels?.linesHidden
          ? (options.labels.linesHidden as string).replace('{{count}}', String(row.count))
          : `⋯ ${row.count} lines hidden ⋯`;
        return `<tr class="side-by-side-row collapsed-row"><td colspan="${colCount}" class="collapsed-cell">${this.escapeHtml(hiddenText)}</td></tr>`;
      }
      const originalCell = this.renderSideBySideCell(row.original, options, 'original');
      const modifiedCell = this.renderSideBySideCell(row.modified, options, 'modified');
      return `<tr class="side-by-side-row">${originalCell}${modifiedCell}</tr>`;
    }).join('\n');

    return `
      <div class="side-by-side-container" role="main" aria-label="Side-by-side diff view">
        <table class="side-by-side-table">
          <thead>
            <tr class="panel-header-row">
              <th class="panel-header-cell line-num-header" style="width:40px;"></th>
              <th class="panel-header-cell symbol-header" style="width:20px;"></th>
              <th class="panel-header-cell content-header">${this.escapeHtml(options.labels?.original ?? 'Original')}</th>
              <th class="panel-header-cell line-num-header" style="width:40px;"></th>
              <th class="panel-header-cell symbol-header" style="width:20px;"></th>
              <th class="panel-header-cell content-header">${this.escapeHtml(options.labels?.modified ?? 'Modified')}</th>
            </tr>
          </thead>
          <tbody>
            ${pairRows}
          </tbody>
        </table>
      </div>`;
  }

  /**
   * Render a single cell in side-by-side view
   */
  private renderSideBySideCell(
    item: LineWithSegments | null,
    options: HtmlRenderOptions,
    side: 'original' | 'modified'
  ): string {
    if (!item) {
      const lineNumCell = options.includeLineNumbers ? '<td class="line-number empty"></td>' : '';
      return `${lineNumCell}<td class="line-symbol empty"></td><td class="line-content empty"></td>`;
    }

    const { line, segments } = item;
    const typeClass = `diff-line-${line.type}`;
    const symbol = this.getPrefixSymbol(line.type);

    // Use correct line number based on side
    const displayLineNumber = side === 'original'
      ? (line.originalLineNumber ?? line.lineNumber)
      : (line.newLineNumber ?? line.lineNumber);

    const lineNumCell = options.includeLineNumbers
      ? `<td class="line-number ${typeClass}">${displayLineNumber ?? ''}</td>`
      : '';

    // Use character segments if available
    const content = segments
      ? this.renderCharSegments(segments)
      : this.escapeHtml(line.content || '');

    if (segments && segments.length > 0) {
      this.hasCharHighlighting = true;
    }

    return `${lineNumCell}<td class="line-symbol ${typeClass}">${symbol}</td><td class="line-content ${typeClass}"><pre>${content}</pre></td>`;
  }

  /**
   * Render a diff line with optional character-level segments
   */
  private renderDiffLineWithSegments(
    lineWithSegments: LineWithSegments,
    options: HtmlRenderOptions
  ): string {
    const { line, segments } = lineWithSegments;
    const typeClass = `diff-line-${line.type}`;
    const symbol = this.getPrefixSymbol(line.type);
    const lineNumberCell = options.includeLineNumbers
      ? `<td class="line-number">${line.lineNumber}</td>`
      : '';

    // Use character segments if available, otherwise escape the full content
    const content = segments
      ? this.renderCharSegments(segments)
      : this.escapeHtml(line.content || '');

    // Track if character highlighting is used
    if (segments && segments.length > 0) {
      this.hasCharHighlighting = true;
    }

    return `
            <tr class="diff-line ${typeClass}">
              ${lineNumberCell}
              <td class="line-symbol">${symbol}</td>
              <td class="line-content"><pre>${content}</pre></td>
            </tr>`;
  }

  /**
   * Get embedded CSS styles
   */
  private getEmbeddedCSS(theme: 'light' | 'dark'): string {
    const isLight = theme === 'light';

    return `
    /* ========================================
       TAILWIND CSS (Full Application Styles)
       ======================================== */
    ${TAILWIND_CSS}

    /* ========================================
       CUSTOM EXPORT STYLES
       ======================================== */

    /* CSS Variables for theming */
    :root {
      --bg-color: ${isLight ? '#ffffff' : '#1a1a1a'};
      --text-color: ${isLight ? '#333333' : '#e0e0e0'};
      --border-color: ${isLight ? '#e5e7eb' : '#374151'};
      --header-bg: ${isLight ? '#f8fafc' : '#111827'};
      --added-bg: ${isLight ? '#dcfce7' : '#0d4f28'};
      --added-border: ${isLight ? '#22c55e' : '#16a34a'};
      --added-text: ${isLight ? '#166534' : '#4ade80'};
      --removed-bg: ${isLight ? '#fee2e2' : '#4c0f1a'};
      --removed-border: ${isLight ? '#ef4444' : '#dc2626'};
      --removed-text: ${isLight ? '#991b1b' : '#f87171'};
      --modified-bg: ${isLight ? '#fef3c7' : '#451a03'};
      --modified-border: ${isLight ? '#f59e0b' : '#d97706'};
      --modified-text: ${isLight ? '#92400e' : '#fbbf24'};
      --unchanged-bg: ${isLight ? '#f9fafb' : '#1f2937'};
      --unchanged-border: ${isLight ? '#d1d5db' : '#4b5563'};
      --unchanged-text: ${isLight ? '#6b7280' : '#9ca3af'};
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: var(--text-color);
      background-color: var(--bg-color);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .report-header {
      background: var(--header-bg);
      padding: 0 16px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      margin-bottom: 16px;
    }

    .header-details {
      border: none;
    }

    .header-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      list-style: none;
      user-select: none;
      padding: 0;
      margin: 0;
    }

    .header-summary::-webkit-details-marker {
      display: none;
    }

    .header-summary h1 {
      font-size: 20px;
      margin: 0;
      flex: 1;
    }

    .toggle-icon {
      font-size: 14px;
      transition: transform 0.2s ease;
      margin-left: 12px;
    }

    .header-details[open] .toggle-icon {
      transform: rotate(90deg);
    }

    .metadata {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }

    .metadata-row {
      display: flex;
      margin-bottom: 8px;
    }

    .metadata-row .label {
      font-weight: bold;
      margin-right: 8px;
      min-width: 80px;
    }

    .file-comparison {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 24px;
      align-items: center;
      margin-top: 16px;
    }

    .file-info h3 {
      font-size: 16px;
      margin-bottom: 12px;
      color: var(--text-color);
    }

    .file-details div {
      margin-bottom: 4px;
      font-size: 14px;
    }

    .comparison-arrow {
      font-size: 24px;
      text-align: center;
    }

    .stats-section {
      margin-bottom: 16px;
      padding: 0 16px;
      background: transparent;
      border-radius: 8px;
      border: none;
    }

    .stats-inline {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      font-size: 0.75rem;
      line-height: 1rem;
      font-weight: 500;
    }

    .stat-item {
      padding: 4px 12px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      white-space: nowrap;
    }

    .stat-item.added {
      background: var(--added-bg);
      color: var(--added-text);
      border: 1px solid var(--added-border);
    }

    .stat-item.removed {
      background: var(--removed-bg);
      color: var(--removed-text);
      border: 1px solid var(--removed-border);
    }

    .stat-item.modified {
      background: var(--modified-bg);
      color: var(--modified-text);
      border: 1px solid var(--modified-border);
    }

    .stat-item.unchanged {
      background: var(--unchanged-bg);
      color: var(--unchanged-text);
      border: 1px solid var(--unchanged-border);
    }

    .stat-item.similarity {
      background: var(--bg-color);
      color: var(--text-color);
      border: 1px solid var(--border-color);
      font-weight: 600;
    }

    .diff-section h2 {
      font-size: 20px;
      margin-bottom: 16px;
    }

    .report-footer {
      margin-top: 48px;
      padding: 24px;
      text-align: center;
      border-top: 1px solid var(--border-color);
      color: var(--unchanged-text);
    }

    .report-footer a {
      color: var(--text-color);
      text-decoration: none;
    }

    .report-footer a:hover {
      text-decoration: underline;
    }

    /* ========================================
       DIFF TABLE STYLES
       ======================================== */

    .diff-table-container {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow-x: auto;
      background: var(--bg-color);
    }

    .diff-table {
      width: 100%;
      border-collapse: collapse;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 13px;
      line-height: 1.5;
    }

    .diff-line {
      border-left: 4px solid transparent;
    }

    .diff-line td {
      padding: 2px 8px;
      vertical-align: top;
    }

    .line-number {
      width: 60px;
      text-align: right;
      color: var(--unchanged-text);
      user-select: none;
      padding-right: 12px;
      font-size: 12px;
    }

    .line-symbol {
      width: 20px;
      text-align: center;
      opacity: 0.5;
      user-select: none;
    }

    .line-content {
      width: 100%;
    }

    .line-content pre {
      margin: 0;
      padding: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      word-break: break-all;
      overflow-wrap: anywhere;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
    }

    /* Diff line type styles */
    .diff-line-added {
      background: var(--added-bg);
      border-left-color: var(--added-border);
    }

    .diff-line-added .line-symbol,
    .diff-line-added .line-content {
      color: var(--added-text);
    }

    .diff-line-removed {
      background: var(--removed-bg);
      border-left-color: var(--removed-border);
    }

    .diff-line-removed .line-symbol,
    .diff-line-removed .line-content {
      color: var(--removed-text);
    }

    .diff-line-modified {
      background: var(--modified-bg);
      border-left-color: var(--modified-border);
    }

    .diff-line-modified .line-symbol,
    .diff-line-modified .line-content {
      color: var(--modified-text);
    }

    .diff-line-unchanged {
      background: var(--unchanged-bg);
      border-left-color: var(--unchanged-border);
    }

    .diff-line-unchanged .line-symbol,
    .diff-line-unchanged .line-content {
      color: var(--unchanged-text);
    }
${this.hasCharHighlighting ? `
    /* Character-level highlighting */
    .char-removed {
      background-color: #fecaca;
      color: #991b1b;
      text-decoration: line-through;
    }

    .char-added {
      background-color: #bbf7d0;
      color: #166534;
    }
` : ''}
    /* Collapsed rows */
    .collapsed-row {
      background: ${isLight ? '#f3f4f6' : '#374151'};
    }

    .collapsed-cell {
      text-align: center;
      padding: 6px 8px;
      font-size: 12px;
      color: ${isLight ? '#6b7280' : '#9ca3af'};
      cursor: default;
    }

    /* Side-by-side layout */
    .side-by-side-container {
      overflow-x: auto;
    }

    .side-by-side-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      table-layout: fixed;
    }

    .side-by-side-table .panel-header-row {
      background: var(--header-bg);
      border-bottom: 1px solid var(--border-color);
    }

    .side-by-side-table .panel-header-cell {
      padding: 8px 4px;
      font-weight: 500;
      font-size: 14px;
      color: var(--text-color);
    }

    .side-by-side-table .panel-header-cell.content-header {
      text-align: left;
      padding-left: 12px;
    }

    .side-by-side-table .panel-header-cell.content-header:first-of-type {
      border-right: 2px solid var(--border-color);
    }

    .side-by-side-table th:nth-child(3) {
      border-right: 2px solid var(--border-color);
    }

    .side-by-side-row td {
      vertical-align: top;
      padding: 0;
    }

    .side-by-side-row td:nth-child(3) {
      border-right: 2px solid var(--border-color);
    }

    .side-by-side-row td.empty {
      background: #f9fafb;
    }

    .side-by-side-row td.line-number {
      width: 50px;
      padding: 4px 8px;
      font-size: 12px;
      color: #6b7280;
      background: #f9fafb;
      text-align: right;
      border-right: 1px solid var(--border-color);
    }

    .side-by-side-row td.line-symbol {
      width: 24px;
      padding: 4px 8px;
      font-size: 12px;
      text-align: center;
    }

    .side-by-side-row td.line-content {
      padding: 4px 12px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .side-by-side-row td.line-content pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .side-by-side-row td.diff-line-removed {
      background: #fef2f2;
    }

    .side-by-side-row td.diff-line-added {
      background: #f0fdf4;
    }

    .side-by-side-row td.diff-line-unchanged {
      background: transparent;
    }

    @media print {
      .container {
        max-width: none;
        padding: 16px;
      }

      .report-header {
        break-inside: avoid;
      }

      .header-details {
        display: block;
      }

      .header-summary {
        cursor: default;
      }

      .toggle-icon {
        display: none;
      }

      .header-details .metadata {
        display: block !important;
      }

      .stats-inline {
        gap: 12px;
        font-size: 12px;
      }

      .diff-container {
        border: 1px solid #000;
      }

      .report-footer {
        break-inside: avoid;
      }
    }

    @media (max-width: 768px) {
      .file-comparison {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .comparison-arrow {
        transform: rotate(90deg);
      }

      .side-by-side-container {
        grid-template-columns: 1fr;
        gap: 8px;
      }
    }`;
  }
}
