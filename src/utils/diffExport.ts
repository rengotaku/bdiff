import type { DiffLine, DiffType } from '../types/types'
import { DiffParser } from './diffParsing'
import { DiffStyler } from './diffStyling'

/**
 * Configuration options for diff formatting
 */
export interface DiffFormatOptions {
  /** Whether to include line numbers in the output */
  includeLineNumbers?: boolean;
  /** Whether to include surrounding context lines */
  includeContext?: boolean;
  /** Output format type */
  format?: 'plain' | 'diff' | 'markdown' | 'html';
  /** Specific diff types to include in the output */
  selectedTypes?: DiffType[];
  /** Number of context lines to include around changes */
  contextLines?: number;
}

/**
 * Extended format options with file information
 */
export interface DiffFormatWithHeaderOptions extends DiffFormatOptions {
  /** Base filename for the diff */
  filename?: string;
  /** Original file name */
  originalFilename?: string;
  /** Modified file name */
  modifiedFilename?: string;
  /** Whether to include a summary header */
  includeHeader?: boolean;
}

/**
 * Utility class for exporting and formatting diff data in various formats
 * Supports plain text, diff format, markdown, and HTML output with flexible options
 */
export class DiffExporter {
  private static readonly DEFAULT_TYPES: DiffType[] = ['added', 'removed', 'modified', 'unchanged'];

  /**
   * Format a single diff line with optional symbols and line numbers
   * @param line - The diff line to format
   * @param includeSymbol - Whether to include diff symbols (+, -, ~)
   * @param includeLineNumbers - Whether to include line numbers
   * @returns Formatted line string
   */
  private static formatLine(line: DiffLine, includeSymbol: boolean, includeLineNumbers: boolean): string {
    const parts: string[] = [];
    
    if (includeSymbol) {
      parts.push(DiffStyler.getDiffSymbol(line.type));
    }
    if (includeLineNumbers) {
      parts.push(`${line.lineNumber}:`);
    }
    parts.push(line.content || '');
    
    return parts.join(' ').trim();
  }

  /**
   * Export diff lines as plain text
   * @param lines - Array of diff lines to export
   * @param options - Formatting options
   * @returns Plain text representation of the diff
   * @throws {Error} If lines array is empty and strict mode is enabled
   */
  static toPlainText(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    const { 
      includeLineNumbers = false, 
      selectedTypes = this.DEFAULT_TYPES 
    } = options;
    
    if (!lines || lines.length === 0) {
      return '';
    }
    
    try {
      const filteredLines = DiffParser.filterByType(lines, selectedTypes);
      
      return filteredLines.map(line => 
        this.formatLine(line, false, includeLineNumbers)
      ).join('\n');
    } catch (error) {
      console.error('Error formatting plain text:', error);
      return '';
    }
  }

  /**
   * Export diff lines in unified diff format
   * @param lines - Array of diff lines to export
   * @param options - Formatting options
   * @returns Diff format representation
   */
  static toDiffFormat(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    const { 
      includeLineNumbers = false, 
      selectedTypes = this.DEFAULT_TYPES
    } = options;
    
    if (!lines || lines.length === 0) {
      return '';
    }
    
    try {
      const filteredLines = DiffParser.filterByType(lines, selectedTypes);
      
      return filteredLines.map(line => 
        this.formatLine(line, true, includeLineNumbers)
      ).join('\n');
    } catch (error) {
      console.error('Error formatting diff format:', error);
      return '';
    }
  }

  /**
   * Export diff lines as markdown with syntax highlighting
   * @param lines - Array of diff lines to export
   * @param options - Formatting options
   * @returns Markdown representation with diff code block
   */
  static toMarkdown(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    const { 
      includeLineNumbers = false, 
      selectedTypes = this.DEFAULT_TYPES 
    } = options;
    
    if (!lines || lines.length === 0) {
      return '';
    }

    try {
      const filteredLines = DiffParser.filterByType(lines, selectedTypes);
      
      if (filteredLines.length === 0) {
        return '```\nNo differences to display\n```';
      }

      const markdownLines = ['```diff'];
      filteredLines.forEach(line => {
        markdownLines.push(this.formatLine(line, true, includeLineNumbers));
      });
      markdownLines.push('```');
      
      return markdownLines.join('\n');
    } catch (error) {
      console.error('Error formatting markdown:', error);
      return '```\nError formatting diff\n```';
    }
  }

  /**
   * Export diff lines as HTML with proper styling classes
   * @param lines - Array of diff lines to export
   * @param options - Formatting options
   * @returns HTML representation with styling classes
   */
  static toHtml(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    const { 
      includeLineNumbers = false, 
      selectedTypes = this.DEFAULT_TYPES 
    } = options;
    
    if (!lines || lines.length === 0) {
      return '<div class="diff-container empty">No differences to display</div>';
    }

    try {
      const filteredLines = DiffParser.filterByType(lines, selectedTypes);
      
      if (filteredLines.length === 0) {
        return '<div class="diff-container empty">No differences to display</div>';
      }

      const htmlLines = ['<div class="diff-container">'];

      filteredLines.forEach((line, index) => {
        const className = DiffStyler.getLineClass(line.type);
        const symbol = this.escapeHtml(DiffStyler.getDiffSymbol(line.type));
        const content = this.escapeHtml(line.content || '\n');
        const lineId = `line-${index + 1}`;

        // Matching DiffViewer structure from DiffViewer.tsx
        htmlLines.push(
          `<div class="diff-line-wrapper" id="${lineId}">` +
          (includeLineNumbers ? `<div class="line-number">${line.lineNumber}</div>` : '') +
          `<div class="diff-line-content">` +
          `<div class="diff-line ${className}">` +
          `<span class="diff-symbol" aria-hidden="true">${symbol}</span>` +
          `<span class="diff-content">${content}</span>` +
          '</div>' +
          '</div>' +
          '</div>'
        );
      });

      htmlLines.push('</div>');
      return htmlLines.join('\n');
    } catch (error) {
      console.error('Error formatting HTML:', error);
      return '<div class="diff-container error">Error formatting diff</div>';
    }
  }

  /**
   * Format diff lines using the specified format
   * @param lines - Array of diff lines to format
   * @param options - Formatting options including format type
   * @returns Formatted string in the requested format
   */
  static format(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    const { format = 'plain' } = options;

    switch (format) {
      case 'diff': 
        return this.toDiffFormat(lines, options);
      case 'markdown': 
        return this.toMarkdown(lines, options);
      case 'html': 
        return this.toHtml(lines, options);
      case 'plain':
      default: 
        return this.toPlainText(lines, options);
    }
  }

  /**
   * Format diff lines with a descriptive header
   * @param lines - Array of diff lines to format
   * @param options - Extended formatting options with header information
   * @returns Formatted string with header and diff content
   */
  static formatWithHeader(lines: DiffLine[], options: DiffFormatWithHeaderOptions = {}): string {
    const { 
      format = 'plain',
      filename = 'diff',
      originalFilename = 'original',
      modifiedFilename = 'modified',
      includeHeader = true
    } = options;

    if (!includeHeader) {
      return this.format(lines, options);
    }

    try {
      const summary = DiffParser.getDiffSummary(lines);
      const content = this.format(lines, options);
      const timestamp = new Date().toISOString();

      switch (format) {
        case 'markdown':
          return [
            `## ${filename}`,
            '',
            `**Changes:** ${summary}`,
            `**Generated:** ${timestamp}`,
            '',
            content
          ].join('\n');

        case 'html':
          return [
            '<div class="diff-header">',
            `<h3>${this.escapeHtml(filename)}</h3>`,
            `<p><strong>Changes:</strong> ${this.escapeHtml(summary)}</p>`,
            `<p><strong>Generated:</strong> ${timestamp}</p>`,
            '</div>',
            content
          ].join('\n');

        case 'diff':
          return [
            `--- ${originalFilename}`,
            `+++ ${modifiedFilename}`,
            `@@ Changes: ${summary} @@`,
            content
          ].join('\n');

        case 'plain':
        default:
          return [
            `${filename} (${summary})`,
            `Generated: ${timestamp}`,
            '',
            content
          ].join('\n');
      }
    } catch (error) {
      console.error('Error formatting with header:', error);
      return this.format(lines, options);
    }
  }

  /**
   * Escape HTML special characters for safe HTML output
   * @param text - Text to escape
   * @returns HTML-escaped text
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get available export formats
   * @returns Array of supported format types
   */
  static getSupportedFormats(): DiffFormatOptions['format'][] {
    return ['plain', 'diff', 'markdown', 'html'];
  }

  /**
   * Validate format options
   * @param options - Options to validate
   * @returns True if options are valid
   */
  static validateOptions(options: DiffFormatOptions): boolean {
    const { format, selectedTypes, contextLines } = options;
    
    // Validate format
    if (format && !this.getSupportedFormats().includes(format)) {
      return false;
    }
    
    // Validate selected types
    if (selectedTypes && selectedTypes.length === 0) {
      return false;
    }
    
    // Validate context lines
    if (contextLines !== undefined && (contextLines < 0 || contextLines > 100)) {
      return false;
    }
    
    return true;
  }
}