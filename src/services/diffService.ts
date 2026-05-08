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
      const heuristicLines = this.applyIndentHeuristic(result.lines);
      const heuristicStats = this.calculateStats(heuristicLines);
      result = { ...result, lines: heuristicLines, stats: heuristicStats };
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

  // ── Indent Heuristic ──────────────────────────────────────────────────────

  /**
   * Entry point: apply indent heuristic to a DiffLine array.
   * Step 1 – fix jsdiff boundary noise (common prefix of removed+added blocks)
   * Step 2 – git-style indent sliding (prefer lower-indent split points)
   * Step 3 – reassign sequential line numbers
   */
  private static applyIndentHeuristic(lines: DiffLine[]): DiffLine[] {
    const step1 = this.fixBoundaryNoise(lines);
    const step2 = this.slideRemovedBlocks(step1);
    return this.reassignLineNumbers(step2);
  }

  /**
   * Fix jsdiff boundary noise: when a removed block is immediately followed by
   * an added block, and their leading lines share the same content, those shared
   * lines should be unchanged (not removed+added).
   */
  private static fixBoundaryNoise(lines: DiffLine[]): DiffLine[] {
    const result: DiffLine[] = [];
    let i = 0;

    while (i < lines.length) {
      if (lines[i].type !== 'removed') {
        result.push(lines[i++]);
        continue;
      }

      const removedBlock: DiffLine[] = [];
      while (i < lines.length && lines[i].type === 'removed') removedBlock.push(lines[i++]);

      const addedBlock: DiffLine[] = [];
      while (i < lines.length && lines[i].type === 'added') addedBlock.push(lines[i++]);

      // Count common prefix lines (same content in both blocks)
      let k = 0;
      const minLen = Math.min(removedBlock.length, addedBlock.length);
      while (k < minLen && removedBlock[k].content === addedBlock[k].content) k++;

      // Convert prefix to unchanged (orig from removed side, new from added side)
      for (let j = 0; j < k; j++) {
        result.push({
          ...removedBlock[j],
          type: 'unchanged',
          newLineNumber: addedBlock[j].newLineNumber,
        });
      }
      for (let j = k; j < removedBlock.length; j++) result.push(removedBlock[j]);
      for (let j = k; j < addedBlock.length; j++) result.push(addedBlock[j]);
    }

    return result;
  }

  /**
   * Git-style indent sliding for removed blocks.
   * For each removed block, slide to the position where pre-context + post-context
   * indentation is minimised (most natural split point in the code).
   */
  private static slideRemovedBlocks(lines: DiffLine[]): DiffLine[] {
    const result = lines.map(l => ({ ...l }));
    const len = result.length;
    let i = 0;

    while (i < len) {
      if (result[i].type !== 'removed') { i++; continue; }

      const blockStart = i;
      while (i < len && result[i].type === 'removed') i++;
      const blockEnd = i;

      // Skip blocks immediately followed by added (fixBoundaryNoise handles those)
      if (i < len && result[i].type === 'added') continue;

      // Slide backward as far as the content matches preceding unchanged lines
      let start = blockStart;
      let end = blockEnd;
      while (
        start > 0 &&
        result[start - 1].type === 'unchanged' &&
        result[start - 1].content === result[end - 1].content
      ) { start--; end--; }

      // Scan forward from backward-most position to find minimum indent score
      let bestStart = start;
      let bestScore = this.indentScore(result, start, end, len);
      let s = start;
      let e = end;

      while (
        e < len &&
        result[e].type === 'unchanged' &&
        result[s].content === result[e].content
      ) {
        s++; e++;
        const score = this.indentScore(result, s, e, len);
        if (score < bestScore) { bestScore = score; bestStart = s; }
      }

      if (bestStart !== blockStart) {
        this.applySlide(result, blockStart, blockEnd, bestStart);
      }
    }

    return result;
  }

  /** pre-indent + post-indent score for a removed block at [start, end). */
  private static indentScore(lines: DiffLine[], start: number, end: number, len: number): number {
    const pre  = start > 0   ? this.lineIndent(lines[start - 1].content) : 0;
    const post = end   < len ? this.lineIndent(lines[end].content)       : 0;
    return pre + post;
  }

  /** Count leading whitespace characters (tabs treated as 4 spaces). */
  private static lineIndent(content: string): number {
    let n = 0;
    for (const ch of content) {
      if (ch === ' ')  n++;
      else if (ch === '\t') n += 4;
      else break;
    }
    return n;
  }

  /**
   * Physically apply the slide: swap types between the original Myers position
   * [fromStart, fromEnd) and the new best position starting at toStart.
   * toStart can be < fromStart (backward) or > fromStart (forward).
   * Line numbers are reassigned afterwards by reassignLineNumbers,
   * so only the type field needs updating here.
   */
  private static applySlide(
    lines: DiffLine[],
    fromStart: number,
    fromEnd: number,
    toStart: number,
  ): void {
    const blockSize = fromEnd - fromStart;
    const toEnd = toStart + blockSize;

    if (toStart < fromStart) {
      // Backward slide: [toStart, fromStart) unchanged→removed; [toEnd, fromEnd) removed→unchanged
      const shift = fromStart - toStart;
      for (let j = 0; j < shift; j++) {
        lines[toStart + j] = { ...lines[toStart + j], type: 'removed' };
        lines[toEnd   + j] = { ...lines[toEnd   + j], type: 'unchanged' };
      }
    } else {
      // Forward slide: [fromEnd, toEnd) unchanged→removed; [fromStart, toStart) removed→unchanged
      const shift = toStart - fromStart;
      for (let j = 0; j < shift; j++) {
        lines[fromEnd   + j] = { ...lines[fromEnd   + j], type: 'removed' };
        lines[fromStart + j] = { ...lines[fromStart + j], type: 'unchanged' };
      }
    }
  }

  /**
   * Reassign originalLineNumber, newLineNumber, and lineNumber after heuristic
   * transformations may have changed which lines are removed/unchanged/added.
   */
  private static reassignLineNumbers(lines: DiffLine[]): DiffLine[] {
    let origNum = 1;
    let newNum  = 1;
    let globalNum = 1;

    return lines.map(l => {
      let originalLineNumber: number | undefined;
      let newLineNumber: number | undefined;

      switch (l.type) {
        case 'unchanged':
          originalLineNumber = origNum++;
          newLineNumber      = newNum++;
          break;
        case 'removed':
          originalLineNumber = origNum++;
          newLineNumber      = undefined;
          break;
        case 'added':
          originalLineNumber = undefined;
          newLineNumber      = newNum++;
          break;
        case 'modified':
          originalLineNumber = origNum++;
          newLineNumber      = newNum++;
          break;
      }

      return { ...l, lineNumber: globalNum++, originalLineNumber, newLineNumber };
    });
  }

  // ── End Indent Heuristic ─────────────────────────────────────────────────

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
