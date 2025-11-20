import React, { useMemo, memo } from 'react';
import { getLineClassName, getPrefixSymbol } from '../../utils/diffRendering';
import type { DiffLine, ViewMode } from '../../types/types';

export interface DiffViewerProps {
  /** Array of diff lines to display */
  lines: DiffLine[];
  /** Display mode for the diff viewer */
  viewMode: ViewMode;
}

/**
 * Individual diff line component - memoized for performance
 */
const DiffLineComponent = memo<{
  line: DiffLine;
  index: number;
}>(({ line, index }) => {
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
          <span className="font-mono text-sm whitespace-pre-wrap diff-line-text">
            {line.content || '\n'}
          </span>
        </div>
      </div>
    </div>
  );
});

DiffLineComponent.displayName = 'DiffLineComponent';

/**
 * Side-by-side diff panel component
 */
const SideBySidePanel = memo<{
  lines: DiffLine[];
  title: string;
}>(({ lines, title }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between mb-2 px-4">
      <div className="font-medium text-sm text-gray-700">{title}</div>
    </div>
    <div className="border rounded-md overflow-visible" role="region" aria-label={title}>
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
  viewMode
}) => {
  // Memoize filtered lines for side-by-side view to prevent unnecessary recalculations
  const { originalLines, modifiedLines } = useMemo(() => {
    if (viewMode !== 'side-by-side') {
      return { originalLines: [], modifiedLines: [] };
    }

    return {
      originalLines: lines.filter(l => l.type !== 'added'),
      modifiedLines: lines.filter(l => l.type !== 'removed')
    };
  }, [lines, viewMode]);

  // Render side-by-side view
  if (viewMode === 'side-by-side') {
    return (
      <div className="grid grid-cols-2 gap-4" role="main" aria-label="Side-by-side diff view">
        <SideBySidePanel
          lines={originalLines}
          title="Original"
        />
        <SideBySidePanel
          lines={modifiedLines}
          title="Modified"
        />
      </div>
    );
  }

  // Render unified view
  return (
    <UnifiedPanel
      lines={lines}
    />
  );
});

DiffViewer.displayName = 'DiffViewer';
