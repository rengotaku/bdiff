/**
 * @deprecated This file is maintained for backward compatibility only.
 * Use the new ExportService from 'services/export' instead.
 *
 * Migration guide:
 * Before: HtmlExportService.generateHtmlDocument(diffResult, original, modified, options)
 * After:  ExportService.export(diffResult.lines, 'html', { ...options, originalFile: original, modifiedFile: modified })
 *
 * Before: HtmlExportService.downloadHtml(htmlContent, filename)
 * After:  ExportService.exportAndDownload(lines, 'html', options)
 *
 * Before: HtmlExportService.previewHtml(htmlContent)
 * After:  ExportService.exportHtmlAndPreview(lines, options)
 *
 * This file will be removed in version 2.0
 */

import type { DiffResult, FileInfo, DiffStats, DiffLine } from '../types/types';
import { TAILWIND_CSS } from './tailwindEmbedded';
import { SvgDiffRenderer } from './svgDiffRenderer';

/**
 * Configuration options for HTML export
 * @deprecated Use HtmlExportOptions from 'services/export' instead
 */
export interface HtmlExportOptions {
  /** Whether to include line numbers in the diff display */
  includeLineNumbers: boolean;
  /** Whether to include the metadata header with file information */
  includeHeader: boolean;
  /** Whether to include the statistics summary */
  includeStats: boolean;
  /** Theme for the exported HTML ('light' | 'dark') */
  theme: 'light' | 'dark';
  /** Custom title for the exported document */
  title?: string;
  /** Whether to include only differences (hide unchanged lines) */
  differencesOnly: boolean;
  /** View mode for the diff display */
  viewMode: 'unified' | 'side-by-side';
}

/**
 * Default export options
 * @deprecated Use default options from the new ExportService instead
 */
export const DEFAULT_HTML_EXPORT_OPTIONS: HtmlExportOptions = {
  includeLineNumbers: true,
  includeHeader: true,
  includeStats: true,
  theme: 'light',
  differencesOnly: false,
  viewMode: 'unified', // Default to unified for backward compatibility
};

/**
 * Service for exporting diff results to standalone HTML files
 * @deprecated Use ExportService from 'services/export' instead
 */
export class HtmlExportService {
  /**
   * Generate a complete, standalone HTML document from diff results
   * @deprecated Use ExportService.export(lines, 'html', options) instead
   */
  static generateHtmlDocument(
    diffResult: DiffResult,
    originalFile: FileInfo,
    modifiedFile: FileInfo,
    options: Partial<HtmlExportOptions> = {}
  ): string {
    const opts = { ...DEFAULT_HTML_EXPORT_OPTIONS, ...options };

    const timestamp = new Date().toISOString();
    
    // Filter lines if differences-only mode is enabled
    const linesToExport = opts.differencesOnly
      ? diffResult.lines.filter(line => line.type !== 'unchanged')
      : diffResult.lines;

    // Generate the diff content HTML based on view mode
    // Both modes now use SVG for stable, consistent rendering
    const diffHtml = opts.viewMode === 'side-by-side'
      ? this.generateSideBySideView(linesToExport, opts)
      : this.generateUnifiedView(linesToExport, opts);

    return `<!DOCTYPE html>
<html lang="ja" data-theme="${opts.theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="https://bdiff.v41.me/favicon.svg">
  <title>BDiff Comparison Report</title>
  <style>
${this.getEmbeddedCSS(opts.theme)}
  </style>
</head>
<body>
  <div class="container">
    ${opts.includeHeader ? this.generateHeader(originalFile, modifiedFile, timestamp) : ''}
    ${opts.includeStats ? this.generateStatsSection(diffResult.stats) : ''}
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
   * Generate the HTML header section with file metadata
   */
  private static generateHeader(originalFile: FileInfo, modifiedFile: FileInfo, timestamp: string): string {
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
            <span class="value">${new Date(timestamp).toLocaleString('ja-JP')}</span>
          </div>
          <div class="file-comparison">
            <div class="file-info original-file">
              <h3>📄 Original File</h3>
              <div class="file-details">
                <div><strong>Name:</strong> ${this.escapeHtml(originalFile.name)}</div>
                <div><strong>Size:</strong> ${originalFile.size.toLocaleString()} bytes</div>
                <div><strong>Lines:</strong> ${originalFile.content.split('\\n').length.toLocaleString()}</div>
                ${originalFile.lastModified ? `<div><strong>Modified:</strong> ${originalFile.lastModified.toLocaleString('en-US')}</div>` : ''}
              </div>
            </div>
            <div class="comparison-arrow">↔️</div>
            <div class="file-info modified-file">
              <h3>📄 Modified File</h3>
              <div class="file-details">
                <div><strong>Name:</strong> ${this.escapeHtml(modifiedFile.name)}</div>
                <div><strong>Size:</strong> ${modifiedFile.size.toLocaleString()} bytes</div>
                <div><strong>Lines:</strong> ${modifiedFile.content.split('\\n').length.toLocaleString()}</div>
                ${modifiedFile.lastModified ? `<div><strong>Modified:</strong> ${modifiedFile.lastModified.toLocaleString('en-US')}</div>` : ''}
              </div>
            </div>
          </div>
        </div>
      </details>
    </header>`;
  }

  /**
   * Generate the statistics summary section
   */
  private static generateStatsSection(stats: DiffStats): string {
    return `
    <section class="stats-section">
      <div class="stats-inline">
        <span class="stat-item added">+${stats.added.toLocaleString()}</span>
        <span class="stat-item removed">-${stats.removed.toLocaleString()}</span>
        <span class="stat-item modified">~${stats.modified.toLocaleString()}</span>
        <span class="stat-item unchanged">=${stats.unchanged.toLocaleString()}</span>
        <span class="stat-item similarity">${Math.round(stats.similarity)}%</span>
      </div>
    </section>`;
  }

  /**
   * Generate the footer section
   */
  private static generateFooter(): string {
    return `
    <footer class="report-footer">
      <p>Generated by <a href="https://bdiff.v41.me" target="_blank">BDiff</a> - File Comparison Tool</p>
    </footer>`;
  }

  /**
   * Get embedded CSS styles for the HTML export
   */
  private static getEmbeddedCSS(theme: 'light' | 'dark'): string {
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

    /* Base styles */
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

    /* Header styles */
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

    /* Stats section - Compact inline display */
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

    /* Diff section */
    .diff-section h2 {
      font-size: 20px;
      margin-bottom: 16px;
    }

    /* Note: Unified view now uses Tailwind classes directly in HTML
       No custom CSS needed for diff lines, as getLineClassName() provides
       all necessary Tailwind utility classes (bg-*, border-*, text-*, etc.) */

    /* Footer */
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

    .print-note {
      font-size: 12px;
      margin-top: 8px;
    }

    /* Print styles */
    @media print {
      .container {
        max-width: none;
        padding: 16px;
      }

      .report-header {
        break-inside: avoid;
      }

      /* Force header to be expanded when printing */
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

      /* Compact stats for print */
      .stats-inline {
        gap: 12px;
        font-size: 12px;
      }

      .diff-line {
        break-inside: avoid;
        font-size: 11px;
        padding: 2px 8px;
      }

      .diff-container {
        border: 1px solid #000;
      }

      .report-footer {
        break-inside: avoid;
      }
    }

    /* Note: Side-by-side view now uses Tailwind classes directly in HTML
       No custom CSS needed - uses grid-cols-2, flex, border-l-4, etc. */

    /* Responsive design */
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

  /**
   * Generate unified view using SVG image
   * This approach provides stable layout and consistent rendering across browsers
   */
  private static generateUnifiedView(
    lines: DiffLine[],
    options: HtmlExportOptions
  ): string {
    if (lines.length === 0) {
      return '<div class="text-center text-gray-500 p-8">No differences to display</div>';
    }

    // Generate SVG data URI for unified view
    const svgOptions = {
      width: 1200, // Wider for unified view
      lineHeight: 20,
      fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
      fontSize: 13,
      includeLineNumbers: options.includeLineNumbers,
      theme: options.theme
    };

    const unifiedSvg = SvgDiffRenderer.generateSideBySideSvg(
      lines,
      [],
      svgOptions
    );

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
   * Generate side-by-side view using SVG images
   * This approach provides stable layout and consistent rendering across browsers
   */
  private static generateSideBySideView(
    lines: DiffLine[],
    options: HtmlExportOptions
  ): string {
    // Separate lines for each panel - matching application behavior
    // Original panel: removed + unchanged + modified lines
    // Modified panel: added + unchanged + modified lines
    const originalPanelLines = lines.filter(l => l.type !== 'added');
    const modifiedPanelLines = lines.filter(l => l.type !== 'removed');

    if (originalPanelLines.length === 0 && modifiedPanelLines.length === 0) {
      return '<div class="grid grid-cols-2 gap-4"><div class="text-center text-gray-500 p-8">No differences to display</div></div>';
    }

    // Generate SVG data URIs for each panel
    const svgOptions = {
      width: 600,
      lineHeight: 20,
      fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
      fontSize: 13,
      includeLineNumbers: options.includeLineNumbers,
      theme: options.theme
    };

    // Generate separate SVG for each panel
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

  static downloadHtml(htmlContent: string, filename: string): void {
    try {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = this.sanitizeFilename(filename);
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading HTML file:', error);
      throw new Error('Failed to download HTML file');
    }
  }

  /**
   * Preview the HTML content in a new window
   */
  static previewHtml(htmlContent: string): void {
    try {
      const previewWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
      
      if (!previewWindow) {
        throw new Error('Could not open preview due to popup blocker');
      }
      
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
      previewWindow.document.title = 'BDiff Export Preview';
    } catch (error) {
      console.error('Error previewing HTML:', error);
      throw new Error('Failed to display HTML preview');
    }
  }

  /**
   * Generate a filename for the export
   */
  static generateFilename(originalFile: FileInfo, modifiedFile: FileInfo): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const originalName = originalFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const modifiedName = modifiedFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
    
    return `${originalName}_vs_${modifiedName}_diff_${timestamp}.html`;
  }

  /**
   * Sanitize filename for safe download
   */
  private static sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_');
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}