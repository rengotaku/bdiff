import type { DiffLine, LineWithSegments } from '../types/types';
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
}
