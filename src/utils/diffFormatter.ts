/**
 * Compatibility layer for diffFormatter - delegates to specialized modules
 * @deprecated This file is maintained for backward compatibility.
 * Use the specialized modules directly:
 * - DiffParser from './diffParsing'
 * - DiffStyler from './diffStyling' 
 * - DiffExporter from './diffExport'
 */
import type { DiffLine, DiffType } from '../types/types'
import { DiffParser } from './diffParsing'
import { DiffExporter, type DiffFormatOptions } from './diffExport'

// Re-export types and interfaces for backward compatibility
export type { DiffFormatOptions }

/**
 * @deprecated Use DiffExporter, DiffParser, and DiffStyler instead
 * Legacy DiffFormatter class for backward compatibility
 */
export class DiffFormatter {
  /**
   * Filter diff lines by type
   * @deprecated Use DiffParser.filterByType instead
   */
  static filterByType(lines: DiffLine[], types: DiffType[]): DiffLine[] {
    return DiffParser.filterByType(lines, types)
  }


  /**
   * Format lines as plain text
   * @deprecated Use DiffExporter.toPlainText instead
   */
  static toPlainText(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    return DiffExporter.toPlainText(lines, options)
  }

  /**
   * Format lines with diff symbols (+/-)
   * @deprecated Use DiffExporter.toDiffFormat instead
   */
  static toDiffFormat(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    return DiffExporter.toDiffFormat(lines, options)
  }

  /**
   * Format lines as Markdown
   * @deprecated Use DiffExporter.toMarkdown instead
   */
  static toMarkdown(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    return DiffExporter.toMarkdown(lines, options)
  }

  /**
   * Format lines as HTML
   * @deprecated Use DiffExporter.toHtml instead
   */
  static toHtml(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    return DiffExporter.toHtml(lines, options)
  }

  /**
   * Get a summary of diff statistics
   * @deprecated Use DiffParser.getDiffSummary instead
   */
  static getDiffSummary(lines: DiffLine[]): string {
    return DiffParser.getDiffSummary(lines)
  }

  /**
   * Format diff with multiple options
   * @deprecated Use DiffExporter.format instead
   */
  static format(lines: DiffLine[], options: DiffFormatOptions = {}): string {
    return DiffExporter.format(lines, options)
  }

  /**
   * Create a formatted diff with header information
   * @deprecated Use DiffExporter.formatWithHeader instead
   */
  static formatWithHeader(
    lines: DiffLine[], 
    options: DiffFormatOptions & { 
      filename?: string
      originalFilename?: string
      modifiedFilename?: string
    } = {}
  ): string {
    return DiffExporter.formatWithHeader(lines, options)
  }

  /**
   * Get only changed lines (added, removed, modified)
   * @deprecated Use DiffParser.getChangedLines instead
   */
  static getChangedLines(lines: DiffLine[]): DiffLine[] {
    return DiffParser.getChangedLines(lines)
  }

  /**
   * Get only added lines
   * @deprecated Use DiffParser.getAddedLines instead
   */
  static getAddedLines(lines: DiffLine[]): DiffLine[] {
    return DiffParser.getAddedLines(lines)
  }

  /**
   * Get only removed lines
   * @deprecated Use DiffParser.getRemovedLines instead
   */
  static getRemovedLines(lines: DiffLine[]): DiffLine[] {
    return DiffParser.getRemovedLines(lines)
  }

  /**
   * Get only modified lines
   * @deprecated Use DiffParser.getModifiedLines instead
   */
  static getModifiedLines(lines: DiffLine[]): DiffLine[] {
    return DiffParser.getModifiedLines(lines)
  }

  /**
   * Get line count by type
   * @deprecated Use DiffParser.getLineStats instead
   */
  static getLineStats(lines: DiffLine[]): Record<DiffType, number> {
    return DiffParser.getLineStats(lines)
  }
}

// Re-export new specialized modules for direct use
export { DiffParser } from './diffParsing'
export { DiffStyler } from './diffStyling' 
export { DiffExporter } from './diffExport'