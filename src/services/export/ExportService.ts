/**
 * Export Service
 * Main orchestrator for exporting diff results to various formats
 */

import type { DiffLine, FileInfo } from '../../types/types';
import type {
  ExportFormat,
  ExportOptions,
  ExportResult,
  HtmlExportOptions,
  IRenderer,
} from './types';

import { HTMLRenderer } from './renderers/HTMLRenderer';
import { PlainTextRenderer } from './renderers/PlainTextRenderer';
import { MarkdownRenderer } from './renderers/MarkdownRenderer';

/**
 * Export Service
 * Provides unified interface for exporting diff results to various formats
 */
export class ExportService {
  private static renderers = new Map<ExportFormat, IRenderer>([
    ['html', new HTMLRenderer()],
    ['plaintext', new PlainTextRenderer()],
    ['markdown', new MarkdownRenderer()],
    // Note: SVG is handled through HTML renderer
  ] as const);

  /**
   * Export diff lines to the specified format
   * @param lines - Diff lines to export
   * @param format - Target export format
   * @param options - Format-specific options
   * @returns Export result with content and metadata
   */
  static export(
    lines: DiffLine[],
    format: ExportFormat,
    options: ExportOptions = {}
  ): ExportResult {
    const renderer = this.getRenderer(format);

    if (!renderer) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    const content = renderer.render(lines, options);
    const mimeType = renderer.getMimeType();
    const filename = options.filename || renderer.generateFilename(
      options.originalFile,
      options.modifiedFile
    );

    return {
      content,
      mimeType,
      filename,
      format,
    };
  }

  /**
   * Export and download diff results
   * @param lines - Diff lines to export
   * @param format - Target export format
   * @param options - Format-specific options
   */
  static exportAndDownload(
    lines: DiffLine[],
    format: ExportFormat,
    options: ExportOptions = {}
  ): void {
    const result = this.export(lines, format, options);

    // Convert to Blob if not already
    const blob =
      result.content instanceof Blob
        ? result.content
        : new Blob([result.content], { type: result.mimeType });

    this.downloadBlob(blob, result.filename);
  }

  /**
   * Export HTML and preview in new window
   * @param lines - Diff lines to export
   * @param options - HTML export options
   */
  static exportHtmlAndPreview(
    lines: DiffLine[],
    options: HtmlExportOptions = {}
  ): void {
    const result = this.export(lines, 'html', options);

    if (typeof result.content !== 'string') {
      throw new Error('HTML export should return string content');
    }

    this.previewHtml(result.content);
  }

  /**
   * Generate filename for export
   * @param originalFile - Original file info
   * @param modifiedFile - Modified file info
   * @param format - Export format
   * @returns Generated filename
   */
  static generateFilename(
    originalFile?: FileInfo,
    modifiedFile?: FileInfo,
    format: ExportFormat = 'html'
  ): string {
    const renderer = this.getRenderer(format);

    if (!renderer) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    return renderer.generateFilename(originalFile, modifiedFile);
  }

  /**
   * Get renderer for the specified format
   * @param format - Export format
   * @returns Renderer instance or undefined
   */
  private static getRenderer(format: ExportFormat): IRenderer | undefined {
    return this.renderers.get(format);
  }

  /**
   * Download blob as file
   * @param blob - Blob to download
   * @param filename - Filename for download
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    try {
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Preview HTML content in new window
   * @param htmlContent - HTML content to preview
   */
  private static previewHtml(htmlContent: string): void {
    try {
      const previewWindow = window.open(
        '',
        '_blank',
        'width=1000,height=800,scrollbars=yes,resizable=yes'
      );

      if (!previewWindow) {
        throw new Error('Could not open preview window. Please check popup blocker settings.');
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
   * Check if format is supported
   * @param format - Format to check
   * @returns True if format is supported
   */
  static isFormatSupported(format: string): format is ExportFormat {
    return this.renderers.has(format as ExportFormat);
  }

  /**
   * Get list of supported formats
   * @returns Array of supported export formats
   */
  static getSupportedFormats(): ExportFormat[] {
    return Array.from(this.renderers.keys());
  }
}
