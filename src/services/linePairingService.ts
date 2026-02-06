import type { DiffLine, LineWithSegments, LinePair, SideBySideRow, CollapsedBlock, UnifiedRow, UnifiedCollapsedBlock } from '../types/types';
import { CharDiffService } from './charDiffService';

/**
 * Service for pairing removed/added lines in diff views
 * Extracts common pairing logic used by both screen display and HTML export
 */
export class LinePairingService {
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
   * 2. Unchanged lines: create pair with same content on both sides
   * 3. Removed/added blocks: pair by position, use null for unpaired lines
   * 4. Compute character diff for paired removed/added lines if enabled
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
    let originalLineNum = 1;
    let modifiedLineNum = 1;

    while (i < lines.length) {
      const currentLine = lines[i];

      if (currentLine.type === 'unchanged') {
        // Unchanged lines appear on both sides with their respective line numbers
        const originalLine: DiffLine = { ...currentLine, lineNumber: originalLineNum };
        const modifiedLine: DiffLine = { ...currentLine, lineNumber: modifiedLineNum };
        pairs.push({
          original: { line: originalLine },
          modified: { line: modifiedLine }
        });
        originalLineNum++;
        modifiedLineNum++;
        i++;
        continue;
      }

      // Collect consecutive removed lines
      const removedLines: DiffLine[] = [];
      while (i < lines.length && lines[i].type === 'removed') {
        removedLines.push(lines[i]);
        i++;
      }

      // Collect consecutive added lines
      const addedLines: DiffLine[] = [];
      while (i < lines.length && lines[i].type === 'added') {
        addedLines.push(lines[i]);
        i++;
      }

      // Pair removed and added lines
      const maxLen = Math.max(removedLines.length, addedLines.length);
      for (let j = 0; j < maxLen; j++) {
        const removedLine = removedLines[j] ?? null;
        const addedLine = addedLines[j] ?? null;

        // Create copies with correct line numbers
        const originalWithLineNum = removedLine
          ? { ...removedLine, lineNumber: originalLineNum }
          : null;
        const modifiedWithLineNum = addedLine
          ? { ...addedLine, lineNumber: modifiedLineNum }
          : null;

        if (removedLine) originalLineNum++;
        if (addedLine) modifiedLineNum++;

        if (enableCharDiff && originalWithLineNum && modifiedWithLineNum &&
            CharDiffService.shouldShowCharDiff(originalWithLineNum.content, modifiedWithLineNum.content)) {
          // Compute character-level diff for this pair
          const { originalSegments, modifiedSegments } = CharDiffService.calculateCharDiff(
            originalWithLineNum.content,
            modifiedWithLineNum.content
          );
          pairs.push({
            original: { line: originalWithLineNum, segments: originalSegments },
            modified: { line: modifiedWithLineNum, segments: modifiedSegments }
          });
        } else {
          pairs.push({
            original: originalWithLineNum ? { line: originalWithLineNum } : null,
            modified: modifiedWithLineNum ? { line: modifiedWithLineNum } : null
          });
        }
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
