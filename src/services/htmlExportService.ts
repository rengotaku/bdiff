import type { DiffResult, FileInfo, DiffStats } from '../types/types';
import { DiffExporter } from '../utils/diffExport';

/**
 * Configuration options for HTML export
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
}

/**
 * Default export options
 */
export const DEFAULT_HTML_EXPORT_OPTIONS: HtmlExportOptions = {
  includeLineNumbers: true,
  includeHeader: true,
  includeStats: true,
  theme: 'light',
  differencesOnly: false,
};

/**
 * Service for exporting diff results to standalone HTML files
 */
export class HtmlExportService {
  /**
   * Generate a complete, standalone HTML document from diff results
   */
  static generateHtmlDocument(
    diffResult: DiffResult,
    originalFile: FileInfo,
    modifiedFile: FileInfo,
    options: Partial<HtmlExportOptions> = {}
  ): string {
    const opts = { ...DEFAULT_HTML_EXPORT_OPTIONS, ...options };
    
    const title = opts.title || `${originalFile.name} vs ${modifiedFile.name} - Diff Report`;
    const timestamp = new Date().toISOString();
    
    // Filter lines if differences-only mode is enabled
    const linesToExport = opts.differencesOnly 
      ? diffResult.lines.filter(line => line.type !== 'unchanged')
      : diffResult.lines;

    // Generate the diff content HTML
    const diffHtml = DiffExporter.toHtml(linesToExport, {
      includeLineNumbers: opts.includeLineNumbers,
      selectedTypes: opts.differencesOnly 
        ? ['added', 'removed', 'modified'] 
        : ['added', 'removed', 'modified', 'unchanged']
    });

    return `<!DOCTYPE html>
<html lang="ja" data-theme="${opts.theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
${this.getEmbeddedCSS(opts.theme)}
  </style>
</head>
<body>
  <div class="container">
    ${opts.includeHeader ? this.generateHeader(originalFile, modifiedFile, timestamp) : ''}
    ${opts.includeStats ? this.generateStatsSection(diffResult.stats) : ''}
    <section class="diff-section">
      <h2>🔄 Comparison Result</h2>
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
      <h1>📄 BDiff Comparison Report</h1>
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
    </header>`;
  }

  /**
   * Generate the statistics summary section
   */
  private static generateStatsSection(stats: DiffStats): string {
    return `
    <section class="stats-section">
      <h2>📊 Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card added">
          <div class="stat-number">+${stats.added.toLocaleString()}</div>
          <div class="stat-label">Added Lines</div>
        </div>
        <div class="stat-card removed">
          <div class="stat-number">-${stats.removed.toLocaleString()}</div>
          <div class="stat-label">Removed Lines</div>
        </div>
        <div class="stat-card modified">
          <div class="stat-number">${stats.modified.toLocaleString()}</div>
          <div class="stat-label">Changed Lines</div>
        </div>
        <div class="stat-card unchanged">
          <div class="stat-number">${stats.unchanged.toLocaleString()}</div>
          <div class="stat-label">Unchanged Lines</div>
        </div>
        <div class="stat-card similarity">
          <div class="stat-number">${Math.round(stats.similarity)}%</div>
          <div class="stat-label">Similarity</div>
        </div>
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
      <p class="print-note">💡 This report is optimized for printing</p>
    </footer>`;
  }

  /**
   * Get embedded CSS styles for the HTML export
   */
  private static getEmbeddedCSS(theme: 'light' | 'dark'): string {
    const isLight = theme === 'light';
    
    return `
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
      padding: 24px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      margin-bottom: 24px;
    }

    .report-header h1 {
      font-size: 28px;
      margin-bottom: 16px;
      text-align: center;
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

    /* Stats section */
    .stats-section {
      margin-bottom: 32px;
    }

    .stats-section h2 {
      font-size: 20px;
      margin-bottom: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      padding: 16px;
      text-align: center;
      border-radius: 8px;
      border: 2px solid;
    }

    .stat-card.added {
      background: var(--added-bg);
      border-color: var(--added-border);
      color: var(--added-text);
    }

    .stat-card.removed {
      background: var(--removed-bg);
      border-color: var(--removed-border);
      color: var(--removed-text);
    }

    .stat-card.modified {
      background: var(--modified-bg);
      border-color: var(--modified-border);
      color: var(--modified-text);
    }

    .stat-card.unchanged {
      background: var(--unchanged-bg);
      border-color: var(--unchanged-border);
      color: var(--unchanged-text);
    }

    .stat-card.similarity {
      background: var(--header-bg);
      border-color: var(--border-color);
      color: var(--text-color);
    }

    .stat-number {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Diff section */
    .diff-section h2 {
      font-size: 20px;
      margin-bottom: 16px;
    }

    .diff-container {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow-x: auto;
    }

    .diff-line {
      display: flex;
      align-items: center;
      padding: 4px 12px;
      font-size: 14px;
      line-height: 1.4;
      border-left: 3px solid transparent;
      min-height: 24px;
    }

    .diff-line:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .diff-line.diff-line-added {
      background: var(--added-bg);
      border-left-color: var(--added-border);
    }

    .diff-line.diff-line-removed {
      background: var(--removed-bg);
      border-left-color: var(--removed-border);
    }

    .diff-line.diff-line-modified {
      background: var(--modified-bg);
      border-left-color: var(--modified-border);
    }

    .diff-line.diff-line-unchanged {
      background: var(--unchanged-bg);
      border-left-color: var(--unchanged-border);
    }

    .diff-symbol {
      display: inline-block;
      width: 20px;
      font-weight: bold;
      text-align: center;
      margin-right: 8px;
    }

    .line-number {
      display: inline-block;
      min-width: 50px;
      text-align: right;
      margin-right: 12px;
      color: var(--unchanged-text);
      font-size: 12px;
    }

    .diff-content {
      flex: 1;
      white-space: pre;
      word-break: break-all;
    }

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
      
      .stats-grid {
        grid-template-columns: repeat(5, 1fr);
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

    /* Responsive design */
    @media (max-width: 768px) {
      .file-comparison {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .comparison-arrow {
        transform: rotate(90deg);
      }
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .diff-line {
        font-size: 12px;
      }
    }`;
  }

  /**
   * Download the HTML content as a file
   */
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