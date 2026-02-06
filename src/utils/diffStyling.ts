import type { DiffType } from '../types/types'
import { getPrefixSymbol } from './diffRendering'

/**
 * Utility functions for styling diff lines and generating CSS classes
 */
export class DiffStyler {
  /**
   * Get diff symbol for line type
   * @deprecated Use getPrefixSymbol from diffRendering.ts instead
   */
  static getDiffSymbol(type: DiffType): string {
    return getPrefixSymbol(type as any)
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
