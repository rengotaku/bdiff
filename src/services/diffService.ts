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
      const slidLines = this.applyIndentHeuristic(result.lines);
      result = { ...result, lines: slidLines };
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
   * Count leading whitespace characters (tab = 4 spaces).
   */
  private static getIndentLevel(content: string): number {
    let indent = 0;
    for (const ch of content) {
      if (ch === ' ') indent++;
      else if (ch === '\t') indent += 4;
      else break;
    }
    return indent;
  }

  /**
   * Score for placing a change block at `blockStart`.
   * Lower score = better: prefer positions after less-indented lines.
   */
  private static scorePosition(lines: DiffLine[], blockStart: number): number {
    if (blockStart > 0 && lines[blockStart - 1].type === 'unchanged') {
      return this.getIndentLevel(lines[blockStart - 1].content);
    }
    return 0;
  }

  /**
   * Try to slide a contiguous block of `type` lines within unchanged context.
   * Modifies `lines` in-place by swapping type between changed and unchanged lines.
   */
  private static slideBlock(
    lines: DiffLine[],
    blockStart: number,
    blockEnd: number,
    type: 'removed' | 'added'
  ): void {
    const blockLen = blockEnd - blockStart;

    let bestScore = this.scorePosition(lines, blockStart);
    let bestPos = blockStart;

    // Try sliding up: line before block must match last line of block
    let pos = blockStart;
    while (
      pos > 0 &&
      lines[pos - 1].type === 'unchanged' &&
      lines[pos - 1].content === lines[pos + blockLen - 1].content
    ) {
      pos--;
      const score = this.scorePosition(lines, pos);
      if (score < bestScore) {
        bestScore = score;
        bestPos = pos;
      }
    }

    // Try sliding down: line after block must match first line of block
    pos = blockStart;
    while (
      pos + blockLen < lines.length &&
      lines[pos + blockLen].type === 'unchanged' &&
      lines[pos + blockLen].content === lines[pos].content
    ) {
      pos++;
      const score = this.scorePosition(lines, pos);
      if (score < bestScore) {
        bestScore = score;
        bestPos = pos;
      }
    }

    if (bestPos === blockStart) return;

    if (bestPos < blockStart) {
      // Slide up by (blockStart - bestPos) positions
      const shift = blockStart - bestPos;
      for (let j = 0; j < shift; j++) {
        const unchangedIdx = blockStart - 1 - j;
        const changedIdx = blockEnd - 1 - j;
        lines[unchangedIdx] = { ...lines[unchangedIdx], type };
        lines[changedIdx] = { ...lines[changedIdx], type: 'unchanged' };
      }
    } else {
      // Slide down by (bestPos - blockStart) positions
      const shift = bestPos - blockStart;
      for (let j = 0; j < shift; j++) {
        const changedIdx = blockStart + j;
        const unchangedIdx = blockEnd + j;
        lines[changedIdx] = { ...lines[changedIdx], type: 'unchanged' };
        lines[unchangedIdx] = { ...lines[unchangedIdx], type };
      }
    }
  }

  /**
   * Recalculate sequential line numbers after a slide operation.
   */
  private static recalculateLineNumbers(lines: DiffLine[]): DiffLine[] {
    let origNum = 1;
    let newNum = 1;
    let globalNum = 1;
    return lines.map(line => {
      const updated = { ...line, lineNumber: globalNum++ };
      if (line.type === 'removed') {
        updated.originalLineNumber = origNum++;
        updated.newLineNumber = undefined;
      } else if (line.type === 'added') {
        updated.originalLineNumber = undefined;
        updated.newLineNumber = newNum++;
      } else {
        updated.originalLineNumber = origNum++;
        updated.newLineNumber = newNum++;
      }
      return updated;
    });
  }

  /**
   * Apply git-compatible indent heuristic as post-processing.
   * Slides removed and added blocks to positions with lower indent context
   * for improved readability (matches git diff --indent-heuristic behavior).
   */
  private static applyIndentHeuristic(lines: DiffLine[]): DiffLine[] {
    const result = lines.map(l => ({ ...l }));

    // Process removed blocks
    let i = 0;
    while (i < result.length) {
      if (result[i].type !== 'removed') { i++; continue; }
      const start = i;
      while (i < result.length && result[i].type === 'removed') i++;
      this.slideBlock(result, start, i, 'removed');
    }

    // Process added blocks
    i = 0;
    while (i < result.length) {
      if (result[i].type !== 'added') { i++; continue; }
      const start = i;
      while (i < result.length && result[i].type === 'added') i++;
      this.slideBlock(result, start, i, 'added');
    }

    return this.recalculateLineNumbers(result);
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
