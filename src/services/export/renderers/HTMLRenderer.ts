/**
 * HTML Renderer
 * Generates standalone HTML documents from diff results
 */

import type { DiffLine } from '../../../types/types';
import type { HtmlExportOptions } from '../types';
import { BaseRenderer } from './BaseRenderer';
import { TAILWIND_CSS } from '../../tailwindEmbedded';
import { SvgDiffRenderer } from '../../svgDiffRenderer';

/**
 * Default HTML export options
 */
const DEFAULT_OPTIONS: Required<HtmlExportOptions> = {
  includeLineNumbers: true,
  includeHeader: true,
  includeStats: true,
  theme: 'light',
  differencesOnly: false,
  viewMode: 'unified',
  title: 'BDiff Comparison Report',
  filename: undefined as any,
  originalFile: undefined as any,
  modifiedFile: undefined as any,
};

/**
 * HTML format renderer
 */
export class HTMLRenderer extends BaseRenderer {
  /**
   * Render diff lines to standalone HTML document
   */
  render(lines: DiffLine[], options: HtmlExportOptions = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };

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
    opts: Required<HtmlExportOptions>,
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
    ${opts.includeHeader && opts.originalFile && opts.modifiedFile ? this.generateHeader(opts.originalFile, opts.modifiedFile, timestamp) : ''}
    ${opts.includeStats ? this.generateStatsSection(linesToRender) : ''}
    <section class="diff-section">
      <div class="diff-content">
        ${diffHtml}
      </div>
    </section>
    ${this.generateFooter()}
  </div>
</body>
</html>`;
  }

  /**
   * Generate HTML header section with file metadata
   */
  private generateHeader(
    originalFile: any,
    modifiedFile: any,
    timestamp: string
  ): string {
    return `
    <header class="report-header">
      <details class="header-details">
        <summary class="header-summary">
          <h1>BDiff Comparison Report</h1>
          <span class="toggle-icon">▶</span>
        </summary>
        <div class="metadata">
          <div class="metadata-row">
            <span class="label">Generated:</span>
            <span class="value">${this.formatDate(new Date(timestamp))}</span>
          </div>
          <div class="file-comparison">
            <div class="file-info original-file">
              <h3>📄 Original File</h3>
              <div class="file-details">
                <div><strong>Name:</strong> ${this.escapeHtml(originalFile.name)}</div>
                <div><strong>Size:</strong> ${originalFile.size.toLocaleString()} bytes</div>
                <div><strong>Lines:</strong> ${originalFile.content.split('\n').length.toLocaleString()}</div>
                ${originalFile.lastModified ? `<div><strong>Modified:</strong> ${this.formatDate(originalFile.lastModified, 'en-US')}</div>` : ''}
              </div>
            </div>
            <div class="comparison-arrow">↔️</div>
            <div class="file-info modified-file">
              <h3>📄 Modified File</h3>
              <div class="file-details">
                <div><strong>Name:</strong> ${this.escapeHtml(modifiedFile.name)}</div>
                <div><strong>Size:</strong> ${modifiedFile.size.toLocaleString()} bytes</div>
                <div><strong>Lines:</strong> ${modifiedFile.content.split('\n').length.toLocaleString()}</div>
                ${modifiedFile.lastModified ? `<div><strong>Modified:</strong> ${this.formatDate(modifiedFile.lastModified, 'en-US')}</div>` : ''}
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
  private generateFooter(): string {
    return `
    <footer class="report-footer">
      <p>Generated by <a href="https://bdiff.v41.me" target="_blank">BDiff</a> - File Comparison Tool</p>
    </footer>`;
  }

  /**
   * Generate unified view using SVG
   */
  private generateUnifiedView(
    lines: DiffLine[],
    options: Required<HtmlExportOptions>
  ): string {
    if (lines.length === 0) {
      return '<div class="text-center text-gray-500 p-8">No differences to display</div>';
    }

    const svgOptions = {
      width: 1200,
      lineHeight: 20,
      fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
      fontSize: 13,
      includeLineNumbers: options.includeLineNumbers,
      theme: options.theme,
    };

    const unifiedSvg = SvgDiffRenderer.generateSideBySideSvg(lines, [], svgOptions);

    return `
      <div class="border rounded-md overflow-hidden">
        <img
          src="${unifiedSvg}"
          alt="Unified diff view"
          class="w-full"
          style="display: block; max-width: 100%; height: auto;"
        />
      </div>`;
  }

  /**
   * Generate side-by-side view using SVG
   */
  private generateSideBySideView(
    lines: DiffLine[],
    options: Required<HtmlExportOptions>
  ): string {
    const originalPanelLines = lines.filter(l => l.type !== 'added');
    const modifiedPanelLines = lines.filter(l => l.type !== 'removed');

    if (originalPanelLines.length === 0 && modifiedPanelLines.length === 0) {
      return '<div class="grid grid-cols-2 gap-4"><div class="text-center text-gray-500 p-8">No differences to display</div></div>';
    }

    const svgOptions = {
      width: 600,
      lineHeight: 20,
      fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
      fontSize: 13,
      includeLineNumbers: options.includeLineNumbers,
      theme: options.theme,
    };

    const originalSvg = SvgDiffRenderer.generateSideBySideSvg(
      originalPanelLines,
      [],
      svgOptions
    );

    const modifiedSvg = SvgDiffRenderer.generateSideBySideSvg(
      modifiedPanelLines,
      [],
      svgOptions
    );

    return `
      <div class="grid grid-cols-2 gap-4" role="main" aria-label="Side-by-side diff view">
        <div class="space-y-1">
          <div class="flex items-center justify-between mb-2 px-4">
            <div class="font-medium text-sm text-gray-700">Original</div>
          </div>
          <div class="border rounded-md overflow-hidden">
            <img
              src="${originalSvg}"
              alt="Original file diff"
              class="w-full"
              style="display: block; max-width: 100%; height: auto;"
            />
          </div>
        </div>
        <div class="space-y-1">
          <div class="flex items-center justify-between mb-2 px-4">
            <div class="font-medium text-sm text-gray-700">Modified</div>
          </div>
          <div class="border rounded-md overflow-hidden">
            <img
              src="${modifiedSvg}"
              alt="Modified file diff"
              class="w-full"
              style="display: block; max-width: 100%; height: auto;"
            />
          </div>
        </div>
      </div>`;
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
    }`;
  }
}
