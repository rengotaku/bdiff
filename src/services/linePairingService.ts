import type { DiffLine, LineWithSegments, LinePair, SideBySideRow, CollapsedBlock, UnifiedRow, UnifiedCollapsedBlock } from '../types/types';
import { CharDiffService } from './charDiffService';

/** Matching algorithm type */
export type MatchingAlgorithm = 'greedy' | 'recursive';

/**
 * Service for pairing removed/added lines in diff views
 * Extracts common pairing logic used by both screen display and HTML export
 */
export class LinePairingService {
  /** Current matching algorithm (can be changed at runtime) */
  private static currentAlgorithm: MatchingAlgorithm = 'greedy';

  /** Similarity threshold for matching (0-1) */
  private static similarityThreshold = 0.5;

  /**
   * Set the matching algorithm
   */
  static setAlgorithm(algorithm: MatchingAlgorithm): void {
    this.currentAlgorithm = algorithm;
  }

  /**
   * Get the current matching algorithm
   */
  static getAlgorithm(): MatchingAlgorithm {
    return this.currentAlgorithm;
  }

  /**
   * Set the similarity threshold for matching
   */
  static setSimilarityThreshold(threshold: number): void {
    this.similarityThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Get the current similarity threshold
   */
  static getSimilarityThreshold(): number {
    return this.similarityThreshold;
  }
  /**
   * Calculate similarity between two strings (0-1 scale)
   * Uses Levenshtein distance normalized by max length
   */
  private static calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    // Simple Levenshtein distance
    const matrix: number[][] = [];
    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    const distance = matrix[a.length][b.length];
    const maxLen = Math.max(a.length, b.length);
    return 1 - distance / maxLen;
  }

  /**
   * Match removed and added lines by content similarity (Greedy algorithm)
   * Returns optimal pairings where similar content is aligned
   */
  private static matchByContentGreedy(
    removedLines: DiffLine[],
    addedLines: DiffLine[]
  ): { removedIdx: number; addedIdx: number }[] {
    if (removedLines.length === 0 || addedLines.length === 0) {
      return [];
    }

    // Calculate similarity matrix
    const scores: { removedIdx: number; addedIdx: number; score: number }[] = [];
    for (let i = 0; i < removedLines.length; i++) {
      for (let j = 0; j < addedLines.length; j++) {
        const score = this.calculateSimilarity(
          removedLines[i].content,
          addedLines[j].content
        );
        if (score >= this.similarityThreshold) {
          scores.push({ removedIdx: i, addedIdx: j, score });
        }
      }
    }

    // Sort by score descending (best matches first)
    scores.sort((a, b) => b.score - a.score);

    // Greedily assign best matches
    const usedRemoved = new Set<number>();
    const usedAdded = new Set<number>();
    const matches: { removedIdx: number; addedIdx: number }[] = [];

    for (const { removedIdx, addedIdx } of scores) {
      if (!usedRemoved.has(removedIdx) && !usedAdded.has(addedIdx)) {
        matches.push({ removedIdx, addedIdx });
        usedRemoved.add(removedIdx);
        usedAdded.add(addedIdx);
      }
    }

    return matches;
  }

  /**
   * Match removed and added lines by content similarity (Recursive algorithm - diff2html style)
   * Uses divide-and-conquer approach for better order preservation
   */
  private static matchByContentRecursive(
    removedLines: DiffLine[],
    addedLines: DiffLine[],
    removedOffset: number = 0,
    addedOffset: number = 0
  ): { removedIdx: number; addedIdx: number }[] {
    // Base case: no lines to match
    if (removedLines.length === 0 || addedLines.length === 0) {
      return [];
    }

    // Base case: combined length < 3, return as-is (diff2html behavior)
    if (removedLines.length + addedLines.length < 3) {
      // Try to match the single pair if similar enough
      if (removedLines.length === 1 && addedLines.length === 1) {
        const score = this.calculateSimilarity(
          removedLines[0].content,
          addedLines[0].content
        );
        if (score >= this.similarityThreshold) {
          return [{ removedIdx: removedOffset, addedIdx: addedOffset }];
        }
      }
      return [];
    }

    // Find the best matching pair
    let bestScore = this.similarityThreshold;
    let bestI = -1;
    let bestJ = -1;

    for (let i = 0; i < removedLines.length; i++) {
      for (let j = 0; j < addedLines.length; j++) {
        const score = this.calculateSimilarity(
          removedLines[i].content,
          addedLines[j].content
        );
        if (score > bestScore) {
          bestScore = score;
          bestI = i;
          bestJ = j;
        }
      }
    }

    // No match found above threshold
    if (bestI === -1) {
      return [];
    }

    // Recursively match before the best match
    const beforeMatches = this.matchByContentRecursive(
      removedLines.slice(0, bestI),
      addedLines.slice(0, bestJ),
      removedOffset,
      addedOffset
    );

    // The best match itself
    const currentMatch = {
      removedIdx: removedOffset + bestI,
      addedIdx: addedOffset + bestJ
    };

    // Recursively match after the best match
    const afterMatches = this.matchByContentRecursive(
      removedLines.slice(bestI + 1),
      addedLines.slice(bestJ + 1),
      removedOffset + bestI + 1,
      addedOffset + bestJ + 1
    );

    return [...beforeMatches, currentMatch, ...afterMatches];
  }

  /**
   * Match removed and added lines using the selected algorithm
   */
  private static matchByContent(
    removedLines: DiffLine[],
    addedLines: DiffLine[]
  ): { removedIdx: number; addedIdx: number }[] {
    if (this.currentAlgorithm === 'recursive') {
      return this.matchByContentRecursive(removedLines, addedLines);
    }
    return this.matchByContentGreedy(removedLines, addedLines);
  }
  /**
   * Unified view pairing - finds removed/added blocks and pairs by position
   *
   * Algorithm:
   * 1. Iterate through lines sequentially
   * 2. When a removed line is found, collect all consecutive removed lines
   * 3. Collect all consecutive added lines that follow
   * 4. Match removed[i] with added[i] by position index
   * 5. Compute character diff if enabled and lines are similar enough
   *
   * @param lines - All diff lines
   * @param enableCharDiff - Whether to compute character-level diff
   * @returns Lines with optional character segments
   */
  static pairForUnifiedView(
    lines: DiffLine[],
    enableCharDiff: boolean
  ): LineWithSegments[] {
    if (lines.length === 0) {
      return [];
    }

    // Find blocks of removed lines followed by added lines and compute char diffs
    const result: LineWithSegments[] = [];
    let i = 0;

    while (i < lines.length) {
      const currentLine = lines[i];

      // Look for a block of removed lines
      if (currentLine.type === 'removed') {
        // Collect all consecutive removed lines
        const removedLines: DiffLine[] = [];
        while (i < lines.length && lines[i].type === 'removed') {
          removedLines.push(lines[i]);
          i++;
        }

        // Collect all consecutive added lines that follow
        const addedLines: DiffLine[] = [];
        while (i < lines.length && lines[i].type === 'added') {
          addedLines.push(lines[i]);
          i++;
        }

        // Match removed and added lines by position
        const maxPairs = Math.max(removedLines.length, addedLines.length);
        for (let j = 0; j < maxPairs; j++) {
          const removedLine = removedLines[j];
          const addedLine = addedLines[j];

          if (enableCharDiff && removedLine && addedLine &&
              CharDiffService.shouldShowCharDiff(removedLine.content, addedLine.content)) {
            // Compute character-level diff for this pair
            const { originalSegments, modifiedSegments } = CharDiffService.calculateCharDiff(
              removedLine.content,
              addedLine.content
            );
            result.push({ line: removedLine, segments: originalSegments });
            result.push({ line: addedLine, segments: modifiedSegments });
          } else {
            // No match or not similar enough - add without segments
            if (removedLine) {
              result.push({ line: removedLine });
            }
            if (addedLine) {
              result.push({ line: addedLine });
            }
          }
        }
        continue;
      }

      // Not a removed line, just add it
      result.push({ line: currentLine });
      i++;
    }

    return result;
  }

  /**
   * Side-by-side view pairing - separates into original/modified columns
   *
   * Algorithm:
   * 1. Filter lines: original = unchanged + removed, modified = unchanged + added
   * 2. Match removed[i] with added[i] by position index across columns
   * 3. Compute character diff if enabled and paired lines are similar
   *
   * @param lines - All diff lines
   * @param enableCharDiff - Whether to compute character-level diff
   * @returns Separated lines for each column
   */
  static pairForSideBySideView(
    lines: DiffLine[],
    enableCharDiff: boolean
  ): {
    original: LineWithSegments[];
    modified: LineWithSegments[];
  } {
    // Filter lines for each side
    const originalLines = lines.filter(l => l.type !== 'added');
    const modifiedLines = lines.filter(l => l.type !== 'removed');

    if (!enableCharDiff) {
      return {
        original: originalLines.map(line => ({ line })),
        modified: modifiedLines.map(line => ({ line }))
      };
    }

    // Compute character-level diffs for paired removed/added lines
    const originalWithSegments: LineWithSegments[] = [];
    const modifiedWithSegments: LineWithSegments[] = [];

    const maxLen = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLen; i++) {
      const origLine = originalLines[i];
      const modLine = modifiedLines[i];

      if (origLine && modLine &&
          origLine.type === 'removed' && modLine.type === 'added' &&
          CharDiffService.shouldShowCharDiff(origLine.content, modLine.content)) {
        // Compute character-level diff for this pair
        const { originalSegments, modifiedSegments } = CharDiffService.calculateCharDiff(
          origLine.content,
          modLine.content
        );
        originalWithSegments.push({ line: origLine, segments: originalSegments });
        modifiedWithSegments.push({ line: modLine, segments: modifiedSegments });
      } else {
        // No character diff - just pass the line
        if (origLine) {
          originalWithSegments.push({ line: origLine });
        }
        if (modLine) {
          modifiedWithSegments.push({ line: modLine });
        }
      }
    }

    return {
      original: originalWithSegments,
      modified: modifiedWithSegments
    };
  }

  /**
   * Side-by-side view pairing that returns aligned line pairs
   * Each pair contains original and modified lines that should be displayed
   * on the same row, enabling proper height synchronization.
   *
   * Algorithm:
   * 1. Process lines sequentially
   * 2. When encountering consecutive removed lines followed by consecutive added lines,
   *    treat them as a "change block" and match by content within the block
   * 3. Unchanged lines are shown on both sides
   * 4. Isolated removed/added lines (not in a block) are shown without matching
   *
   * @param lines - All diff lines
   * @param enableCharDiff - Whether to compute character-level diff
   * @returns Array of line pairs for synchronized side-by-side display
   */
  static pairLinesForSideBySide(
    lines: DiffLine[],
    enableCharDiff: boolean
  ): LinePair[] {
    if (lines.length === 0) {
      return [];
    }

    const pairs: LinePair[] = [];
    let i = 0;

    while (i < lines.length) {
      const currentLine = lines[i];

      // Handle unchanged lines
      if (currentLine.type === 'unchanged') {
        pairs.push({
          original: { line: currentLine },
          modified: { line: currentLine }
        });
        i++;
        continue;
      }

      // Handle change block: collect consecutive removed, then consecutive added
      if (currentLine.type === 'removed') {
        const removedLines: DiffLine[] = [];
        while (i < lines.length && lines[i].type === 'removed') {
          removedLines.push(lines[i]);
          i++;
        }

        const addedLines: DiffLine[] = [];
        while (i < lines.length && lines[i].type === 'added') {
          addedLines.push(lines[i]);
          i++;
        }

        // Match within this block using content similarity
        const blockPairs = this.matchBlockLines(removedLines, addedLines, enableCharDiff);
        pairs.push(...blockPairs);
        continue;
      }

      // Handle change block: collect consecutive added, then consecutive removed
      // This handles cases where jsdiff outputs added lines before removed lines
      if (currentLine.type === 'added') {
        const addedLines: DiffLine[] = [];
        while (i < lines.length && lines[i].type === 'added') {
          addedLines.push(lines[i]);
          i++;
        }

        const removedLines: DiffLine[] = [];
        while (i < lines.length && lines[i].type === 'removed') {
          removedLines.push(lines[i]);
          i++;
        }

        // Match within this block using content similarity
        const blockPairs = this.matchBlockLines(removedLines, addedLines, enableCharDiff);
        pairs.push(...blockPairs);
        continue;
      }

      i++;
    }

    // Second pass: try to match remaining unmatched lines globally
    return this.rematchUnpairedLines(pairs, enableCharDiff);
  }

  /**
   * Second pass: find unmatched removed/added lines and try to match them globally
   * This handles cases where similar lines are separated by unchanged lines
   */
  private static rematchUnpairedLines(
    pairs: LinePair[],
    enableCharDiff: boolean
  ): LinePair[] {
    // Find indices of unmatched lines
    const unmatchedRemovedIndices: number[] = [];
    const unmatchedAddedIndices: number[] = [];

    pairs.forEach((pair, index) => {
      if (pair.original && !pair.modified && pair.original.line.type === 'removed') {
        unmatchedRemovedIndices.push(index);
      }
      if (pair.modified && !pair.original && pair.modified.line.type === 'added') {
        unmatchedAddedIndices.push(index);
      }
    });

    // If no unmatched lines on both sides, nothing to do
    if (unmatchedRemovedIndices.length === 0 || unmatchedAddedIndices.length === 0) {
      return pairs;
    }

    // Try to find matches among unmatched lines
    const removedLines = unmatchedRemovedIndices.map(i => pairs[i].original!.line);
    const addedLines = unmatchedAddedIndices.map(i => pairs[i].modified!.line);

    const matches = this.matchByContent(removedLines, addedLines);

    if (matches.length === 0) {
      return pairs;
    }

    // Create new pairs array with matched lines combined
    const result = [...pairs];
    const indicesToRemove = new Set<number>();

    for (const { removedIdx, addedIdx } of matches) {
      const removedPairIndex = unmatchedRemovedIndices[removedIdx];
      const addedPairIndex = unmatchedAddedIndices[addedIdx];

      const removedLine = pairs[removedPairIndex].original!.line;
      const addedLine = pairs[addedPairIndex].modified!.line;

      // Update the removed pair to include the matched added line
      if (enableCharDiff && CharDiffService.shouldShowCharDiff(removedLine.content, addedLine.content)) {
        const { originalSegments, modifiedSegments } = CharDiffService.calculateCharDiff(
          removedLine.content,
          addedLine.content
        );
        result[removedPairIndex] = {
          original: { line: removedLine, segments: originalSegments },
          modified: { line: addedLine, segments: modifiedSegments }
        };
      } else {
        result[removedPairIndex] = {
          original: { line: removedLine },
          modified: { line: addedLine }
        };
      }

      // Mark the added pair for removal
      indicesToRemove.add(addedPairIndex);
    }

    // Remove the now-redundant added pairs (in reverse order to maintain indices)
    const sortedIndicesToRemove = Array.from(indicesToRemove).sort((a, b) => b - a);
    for (const index of sortedIndicesToRemove) {
      result.splice(index, 1);
    }

    return result;
  }

  /**
   * Match removed and added lines within a change block
   * Uses content similarity for better alignment, with interleaving for unmatched lines
   */
  private static matchBlockLines(
    removedLines: DiffLine[],
    addedLines: DiffLine[],
    enableCharDiff: boolean
  ): LinePair[] {
    const pairs: LinePair[] = [];

    if (removedLines.length === 0 && addedLines.length === 0) {
      return pairs;
    }

    // If only removed or only added, no matching needed
    if (addedLines.length === 0) {
      for (const removed of removedLines) {
        pairs.push({ original: { line: removed }, modified: null });
      }
      return pairs;
    }

    if (removedLines.length === 0) {
      for (const added of addedLines) {
        pairs.push({ original: null, modified: { line: added } });
      }
      return pairs;
    }

    // Use content-based matching for reordering similar lines
    const matches = this.matchByContent(removedLines, addedLines);

    // Create index mappings for matched pairs
    const removedToAdded = new Map<number, number>();
    const addedToRemoved = new Map<number, number>();

    for (const { removedIdx, addedIdx } of matches) {
      removedToAdded.set(removedIdx, addedIdx);
      addedToRemoved.set(addedIdx, removedIdx);
    }

    // Track which lines have been output
    const usedAdded = new Set<number>();

    // Positional index for fallback pairing of unmatched lines
    let nextUnmatchedAddedIdx = 0;

    // Process removed lines in order
    for (let removedIdx = 0; removedIdx < removedLines.length; removedIdx++) {
      const removed = removedLines[removedIdx];

      // Check for content-similarity match first
      let added: DiffLine | undefined;
      if (removedToAdded.has(removedIdx)) {
        const addedIdx = removedToAdded.get(removedIdx)!;
        added = addedLines[addedIdx];
        usedAdded.add(addedIdx);
      } else {
        // Fallback: pair positionally with next unused added line
        while (nextUnmatchedAddedIdx < addedLines.length &&
               (usedAdded.has(nextUnmatchedAddedIdx) || addedToRemoved.has(nextUnmatchedAddedIdx))) {
          nextUnmatchedAddedIdx++;
        }
        if (nextUnmatchedAddedIdx < addedLines.length) {
          added = addedLines[nextUnmatchedAddedIdx];
          usedAdded.add(nextUnmatchedAddedIdx);
          nextUnmatchedAddedIdx++;
        }
      }

      if (added) {
        // Output matched pair with char diff if applicable
        if (enableCharDiff && CharDiffService.shouldShowCharDiff(removed.content, added.content)) {
          const { originalSegments, modifiedSegments } = CharDiffService.calculateCharDiff(
            removed.content,
            added.content
          );
          pairs.push({
            original: { line: removed, segments: originalSegments },
            modified: { line: added, segments: modifiedSegments }
          });
        } else {
          pairs.push({
            original: { line: removed },
            modified: { line: added }
          });
        }
      } else {
        // No added line available - output removed line alone
        pairs.push({ original: { line: removed }, modified: null });
      }
    }

    // Output remaining added lines that weren't paired
    for (let addedIdx = 0; addedIdx < addedLines.length; addedIdx++) {
      if (!usedAdded.has(addedIdx)) {
        pairs.push({ original: null, modified: { line: addedLines[addedIdx] } });
      }
    }

    return pairs;
  }

  /**
   * Apply context line filtering to collapse unchanged lines
   * Similar to GitHub's diff view that shows only N lines around changes
   *
   * @param pairs - Line pairs from pairLinesForSideBySide
   * @param contextLines - Number of context lines to show around changes (default: 3)
   * @returns Array of SideBySideRow (LinePair or CollapsedBlock)
   */
  static applyContextFilter(
    pairs: LinePair[],
    contextLines: number = 3
  ): SideBySideRow[] {
    if (pairs.length === 0 || contextLines < 0) {
      return pairs;
    }

    // Find indices of changed lines (non-unchanged)
    const changedIndices: number[] = [];
    pairs.forEach((pair, index) => {
      const isChanged =
        (pair.original && pair.original.line.type !== 'unchanged') ||
        (pair.modified && pair.modified.line.type !== 'unchanged') ||
        (pair.original === null || pair.modified === null);
      if (isChanged) {
        changedIndices.push(index);
      }
    });

    // If no changes, collapse everything except first and last few lines
    if (changedIndices.length === 0) {
      if (pairs.length <= contextLines * 2) {
        return pairs;
      }
      const result: SideBySideRow[] = [];
      // Show first contextLines
      for (let i = 0; i < contextLines; i++) {
        result.push(pairs[i]);
      }
      // Collapse middle
      const collapsedPairs = pairs.slice(contextLines, pairs.length - contextLines);
      if (collapsedPairs.length > 0) {
        const firstCollapsed = collapsedPairs[0];
        result.push({
          type: 'collapsed',
          count: collapsedPairs.length,
          originalStartLine: firstCollapsed.original?.line.lineNumber ?? 0,
          modifiedStartLine: firstCollapsed.modified?.line.lineNumber ?? 0,
          lines: collapsedPairs
        } as CollapsedBlock);
      }
      // Show last contextLines
      for (let i = pairs.length - contextLines; i < pairs.length; i++) {
        result.push(pairs[i]);
      }
      return result;
    }

    // Mark which lines should be visible (within contextLines of a change)
    const visible = new Set<number>();
    for (const changedIndex of changedIndices) {
      for (let i = Math.max(0, changedIndex - contextLines);
           i <= Math.min(pairs.length - 1, changedIndex + contextLines);
           i++) {
        visible.add(i);
      }
    }

    // Build result with collapsed blocks
    const result: SideBySideRow[] = [];
    let i = 0;

    while (i < pairs.length) {
      if (visible.has(i)) {
        result.push(pairs[i]);
        i++;
      } else {
        // Start of collapsed block
        const collapsedPairs: LinePair[] = [];
        while (i < pairs.length && !visible.has(i)) {
          collapsedPairs.push(pairs[i]);
          i++;
        }
        if (collapsedPairs.length > 0) {
          const firstCollapsed = collapsedPairs[0];
          result.push({
            type: 'collapsed',
            count: collapsedPairs.length,
            originalStartLine: firstCollapsed.original?.line.lineNumber ?? 0,
            modifiedStartLine: firstCollapsed.modified?.line.lineNumber ?? 0,
            lines: collapsedPairs
          } as CollapsedBlock);
        }
      }
    }

    return result;
  }

  /**
   * Apply context line filtering for unified view
   *
   * @param lines - Lines from pairForUnifiedView
   * @param contextLines - Number of context lines to show around changes (default: 3)
   * @returns Array of UnifiedRow (LineWithSegments or UnifiedCollapsedBlock)
   */
  static applyContextFilterUnified(
    lines: LineWithSegments[],
    contextLines: number = 3
  ): UnifiedRow[] {
    if (lines.length === 0 || contextLines < 0) {
      return lines;
    }

    // Find indices of changed lines (non-unchanged)
    const changedIndices: number[] = [];
    lines.forEach((item, index) => {
      if (item.line.type !== 'unchanged') {
        changedIndices.push(index);
      }
    });

    // If no changes, collapse everything except first and last few lines
    if (changedIndices.length === 0) {
      if (lines.length <= contextLines * 2) {
        return lines;
      }
      const result: UnifiedRow[] = [];
      // Show first contextLines
      for (let i = 0; i < contextLines; i++) {
        result.push(lines[i]);
      }
      // Collapse middle
      const collapsedLines = lines.slice(contextLines, lines.length - contextLines);
      if (collapsedLines.length > 0) {
        result.push({
          type: 'collapsed',
          count: collapsedLines.length,
          startLine: collapsedLines[0].line.lineNumber,
          lines: collapsedLines
        } as UnifiedCollapsedBlock);
      }
      // Show last contextLines
      for (let i = lines.length - contextLines; i < lines.length; i++) {
        result.push(lines[i]);
      }
      return result;
    }

    // Mark which lines should be visible (within contextLines of a change)
    const visible = new Set<number>();
    for (const changedIndex of changedIndices) {
      for (let i = Math.max(0, changedIndex - contextLines);
           i <= Math.min(lines.length - 1, changedIndex + contextLines);
           i++) {
        visible.add(i);
      }
    }

    // Build result with collapsed blocks
    const result: UnifiedRow[] = [];
    let i = 0;

    while (i < lines.length) {
      if (visible.has(i)) {
        result.push(lines[i]);
        i++;
      } else {
        // Start of collapsed block
        const collapsedLines: LineWithSegments[] = [];
        while (i < lines.length && !visible.has(i)) {
          collapsedLines.push(lines[i]);
          i++;
        }
        if (collapsedLines.length > 0) {
          result.push({
            type: 'collapsed',
            count: collapsedLines.length,
            startLine: collapsedLines[0].line.lineNumber,
            lines: collapsedLines
          } as UnifiedCollapsedBlock);
        }
      }
    }

    return result;
  }
}
