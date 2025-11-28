import type { DiffType } from '../types/types'

/**
 * Utility functions for styling diff lines and generating CSS classes
 */
export class DiffStyler {
  /**
   * Get diff symbol for line type
   */
  static getDiffSymbol(type: DiffType): string {
    switch (type) {
      case 'added':
        return '+'
      case 'removed':
        return '-'
      case 'modified':
        return '~'
      case 'unchanged':
        return ' '
      default:
        return ' '
    }
  }

  /**
   * Get CSS class name for diff line type
   */
  static getLineClass(type: DiffType): string {
    switch (type) {
      case 'added':
        return 'diff-added'
      case 'removed':
        return 'diff-removed'
      case 'modified':
        return 'diff-modified'
      default:
        return 'diff-unchanged'
    }
  }
}
