import type { DiffResult, DiffLine, DiffStats, DiffType, ComparisonOptions } from '../types/types'
import { TextPreprocessor } from '../utils/textPreprocessor'
import { CharDiffService } from './charDiffService'
import { diffLines, type Change } from 'diff'

interface Edit {
  op: 'add' | 'delete' | 'equal'
  text: string
}

/** Diff algorithm type */
export type DiffAlgorithm = 'builtin' | 'jsdiff';

/** Extended options with algorithm selection */
export interface DiffCalculationOptions extends ComparisonOptions {
  algorithm?: DiffAlgorithm;
}

export class DiffService {
  /** Current algorithm (can be changed at runtime) */
  private static currentAlgorithm: DiffAlgorithm = 'jsdiff';

  /**
   * Set the default diff algorithm
   */
  static setAlgorithm(algorithm: DiffAlgorithm): void {
    this.currentAlgorithm = algorithm;
  }

  /**
   * Get the current diff algorithm
   */
  static getAlgorithm(): DiffAlgorithm {
    return this.currentAlgorithm;
  }

  /**
   * 差分を計算（アルゴリズム切り替え可能）
   * @param original - Original text
   * @param modified - Modified text
   * @param options - Optional comparison options (including algorithm selection)
   */
  static calculateDiff(
    original: string,
    modified: string,
    options?: DiffCalculationOptions
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

    // Select algorithm
    const algorithm = options?.algorithm ?? this.currentAlgorithm;

    let result = algorithm === 'jsdiff'
      ? this.calculateDiffWithJsDiff(processedOriginal, processedModified)
      : this.calculateDiffWithBuiltin(processedOriginal, processedModified);

    if (options?.indentHeuristic) {
      const slidedLines = this.applyIndentHeuristic(result.lines);
      result = { ...result, lines: slidedLines, stats: this.calculateStats(slidedLines) };
    }

    if (options?.enableCharDiff) {
      const adjustedStats = this.adjustStatsForCharDiff(result.lines, result.stats);
      return { ...result, stats: adjustedStats };
    }

    return result;
  }

  /**
   * jsdiff ライブラリを使用した差分計算
   */
  private static calculateDiffWithJsDiff(original: string, modified: string): DiffResult {
    const changes: Change[] = diffLines(original, modified);
    const lines = this.convertJsDiffToLines(changes);
    const stats = this.calculateStats(lines);
    return { lines, stats };
  }

  /**
   * jsdiff の出力を DiffLine[] に変換
   */
  private static convertJsDiffToLines(changes: Change[]): DiffLine[] {
    const lines: DiffLine[] = [];
    let originalLineNum = 1;
    let modifiedLineNum = 1;
    let globalLineNum = 1;

    for (const change of changes) {
      // Split by newline, handling trailing newline
      const content = change.value;
      const lineTexts = content.split('\n');

      // Remove last empty element if content ends with newline
      if (lineTexts[lineTexts.length - 1] === '') {
        lineTexts.pop();
      }

      for (const text of lineTexts) {
        let type: DiffType;
        let originalNum: number | undefined;
        let modifiedNum: number | undefined;

        if (change.added) {
          type = 'added';
          originalNum = undefined;
          modifiedNum = modifiedLineNum++;
        } else if (change.removed) {
          type = 'removed';
          originalNum = originalLineNum++;
          modifiedNum = undefined;
        } else {
          type = 'unchanged';
          originalNum = originalLineNum++;
          modifiedNum = modifiedLineNum++;
        }

        lines.push({
          lineNumber: globalLineNum++,
          content: text,
          type,
          originalLineNumber: originalNum,
          newLineNumber: modifiedNum
        });
      }
    }

    return lines;
  }

  /**
   * 自前のMyers差分アルゴリズムを使用した差分計算
   */
  private static calculateDiffWithBuiltin(original: string, modified: string): DiffResult {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');

    const edits = this.computeMyersDiff(originalLines, modifiedLines);
    const lines = this.createDiffLines(edits);
    const stats = this.calculateStats(lines);

    return { lines, stats };
  }

  /**
   * Myers差分アルゴリズムの実装（自前実装）
   */
  private static computeMyersDiff(a: string[], b: string[]): Edit[] {
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
   * Adjust stats to count char-diff pairs as `modified` instead of separate removed+added.
   * Scans consecutive change blocks (removed→added or added→removed) and uses positional
   * pairing to detect which pairs qualify for char-level diff.
   * Note: uses positional pairing as an approximation; the rendering layer may pair lines
   * differently via content-similarity matching.
   */
  private static adjustStatsForCharDiff(lines: DiffLine[], stats: DiffStats): DiffStats {
    let modifiedCount = 0;
    let i = 0;

    while (i < lines.length) {
      const type = lines[i].type;
      if (type !== 'removed' && type !== 'added') {
        i++;
        continue;
      }

      // Collect the first run (removed or added)
      const firstType = type;
      const secondType = firstType === 'removed' ? 'added' : 'removed';

      const firstStart = i;
      while (i < lines.length && lines[i].type === firstType) i++;
      const firstBlock = lines.slice(firstStart, i);

      const secondStart = i;
      while (i < lines.length && lines[i].type === secondType) i++;
      const secondBlock = lines.slice(secondStart, i);

      // Normalize to removed/added order for the similarity check
      const removedBlock = firstType === 'removed' ? firstBlock : secondBlock;
      const addedBlock = firstType === 'removed' ? secondBlock : firstBlock;

      const minLen = Math.min(removedBlock.length, addedBlock.length);
      for (let j = 0; j < minLen; j++) {
        if (CharDiffService.shouldShowCharDiff(removedBlock[j].content, addedBlock[j].content)) {
          modifiedCount++;
        }
      }
    }

    return {
      ...stats,
      removed: stats.removed - modifiedCount,
      added: stats.added - modifiedCount,
      modified: modifiedCount,
    };
  }

  /**
   * Count leading whitespace (tabs = 4 spaces) for indent scoring
   */
  private static getIndentLevel(line: string): number {
    let indent = 0;
    for (const ch of line) {
      if (ch === ' ') indent++;
      else if (ch === '\t') indent += 4;
      else break;
    }
    return indent;
  }

  /**
   * Slide each removed/added block to the position with the lowest boundary indentation.
   * This is a post-processing step compatible with git's --indent-heuristic.
   */
  static applyIndentHeuristic(lines: DiffLine[]): DiffLine[] {
    type SlimLine = { content: string; type: DiffType };
    const result: SlimLine[] = lines.map(l => ({ content: l.content, type: l.type }));

    let i = 0;
    while (i < result.length) {
      if (result[i].type !== 'removed' && result[i].type !== 'added') {
        i++;
        continue;
      }

      const blockType = result[i].type as 'removed' | 'added';
      const blockStart = i;
      while (i < result.length && result[i].type === blockType) i++;
      const blockEnd = i;

      // How far the block can slide down: result[blockEnd+k].content must equal result[blockStart+k].content
      let maxDown = 0;
      while (
        blockEnd + maxDown < result.length &&
        result[blockEnd + maxDown].type === 'unchanged' &&
        result[blockEnd + maxDown].content === result[blockStart + maxDown].content
      ) maxDown++;

      // How far the block can slide up: result[blockStart-k-1].content must equal result[blockEnd-k-1].content
      let maxUp = 0;
      while (
        blockStart - maxUp - 1 >= 0 &&
        result[blockStart - maxUp - 1].type === 'unchanged' &&
        result[blockStart - maxUp - 1].content === result[blockEnd - maxUp - 1].content
      ) maxUp++;

      if (maxDown === 0 && maxUp === 0) continue;

      // Score each candidate slide position; prefer the one with lowest boundary indentation.
      // At slide k: block occupies [blockStart+k, blockEnd+k). Boundary lines are at indices
      // blockStart+k-1 (before) and blockEnd+k (after), both accessible in the original array
      // because sliding only rearranges lines whose content matches the block.
      let bestScore = Infinity;
      let bestSlide = 0;

      for (let slide = -maxUp; slide <= maxDown; slide++) {
        const beforeIdx = blockStart + slide - 1;
        const afterIdx = blockEnd + slide;
        const beforeIndent = beforeIdx >= 0 ? this.getIndentLevel(result[beforeIdx].content) : 0;
        const afterIndent = afterIdx < result.length ? this.getIndentLevel(result[afterIdx].content) : 0;
        const score = beforeIndent + afterIndent;
        if (score < bestScore) {
          bestScore = score;
          bestSlide = slide;
        }
      }

      if (bestSlide > 0) {
        for (let j = 0; j < bestSlide; j++) {
          result[blockStart + j].type = 'unchanged';
          result[blockEnd + j].type = blockType;
        }
      } else if (bestSlide < 0) {
        for (let j = 0; j < -bestSlide; j++) {
          result[blockStart - j - 1].type = blockType;
          result[blockEnd - j - 1].type = 'unchanged';
        }
      }
    }

    // Rebuild DiffLine[] with correct sequential line numbers
    const rebuilt: DiffLine[] = [];
    let origNum = 1;
    let modNum = 1;
    let globalNum = 1;

    for (const line of result) {
      let origLineNum: number | undefined;
      let modLineNum: number | undefined;

      if (line.type === 'unchanged') {
        origLineNum = origNum++;
        modLineNum = modNum++;
      } else if (line.type === 'removed') {
        origLineNum = origNum++;
      } else if (line.type === 'added') {
        modLineNum = modNum++;
      } else {
        origLineNum = origNum++;
        modLineNum = modNum++;
      }

      rebuilt.push({
        lineNumber: globalNum++,
        content: line.content,
        type: line.type,
        originalLineNumber: origLineNum,
        newLineNumber: modLineNum,
      });
    }

    return rebuilt;
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
