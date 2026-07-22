import React, { useMemo, memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getLineClassName, getPrefixSymbol } from '../../utils/diffRendering';
import type { DiffLine, ViewMode, CharSegment, LineWithSegments, SideBySideRow, UnifiedRow } from '../../types/types';
import { isCollapsedBlock, isUnifiedCollapsedBlock } from '../../types/types';
import { LinePairingService } from '../../services/linePairingService';

export interface DiffViewerProps {
  /** Array of diff lines to display */
  lines: DiffLine[];
  /** Display mode for the diff viewer */
  viewMode: ViewMode;
  /** Enable character-level inline diff highlighting */
  enableCharDiff?: boolean;
  /** Number of context lines to show around changes (undefined = show all) */
  contextLines?: number;
}

/**
 * Render character segments with inline highlighting
 */
const CharSegmentRenderer = memo<{
  segments: CharSegment[];
}>(({ segments }) => {
  return (
    <>
      {segments.map((segment, idx) => {
        let className = 'font-mono text-sm whitespace-pre-wrap';

        if (segment.type === 'removed') {
          // Removed characters: dark red background with strikethrough
          className += ' bg-red-300 text-red-900 line-through decoration-red-700';
        } else if (segment.type === 'added') {
          // Added characters: dark green background
          className += ' bg-green-300 text-green-900';
        }
        // Unchanged characters: no special styling

        return (
          <span key={idx} className={className}>
            {segment.text}
          </span>
        );
      })}
    </>
  );
});

CharSegmentRenderer.displayName = 'CharSegmentRenderer';

/**
 * Individual diff line component - memoized for performance
 */
const DiffLineComponent = memo<{
  line: DiffLine;
  index: number;
  segments?: CharSegment[];
  /** Override line number display (for side-by-side view) */
  displayLineNumber?: number;
}>(({ line, index, segments, displayLineNumber }) => {
  const hasSegments = segments && segments.length > 0;
  const lineNumToShow = displayLineNumber ?? line.lineNumber;

  return (
    <div
      key={index}
      className="flex items-stretch hover:bg-gray-25 transition-colors duration-150 h-full"
    >
      <div className="flex-shrink-0 w-16 px-2 py-1 text-xs text-gray-500 bg-gray-50 border-r select-none">
        {lineNumToShow}
      </div>
      <div className="flex-1 min-w-0 h-full flex">
        <div className={`${getLineClassName(line.type)} flex-1 flex items-start`}>
          <span className="text-gray-400 select-none mr-2" aria-hidden="true">
            {getPrefixSymbol(line.type)}
          </span>
          {hasSegments ? (
            <CharSegmentRenderer segments={segments} />
          ) : (
            <span className="font-mono text-sm whitespace-pre-wrap diff-line-text">
              {line.content || '\n'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

DiffLineComponent.displayName = 'DiffLineComponent';

/**
 * Empty line placeholder for side-by-side view
 * Used when one side has no corresponding line (insertion or deletion)
 */
const EmptyLineCell = memo(() => (
  <div className="flex items-stretch hover:bg-gray-25 transition-colors duration-150 h-full">
    <div className="flex-shrink-0 w-16 px-2 py-1 text-xs text-gray-300 bg-gray-50 border-r select-none">
      &nbsp;
    </div>
    <div className="flex-1 min-w-0 h-full flex">
      {/* font-mono text-sm を div に付けて行ボックス高さを通常行（getLineClassName）と一致させる (#125) */}
      <div className="flex-1 bg-gray-100 border-l-4 border-gray-200 px-4 py-1 font-mono text-sm">
        <span className="font-mono text-sm text-gray-300">&nbsp;</span>
      </div>
    </div>
  </div>
));

EmptyLineCell.displayName = 'EmptyLineCell';

/**
 * Single cell in side-by-side view (one side of a line pair)
 */
const SideBySideCell = memo<{
  item: LineWithSegments | null;
  index: number;
  /** Which side of the diff: 'original' or 'modified' */
  side: 'original' | 'modified';
}>(({ item, index, side }) => {
  if (!item) {
    return <EmptyLineCell />;
  }

  // Use appropriate line number based on side
  const displayLineNumber = side === 'original'
    ? item.line.originalLineNumber
    : item.line.newLineNumber;

  return (
    <div className="h-full">
      <DiffLineComponent
        line={item.line}
        index={index}
        segments={item.segments}
        displayLineNumber={displayLineNumber}
      />
    </div>
  );
});

SideBySideCell.displayName = 'SideBySideCell';

/**
 * Side-by-side pair row component
 * Renders original and modified lines in the same grid row for height synchronization
 */
/**
 * Collapsed line placeholder for one side of a collapsed row
 */
const CollapsedLineCell = memo<{
  collapsedText: string;
  expandLabel: string;
  onExpand: () => void;
  hasBorderRight?: boolean;
}>(({ collapsedText, expandLabel, onExpand, hasBorderRight }) => (
  <div
    className={`bg-gray-100 py-1 px-4 text-center cursor-pointer hover:bg-blue-50 transition-colors ${hasBorderRight ? 'border-r border-gray-200' : ''}`}
    onClick={onExpand}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onExpand()}
    aria-label={expandLabel}
  >
    <span className="text-xs text-gray-500">
      {collapsedText}
    </span>
  </div>
));

CollapsedLineCell.displayName = 'CollapsedLineCell';

/**
 * Side-by-side view with independent horizontal scrolling per column
 */
const SideBySideView = memo<{
  rows: SideBySideRow[];
  onExpandBlock: (startLine: number) => void;
  headerOriginal: string;
  headerModified: string;
  collapsedLinesText: (count: number) => string;
  expandLinesText: (count: number) => string;
}>(({ rows, onExpandBlock, headerOriginal, headerModified, collapsedLinesText, expandLinesText }) => (
  <div role="main" aria-label="Side-by-side diff view" className="side-by-side-view">
    <div className="grid grid-cols-2">
      {/* Left column (Original) */}
      <div className="border-r border-gray-200">
        <div className="px-4 mb-2">
          <div className="font-medium text-sm text-gray-700">{headerOriginal}</div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-fit">
            {rows.map((row, index) =>
              isCollapsedBlock(row) ? (
                <CollapsedLineCell
                  key={`collapsed-l-${row.originalStartLine}`}
                  collapsedText={collapsedLinesText(row.count)}
                  expandLabel={expandLinesText(row.count)}
                  onExpand={() => onExpandBlock(row.originalStartLine)}
                />
              ) : (
                <SideBySideCell
                  key={`pair-l-${index}`}
                  item={row.original}
                  index={index}
                  side="original"
                />
              )
            )}
          </div>
        </div>
      </div>
      {/* Right column (Modified) */}
      <div>
        <div className="px-4 mb-2">
          <div className="font-medium text-sm text-gray-700">{headerModified}</div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-fit">
            {rows.map((row, index) =>
              isCollapsedBlock(row) ? (
                <CollapsedLineCell
                  key={`collapsed-r-${row.originalStartLine}`}
                  collapsedText={collapsedLinesText(row.count)}
                  expandLabel={expandLinesText(row.count)}
                  onExpand={() => onExpandBlock(row.originalStartLine)}
                />
              ) : (
                <SideBySideCell
                  key={`pair-r-${index}`}
                  item={row.modified}
                  index={index}
                  side="modified"
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
));

SideBySideView.displayName = 'SideBySideView';

/**
 * Collapsed lines row for unified view
 */
const UnifiedCollapsedRow = memo<{
  onExpand: () => void;
  collapsedText: string;
  expandLabel: string;
}>(({ onExpand, collapsedText, expandLabel }) => (
  <div
    className="cursor-pointer hover:bg-blue-50 transition-colors bg-gray-100 py-1 px-4 text-center"
    onClick={onExpand}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onExpand()}
    aria-label={expandLabel}
  >
    <span className="text-xs text-gray-500">
      {collapsedText}
    </span>
  </div>
));

UnifiedCollapsedRow.displayName = 'UnifiedCollapsedRow';

/**
 * Unified diff display component
 */
const UnifiedPanel = memo<{
  rows: UnifiedRow[];
  onExpandBlock: (startLine: number) => void;
  collapsedLinesText: (count: number) => string;
  expandLinesText: (count: number) => string;
}>(({ rows, onExpandBlock, collapsedLinesText, expandLinesText }) => (
  <div className="space-y-2">
    <div className="border rounded-md overflow-visible" role="region" aria-label="Unified diff view">
      {rows.map((row, index) =>
        isUnifiedCollapsedBlock(row) ? (
          <UnifiedCollapsedRow
            key={`collapsed-${row.startLine}`}
            onExpand={() => onExpandBlock(row.startLine)}
            collapsedText={collapsedLinesText(row.count)}
            expandLabel={expandLinesText(row.count)}
          />
        ) : (
          <DiffLineComponent
            key={`${row.line.lineNumber}-${index}`}
            line={row.line}
            index={index}
            segments={row.segments}
          />
        )
      )}
    </div>
  </div>
));

UnifiedPanel.displayName = 'UnifiedPanel';

/**
 * Main diff viewer component with optimized rendering for large diffs
 *
 * @param props - DiffViewer configuration
 * @returns Rendered diff viewer component
 */
export const DiffViewer: React.FC<DiffViewerProps> = memo(({
  lines,
  viewMode,
  enableCharDiff = true,
  contextLines
}) => {
  const { t } = useTranslation();

  // Track expanded blocks by their originalStartLine / startLine (stable identifiers)
  const [expandedSideBySideBlocks, setExpandedSideBySideBlocks] = useState<Set<number>>(new Set());
  const [expandedUnifiedBlocks, setExpandedUnifiedBlocks] = useState<Set<number>>(new Set());

  // Memoize line pairs for side-by-side view with synchronized heights
  const sideBySidePairs = useMemo(() => {
    if (viewMode !== 'side-by-side') {
      return [];
    }

    return LinePairingService.pairLinesForSideBySide(lines, enableCharDiff);
  }, [lines, viewMode, enableCharDiff]);

  // Apply context filtering if contextLines is specified
  const sideBySideRows = useMemo((): SideBySideRow[] => {
    if (viewMode !== 'side-by-side') {
      return [];
    }

    if (contextLines === undefined) {
      return sideBySidePairs;
    }

    const filtered = LinePairingService.applyContextFilter(sideBySidePairs, contextLines);

    // Expand any blocks that were previously expanded
    if (expandedSideBySideBlocks.size === 0) {
      return filtered;
    }

    // Re-expand blocks using originalStartLine as stable identifier
    const result: SideBySideRow[] = [];
    filtered.forEach((row) => {
      if (isCollapsedBlock(row) && expandedSideBySideBlocks.has(row.originalStartLine)) {
        result.push(...row.lines);
      } else {
        result.push(row);
      }
    });

    return result;
  }, [viewMode, sideBySidePairs, contextLines, expandedSideBySideBlocks]);

  // Handle side-by-side block expansion
  const handleExpandSideBySideBlock = useCallback((index: number) => {
    setExpandedSideBySideBlocks(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  // Handle unified block expansion
  const handleExpandUnifiedBlock = useCallback((index: number) => {
    setExpandedUnifiedBlocks(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  // Reset expanded blocks when lines change
  useMemo(() => {
    setExpandedSideBySideBlocks(new Set());
    setExpandedUnifiedBlocks(new Set());
  }, [lines]);

  // Memoize unified view lines with character-level diff
  const unifiedLinesWithSegments = useMemo(() => {
    if (viewMode === 'side-by-side') {
      return [];
    }

    return LinePairingService.pairForUnifiedView(lines, enableCharDiff);
  }, [lines, viewMode, enableCharDiff]);

  // Apply context filtering for unified view
  const unifiedRows = useMemo((): UnifiedRow[] => {
    if (viewMode === 'side-by-side') {
      return [];
    }

    if (contextLines === undefined) {
      return unifiedLinesWithSegments;
    }

    const filtered = LinePairingService.applyContextFilterUnified(unifiedLinesWithSegments, contextLines);

    // Expand any blocks that were previously expanded
    if (expandedUnifiedBlocks.size === 0) {
      return filtered;
    }

    // Re-expand blocks using startLine as stable identifier
    const result: UnifiedRow[] = [];
    filtered.forEach((row) => {
      if (isUnifiedCollapsedBlock(row) && expandedUnifiedBlocks.has(row.startLine)) {
        result.push(...row.lines);
      } else {
        result.push(row);
      }
    });

    return result;
  }, [viewMode, unifiedLinesWithSegments, contextLines, expandedUnifiedBlocks]);

  const collapsedLinesText = useCallback((count: number) =>
    t('diffViewer.collapsedLines', { count }), [t]);
  const expandLinesText = useCallback((count: number) =>
    t('diffViewer.expandLines', { count }), [t]);

  // Render side-by-side view with synchronized row heights
  if (viewMode === 'side-by-side') {
    return (
      <SideBySideView
        rows={sideBySideRows}
        onExpandBlock={handleExpandSideBySideBlock}
        headerOriginal={t('diffViewer.sideBySideHeader.original')}
        headerModified={t('diffViewer.sideBySideHeader.modified')}
        collapsedLinesText={collapsedLinesText}
        expandLinesText={expandLinesText}
      />
    );
  }

  // Render unified view with character diff
  return (
    <UnifiedPanel
      rows={unifiedRows}
      onExpandBlock={handleExpandUnifiedBlock}
      collapsedLinesText={collapsedLinesText}
      expandLinesText={expandLinesText}
    />
  );
});

DiffViewer.displayName = 'DiffViewer';
