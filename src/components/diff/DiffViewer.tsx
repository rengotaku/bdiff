import React, { useMemo, memo } from 'react';
import { getLineClassName, getPrefixSymbol } from '../../utils/diffRendering';
import type { DiffLine, ViewMode, CharSegment } from '../../types/types';
import { CharDiffService } from '../../services/charDiffService';

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
      className="flex items-start hover:bg-gray-25 transition-colors duration-150"
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
 * Compute character segments for paired lines
 */
interface LineWithSegments {
  line: DiffLine;
  segments?: CharSegment[];
}

/**
 * Side-by-side diff panel component
 */
const SideBySidePanel = memo<{
  lines: LineWithSegments[];
  title: string;
}>(({ lines, title }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between mb-2 px-4">
      <div className="font-medium text-sm text-gray-700">{title}</div>
    </div>
    <div className="border rounded-md overflow-visible" role="region" aria-label={title}>
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

SideBySidePanel.displayName = 'SideBySidePanel';

/**
 * Unified diff display component
 */
const UnifiedPanel = memo<{
  lines: DiffLine[];
}>(({ lines }) => (
  <div className="space-y-2">
    <div className="border rounded-md overflow-visible" role="region" aria-label="Unified diff view">
      {lines.map((line, index) => (
        <DiffLineComponent
          key={`${line.lineNumber}-${index}`}
          line={line}
          index={index}
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
  // Memoize filtered lines for side-by-side view with character-level diff
  const { originalLinesWithSegments, modifiedLinesWithSegments } = useMemo(() => {
    if (viewMode !== 'side-by-side') {
      return { originalLinesWithSegments: [], modifiedLinesWithSegments: [] };
    }

    const originalLines = lines.filter(l => l.type !== 'added');
    const modifiedLines = lines.filter(l => l.type !== 'removed');

    if (!enableCharDiff) {
      return {
        originalLinesWithSegments: originalLines.map(line => ({ line })),
        modifiedLinesWithSegments: modifiedLines.map(line => ({ line }))
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
      originalLinesWithSegments: originalWithSegments,
      modifiedLinesWithSegments: modifiedWithSegments
    };
  }, [lines, viewMode, enableCharDiff]);

  // Render side-by-side view
  if (viewMode === 'side-by-side') {
    return (
      <div className="grid grid-cols-2 gap-4" role="main" aria-label="Side-by-side diff view">
        <SideBySidePanel
          lines={originalLinesWithSegments}
          title="Original"
        />
        <SideBySidePanel
          lines={modifiedLinesWithSegments}
          title="Modified"
        />
      </div>
    );
  }

  // Render unified view (no character diff for now)
  return (
    <UnifiedPanel
      lines={lines}
    />
  );
});

DiffViewer.displayName = 'DiffViewer';
