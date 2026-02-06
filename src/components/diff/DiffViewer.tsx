import React, { useMemo, memo } from 'react';
import { getLineClassName, getPrefixSymbol } from '../../utils/diffRendering';
import type { DiffLine, ViewMode, CharSegment, LineWithSegments, LinePair } from '../../types/types';
import { LinePairingService } from '../../services/linePairingService';

export interface DiffViewerProps {
  /** Array of diff lines to display */
  lines: DiffLine[];
  /** Display mode for the diff viewer */
  viewMode: ViewMode;
  /** Enable character-level inline diff highlighting */
  enableCharDiff?: boolean;
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
}>(({ line, index, segments }) => {
  const hasSegments = segments && segments.length > 0;

  return (
    <div
      key={index}
      className="flex items-stretch hover:bg-gray-25 transition-colors duration-150 h-full"
    >
      <div className="flex-shrink-0 w-16 px-2 py-1 text-xs text-gray-500 bg-gray-50 border-r select-none">
        {line.lineNumber}
      </div>
      <div className="flex-1 min-w-0">
        <div className={getLineClassName(line.type)}>
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
    <div className="flex-1 min-w-0 bg-gray-100">
      <div className="px-3 py-1">
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
}>(({ item, index }) => {
  if (!item) {
    return <EmptyLineCell />;
  }

  return (
    <div className="h-full">
      <DiffLineComponent
        line={item.line}
        index={index}
        segments={item.segments}
      />
    </div>
  );
});

SideBySideCell.displayName = 'SideBySideCell';

/**
 * Side-by-side pair row component
 * Renders original and modified lines in the same grid row for height synchronization
 */
const SideBySidePairRow = memo<{
  pair: LinePair;
  index: number;
}>(({ pair, index }) => (
  <div className="grid grid-cols-2">
    <div className="border-r border-gray-200">
      <SideBySideCell item={pair.original} index={index} />
    </div>
    <SideBySideCell item={pair.modified} index={index} />
  </div>
));

SideBySidePairRow.displayName = 'SideBySidePairRow';

/**
 * Side-by-side view with synchronized line heights
 */
const SideBySideView = memo<{
  pairs: LinePair[];
}>(({ pairs }) => (
  <div role="main" aria-label="Side-by-side diff view">
    {/* Header row */}
    <div className="grid grid-cols-2 mb-2">
      <div className="px-4">
        <div className="font-medium text-sm text-gray-700">Original</div>
      </div>
      <div className="px-4">
        <div className="font-medium text-sm text-gray-700">Modified</div>
      </div>
    </div>
    {/* Line pairs */}
    <div className="overflow-visible">
      {pairs.map((pair, index) => (
        <SideBySidePairRow
          key={`pair-${index}`}
          pair={pair}
          index={index}
        />
      ))}
    </div>
  </div>
));

SideBySideView.displayName = 'SideBySideView';

/**
 * Unified diff display component
 */
const UnifiedPanel = memo<{
  lines: LineWithSegments[];
}>(({ lines }) => (
  <div className="space-y-2">
    <div className="border rounded-md overflow-visible" role="region" aria-label="Unified diff view">
      {lines.map((item, index) => (
        <DiffLineComponent
          key={`${item.line.lineNumber}-${index}`}
          line={item.line}
          index={index}
          segments={item.segments}
        />
      ))}
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
  enableCharDiff = true
}) => {
  // Memoize line pairs for side-by-side view with synchronized heights
  const sideBySidePairs = useMemo(() => {
    if (viewMode !== 'side-by-side') {
      return [];
    }

    return LinePairingService.pairLinesForSideBySide(lines, enableCharDiff);
  }, [lines, viewMode, enableCharDiff]);

  // Memoize unified view lines with character-level diff
  const unifiedLinesWithSegments = useMemo(() => {
    if (viewMode === 'side-by-side') {
      return [];
    }

    return LinePairingService.pairForUnifiedView(lines, enableCharDiff);
  }, [lines, viewMode, enableCharDiff]);

  // Render side-by-side view with synchronized row heights
  if (viewMode === 'side-by-side') {
    return <SideBySideView pairs={sideBySidePairs} />;
  }

  // Render unified view with character diff
  return (
    <UnifiedPanel
      lines={unifiedLinesWithSegments}
    />
  );
});

DiffViewer.displayName = 'DiffViewer';
