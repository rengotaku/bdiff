/**
 * Base Renderer
 * Abstract base class for all export format renderers
 */

import type { DiffLine, DiffType, FileInfo } from '../../../types/types';
import type { IRenderer, ExportOptions } from '../types';

/**
 * Abstract base renderer providing common functionality
 */
export abstract class BaseRenderer implements IRenderer {
  /**
   * Render diff lines to the target format
   * Must be implemented by concrete renderers
   */
  abstract render(lines: DiffLine[], options: ExportOptions): string | Blob;

  /**
   * Get the MIME type for this format
   * Must be implemented by concrete renderers
   */
  abstract getMimeType(): string;

  /**
   * Generate default filename for this format
   * Can be overridden by concrete renderers
   */
  generateFilename(originalFile?: FileInfo, modifiedFile?: FileInfo): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (originalFile && modifiedFile) {
      const originalName = this.stripExtension(originalFile.name);
      const modifiedName = this.stripExtension(modifiedFile.name);
      return this.sanitizeFilename(
        `${originalName}_vs_${modifiedName}_diff_${timestamp}${this.getFileExtension()}`
      );
    }

    return this.sanitizeFilename(`diff_${timestamp}${this.getFileExtension()}`);
  }

  /**
   * Get file extension for this format (e.g., '.html', '.svg')
   * Should be overridden by concrete renderers
   */
  protected abstract getFileExtension(): string;

  /**
   * Get prefix symbol for diff line type
   */
  protected getPrefixSymbol(type: DiffType): string {
    switch (type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      case 'modified':
        return '~';
      default:
        return ' ';
    }
  }

  /**
   * Filter lines based on options (e.g., differences-only mode)
   */
  protected filterLines(lines: DiffLine[], showOnlyDifferences: boolean): DiffLine[] {
    if (!showOnlyDifferences) {
      return lines;
    }
    return lines.filter(line => line.type !== 'unchanged');
  }

  /**
   * Escape HTML special characters
   */
  protected escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return text.replace(/[&<>"']/g, char => htmlEscapes[char] || char);
  }

  /**
   * Escape markdown special characters
   */
  protected escapeMarkdown(text: string): string {
    const mdEscapes: Record<string, string> = {
      '\\': '\\\\',
      '`': '\\`',
      '*': '\\*',
      '_': '\\_',
      '{': '\\{',
      '}': '\\}',
      '[': '\\[',
      ']': '\\]',
      '(': '\\(',
      ')': '\\)',
      '#': '\\#',
      '+': '\\+',
      '-': '\\-',
      '.': '\\.',
      '!': '\\!'
    };

    return text.replace(/[\\`*_{}[\]()#+\-.!]/g, char => mdEscapes[char] || char);
  }

  /**
   * Strip file extension from filename
   */
  protected stripExtension(filename: string): string {
    return filename.replace(/\.[^/.]+$/, '');
  }

  /**
   * Sanitize filename for safe download
   */
  protected sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_');
  }

  /**
   * Format file size in human-readable format
   */
  protected formatFileSize(bytes: number): string {
    const units = ['bytes', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Format date in locale-specific format
   */
  protected formatDate(date: Date, locale: string = 'ja-JP'): string {
    return date.toLocaleString(locale);
  }

  /**
   * Get line count by type
   */
  protected getLineStats(lines: DiffLine[]): {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  } {
    return lines.reduce(
      (stats, line) => {
        switch (line.type) {
          case 'added':
            stats.added++;
            break;
          case 'removed':
            stats.removed++;
            break;
          case 'modified':
            stats.modified++;
            break;
          case 'unchanged':
            stats.unchanged++;
            break;
        }
        return stats;
      },
      { added: 0, removed: 0, modified: 0, unchanged: 0 }
    );
  }
}
