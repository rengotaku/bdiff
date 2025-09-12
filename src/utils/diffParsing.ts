import type { DiffLine, DiffType, DiffStats } from '../types/types'

/**
 * Utility class for parsing and filtering diff lines with statistical analysis
 * Provides efficient methods for filtering, analyzing, and summarizing diff data
 */
export class DiffParser {
  /**
   * Filter diff lines by one or more types
   * @param lines - Array of diff lines to filter
   * @param types - Array of diff types to include in the result
   * @returns Filtered array of diff lines
   * @throws {Error} If lines array is null/undefined or types array is empty
   */
  static filterByType(lines: DiffLine[], types: DiffType[]): DiffLine[] {
    if (!lines) {
      throw new Error('Lines array cannot be null or undefined');
    }
    if (!types || types.length === 0) {
      throw new Error('Types array cannot be empty');
    }
    
    return lines.filter(line => types.includes(line.type));
  }

  /**
   * Get only changed lines (added, removed, modified)
   * @param lines - Array of diff lines
   * @returns Array containing only changed lines
   */
  static getChangedLines(lines: DiffLine[]): DiffLine[] {
    return this.filterByType(lines, ['added', 'removed', 'modified']);
  }

  /**
   * Get only added lines
   * @param lines - Array of diff lines
   * @returns Array containing only added lines
   */
  static getAddedLines(lines: DiffLine[]): DiffLine[] {
    return this.filterByType(lines, ['added']);
  }

  /**
   * Get only removed lines
   * @param lines - Array of diff lines
   * @returns Array containing only removed lines
   */
  static getRemovedLines(lines: DiffLine[]): DiffLine[] {
    return this.filterByType(lines, ['removed']);
  }

  /**
   * Get only modified lines
   * @param lines - Array of diff lines
   * @returns Array containing only modified lines
   */
  static getModifiedLines(lines: DiffLine[]): DiffLine[] {
    return this.filterByType(lines, ['modified']);
  }

  /**
   * Get only unchanged lines
   * @param lines - Array of diff lines
   * @returns Array containing only unchanged lines
   */
  static getUnchangedLines(lines: DiffLine[]): DiffLine[] {
    return this.filterByType(lines, ['unchanged']);
  }

  /**
   * Calculate line count statistics by type
   * @param lines - Array of diff lines to analyze
   * @returns Object containing count for each diff type
   */
  static getLineStats(lines: DiffLine[]): Record<DiffType, number> {
    const stats: Record<DiffType, number> = {
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0
    };

    for (const line of lines) {
      stats[line.type]++;
    }

    return stats;
  }

  /**
   * Calculate comprehensive diff statistics including similarity percentage
   * @param lines - Array of diff lines to analyze
   * @returns Complete diff statistics object
   */
  static getDiffStats(lines: DiffLine[]): DiffStats {
    const lineStats = this.getLineStats(lines);
    const totalLines = lines.length;
    
    // Calculate similarity as percentage of unchanged lines
    const similarity = totalLines > 0 ? (lineStats.unchanged / totalLines) * 100 : 100;

    return {
      ...lineStats,
      similarity: Math.round(similarity * 100) / 100 // Round to 2 decimal places
    };
  }

  /**
   * Generate a human-readable summary of diff statistics
   * @param lines - Array of diff lines to summarize
   * @returns Formatted string summary of changes
   * @example
   * ```typescript
   * const summary = DiffParser.getDiffSummary(diffLines);
   * console.log(summary); // "+5 -3 ~2" or "No differences"
   * ```
   */
  static getDiffSummary(lines: DiffLine[]): string {
    const stats = this.getLineStats(lines);
    const parts: string[] = [];
    
    if (stats.added > 0) {
      parts.push(`+${stats.added}`);
    }
    
    if (stats.removed > 0) {
      parts.push(`-${stats.removed}`);
    }
    
    if (stats.modified > 0) {
      parts.push(`~${stats.modified}`);
    }

    return parts.length > 0 ? parts.join(' ') : 'No differences';
  }

  /**
   * Generate detailed summary including percentages
   * @param lines - Array of diff lines to analyze
   * @returns Detailed string summary with percentages
   * @example
   * ```typescript
   * const summary = DiffParser.getDetailedSummary(diffLines);
   * console.log(summary); // "5 added (10%), 3 removed (6%), 2 modified (4%), 40 unchanged (80%)"
   * ```
   */
  static getDetailedSummary(lines: DiffLine[]): string {
    const stats = this.getLineStats(lines);
    const total = lines.length;
    
    if (total === 0) return 'No lines to compare';
    
    const parts: string[] = [];
    
    if (stats.added > 0) {
      const percentage = Math.round((stats.added / total) * 100);
      parts.push(`${stats.added} added (${percentage}%)`);
    }
    
    if (stats.removed > 0) {
      const percentage = Math.round((stats.removed / total) * 100);
      parts.push(`${stats.removed} removed (${percentage}%)`);
    }
    
    if (stats.modified > 0) {
      const percentage = Math.round((stats.modified / total) * 100);
      parts.push(`${stats.modified} modified (${percentage}%)`);
    }
    
    if (stats.unchanged > 0) {
      const percentage = Math.round((stats.unchanged / total) * 100);
      parts.push(`${stats.unchanged} unchanged (${percentage}%)`);
    }

    return parts.join(', ');
  }

  /**
   * Check if the diff contains any changes
   * @param lines - Array of diff lines to check
   * @returns True if there are any added, removed, or modified lines
   */
  static hasChanges(lines: DiffLine[]): boolean {
    return lines.some(line => line.type !== 'unchanged');
  }

  /**
   * Get the range of line numbers in the diff
   * @param lines - Array of diff lines
   * @returns Object containing min and max line numbers
   */
  static getLineNumberRange(lines: DiffLine[]): { min: number; max: number } {
    if (lines.length === 0) {
      return { min: 0, max: 0 };
    }

    const lineNumbers = lines.map(line => line.lineNumber);
    return {
      min: Math.min(...lineNumbers),
      max: Math.max(...lineNumbers)
    };
  }
}