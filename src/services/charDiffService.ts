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
   * Uses multiple heuristics to avoid false positives
   * @param original - Original line
   * @param modified - Modified line
   * @param threshold - Similarity threshold (0-1), default 0.6
   */
  static shouldShowCharDiff(
    original: string,
    modified: string,
    threshold: number = 0.6
  ): boolean {
    if (!original || !modified) return false
    if (original === modified) return false

    // Length check: if lengths differ too much, likely not a modified line
    const lenRatio = Math.min(original.length, modified.length) / Math.max(original.length, modified.length)
    if (lenRatio < 0.3) return false

    // Calculate LCS (Longest Common Subsequence) ratio for better accuracy
    const lcsLength = this.lcsLength(original, modified)
    const maxLen = Math.max(original.length, modified.length)
    const lcsRatio = lcsLength / maxLen

    return lcsRatio >= threshold
  }

  /**
   * Calculate the length of the Longest Common Subsequence
   * Uses optimized space O(min(m,n)) algorithm
   */
  private static lcsLength(a: string, b: string): number {
    // Ensure a is the shorter string for space optimization
    if (a.length > b.length) {
      [a, b] = [b, a]
    }

    const m = a.length
    const n = b.length

    // Use two rows instead of full matrix
    let prev = new Array(m + 1).fill(0)
    let curr = new Array(m + 1).fill(0)

    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= m; i++) {
        if (a[i - 1] === b[j - 1]) {
          curr[i] = prev[i - 1] + 1
        } else {
          curr[i] = Math.max(prev[i], curr[i - 1])
        }
      }
      [prev, curr] = [curr, prev]
    }

    return prev[m]
  }
}
