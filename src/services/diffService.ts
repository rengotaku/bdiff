import type { DiffResult, DiffLine, DiffStats, DiffType, ComparisonOptions } from '../types/types'
import { TextPreprocessor } from '../utils/textPreprocessor'

interface Edit {
  op: 'add' | 'delete' | 'equal'
  text: string
}

export class DiffService {
  /**
   * Myers差分アルゴリズムを使用してテキストの差分を計算
   * @param original - Original text
   * @param modified - Modified text
   * @param options - Optional comparison options
   */
  static calculateDiff(
    original: string, 
    modified: string, 
    options?: ComparisonOptions
  ): DiffResult {
    // Apply preprocessing if options are provided
    let processedOriginal = original;
    let processedModified = modified;
    
    if (options && TextPreprocessor.hasActiveOptions(options)) {
      [processedOriginal, processedModified] = TextPreprocessor.preprocessTexts(
        original,
        modified,
        options
      );
    }
    
    const originalLines = processedOriginal.split('\n')
    const modifiedLines = processedModified.split('\n')
    
    const edits = this.computeDiff(originalLines, modifiedLines)
    const lines = this.createDiffLines(edits)
    const stats = this.calculateStats(lines)
    
    return { lines, stats }
  }

  /**
   * Myers差分アルゴリズムの実装
   */
  private static computeDiff(a: string[], b: string[]): Edit[] {
    const m = a.length
    const n = b.length
    const max = m + n
    
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
   * バックトラッキングして編集操作を生成
   */
  private static backtrack(a: string[], b: string[], trace: number[][], d: number, max: number): Edit[] {
    const edits: Edit[] = []
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
        edits.unshift({ op: 'equal', text: a[x - 1] })
        x--
        y--
      }
      
      if (depth > 0) {
        if (x > prevX) {
          edits.unshift({ op: 'delete', text: a[x - 1] })
          x--
        } else if (y > prevY) {
          edits.unshift({ op: 'add', text: b[y - 1] })
          y--
        }
      }
    }
    
    return edits
  }

  /**
   * 編集操作から差分行を作成
   */
  private static createDiffLines(edits: Edit[]): DiffLine[] {
    const lines: DiffLine[] = []
    let originalLineNum = 1
    let modifiedLineNum = 1
    let globalLineNum = 1

    for (const edit of edits) {
      let type: DiffType
      let originalNum: number | undefined
      let modifiedNum: number | undefined

      switch (edit.op) {
        case 'equal':
          type = 'unchanged'
          originalNum = originalLineNum++
          modifiedNum = modifiedLineNum++
          break
        case 'delete':
          type = 'removed'
          originalNum = originalLineNum++
          modifiedNum = undefined
          break
        case 'add':
          type = 'added'
          originalNum = undefined
          modifiedNum = modifiedLineNum++
          break
      }

      lines.push({
        lineNumber: globalLineNum++,
        content: edit.text,
        type,
        originalLineNumber: originalNum,
        newLineNumber: modifiedNum
      })
    }

    return lines
  }

  /**
   * 差分統計を計算
   */
  private static calculateStats(lines: DiffLine[]): DiffStats {
    const stats = {
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0,
      similarity: 0
    }

    for (const line of lines) {
      switch (line.type) {
        case 'added':
          stats.added++
          break
        case 'removed':
          stats.removed++
          break
        case 'modified':
          stats.modified++
          break
        case 'unchanged':
          stats.unchanged++
          break
      }
    }

    // 類似度を計算（変更されていない行の割合）
    const totalLines = lines.length
    if (totalLines > 0) {
      stats.similarity = Math.round((stats.unchanged / totalLines) * 100)
    }

    return stats
  }

  /**
   * 差分があるかどうかを判定
   */
  static hasDifferences(diffResult: DiffResult): boolean {
    const { stats } = diffResult
    return stats.added > 0 || stats.removed > 0 || stats.modified > 0
  }

  /**
   * 2つのテキストの類似度を計算
   */
  static calculateSimilarity(original: string, modified: string): number {
    if (original === modified) return 100
    if (!original && !modified) return 100
    if (!original || !modified) return 0

    const originalWords = original.toLowerCase().split(/\s+/)
    const modifiedWords = modified.toLowerCase().split(/\s+/)
    
    const commonWords = new Set()
    const allWords = new Set([...originalWords, ...modifiedWords])
    
    for (const word of originalWords) {
      if (modifiedWords.includes(word)) {
        commonWords.add(word)
      }
    }
    
    return Math.round((commonWords.size / allWords.size) * 100)
  }

  /**
   * 差分結果を視覚的に見やすく整形
   */
  static formatDiffForDisplay(lines: DiffLine[]): {
    original: DiffLine[]
    modified: DiffLine[]
  } {
    const original: DiffLine[] = []
    const modified: DiffLine[] = []

    for (const line of lines) {
      switch (line.type) {
        case 'unchanged':
          original.push(line)
          modified.push(line)
          break
        case 'removed':
          original.push(line)
          // 削除行には対応する修正行に空行を追加
          modified.push({
            ...line,
            content: '',
            type: 'unchanged' as DiffType,
            newLineNumber: undefined
          })
          break
        case 'added':
          // 追加行には対応する元行に空行を追加
          original.push({
            ...line,
            content: '',
            type: 'unchanged' as DiffType,
            originalLineNumber: undefined
          })
          modified.push(line)
          break
        case 'modified':
          original.push({ ...line, type: 'removed' as DiffType })
          modified.push({ ...line, type: 'added' as DiffType })
          break
      }
    }

    return { original, modified }
  }
}