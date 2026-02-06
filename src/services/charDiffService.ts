import type { CharSegment } from '../types/types'

interface CharEdit {
  op: 'add' | 'delete' | 'equal'
  char: string
}

/**
 * Character-level diff service for inline highlighting
 * Uses Myers algorithm at character granularity
 */
export class CharDiffService {
  /**
   * Calculate character-level differences between two strings
   * @param original - Original line content
   * @param modified - Modified line content
   * @returns Object with segments for both original and modified views
   */
  static calculateCharDiff(
    original: string,
    modified: string
  ): { originalSegments: CharSegment[]; modifiedSegments: CharSegment[] } {
    if (original === modified) {
      return {
        originalSegments: [{ text: original, type: 'unchanged' }],
        modifiedSegments: [{ text: modified, type: 'unchanged' }]
      }
    }

    const edits = this.computeCharDiff(original.split(''), modified.split(''))
    return this.createSegments(edits)
  }

  /**
   * Myers diff algorithm at character level
   */
  private static computeCharDiff(a: string[], b: string[]): CharEdit[] {
    const m = a.length
    const n = b.length
    const max = m + n

    if (max === 0) return []

    const v: number[] = new Array(2 * max + 1).fill(0)
    const trace: number[][] = []

    for (let d = 0; d <= max; d++) {
      trace.push([...v])

      for (let k = -d; k <= d; k += 2) {
        let x: number

        if (k === -d || (k !== d && v[max + k - 1] < v[max + k + 1])) {
          x = v[max + k + 1]
        } else {
          x = v[max + k - 1] + 1
        }

        let y = x - k

        while (x < m && y < n && a[x] === b[y]) {
          x++
          y++
        }

        v[max + k] = x

        if (x >= m && y >= n) {
          return this.backtrack(a, b, trace, d, max)
        }
      }
    }

    return []
  }

  /**
   * Backtrack to generate edit operations
   */
  private static backtrack(
    a: string[],
    b: string[],
    trace: number[][],
    d: number,
    max: number
  ): CharEdit[] {
    const edits: CharEdit[] = []
    let x = a.length
    let y = b.length

    for (let depth = d; depth >= 0; depth--) {
      const v = trace[depth]
      const k = x - y

      let prevK: number
      if (k === -depth || (k !== depth && v[max + k - 1] < v[max + k + 1])) {
        prevK = k + 1
      } else {
        prevK = k - 1
      }

      const prevX = v[max + prevK]
      const prevY = prevX - prevK

      while (x > prevX && y > prevY) {
        edits.unshift({ op: 'equal', char: a[x - 1] })
        x--
        y--
      }

      if (depth > 0) {
        if (x > prevX) {
          edits.unshift({ op: 'delete', char: a[x - 1] })
          x--
        } else if (y > prevY) {
          edits.unshift({ op: 'add', char: b[y - 1] })
          y--
        }
      }
    }

    return edits
  }

  /**
   * Convert edit operations to character segments for display
   * Returns separate segments for original and modified views
   */
  private static createSegments(edits: CharEdit[]): {
    originalSegments: CharSegment[]
    modifiedSegments: CharSegment[]
  } {
    const originalSegments: CharSegment[] = []
    const modifiedSegments: CharSegment[] = []

    let currentOriginalText = ''
    let currentOriginalType: CharSegment['type'] | null = null
    let currentModifiedText = ''
    let currentModifiedType: CharSegment['type'] | null = null

    const flushOriginal = () => {
      if (currentOriginalText && currentOriginalType) {
        originalSegments.push({ text: currentOriginalText, type: currentOriginalType })
        currentOriginalText = ''
        currentOriginalType = null
      }
    }

    const flushModified = () => {
      if (currentModifiedText && currentModifiedType) {
        modifiedSegments.push({ text: currentModifiedText, type: currentModifiedType })
        currentModifiedText = ''
        currentModifiedType = null
      }
    }

    for (const edit of edits) {
      switch (edit.op) {
        case 'equal':
          // Unchanged characters go to both
          if (currentOriginalType !== 'unchanged') {
            flushOriginal()
            currentOriginalType = 'unchanged'
          }
          if (currentModifiedType !== 'unchanged') {
            flushModified()
            currentModifiedType = 'unchanged'
          }
          currentOriginalText += edit.char
          currentModifiedText += edit.char
          break

        case 'delete':
          // Deleted characters only in original (shown as removed)
          if (currentOriginalType !== 'removed') {
            flushOriginal()
            currentOriginalType = 'removed'
          }
          currentOriginalText += edit.char
          break

        case 'add':
          // Added characters only in modified (shown as added)
          if (currentModifiedType !== 'added') {
            flushModified()
            currentModifiedType = 'added'
          }
          currentModifiedText += edit.char
          break
      }
    }

    flushOriginal()
    flushModified()

    return { originalSegments, modifiedSegments }
  }

  /**
   * Check if two lines are similar enough to warrant character-level diff
   * @param original - Original line
   * @param modified - Modified line
   * @param threshold - Similarity threshold (0-1), default 0.3
   */
  static shouldShowCharDiff(
    original: string,
    modified: string,
    threshold: number = 0.3
  ): boolean {
    if (!original || !modified) return false
    if (original === modified) return false

    // Calculate simple similarity based on common characters
    const originalChars = new Set(original.split(''))
    const modifiedChars = new Set(modified.split(''))

    let common = 0
    for (const char of originalChars) {
      if (modifiedChars.has(char)) common++
    }

    const similarity = common / Math.max(originalChars.size, modifiedChars.size)
    return similarity >= threshold
  }
}
