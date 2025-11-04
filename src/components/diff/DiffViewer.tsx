import React, { useCallback, useMemo, memo } from 'react';
import { CopySelect, type CopyType } from '../ui/CopySelect';
import { getLineClassName, getPrefixSymbol } from '../../utils/diffRendering';
import type { DiffLine, ViewMode } from '../../types/types';

export interface DiffViewerProps {
  /** Array of diff lines to display */
  lines: DiffLine[];
  /** Display mode for the diff viewer */
  viewMode: ViewMode;
  /** Callback for copy operations */
  onCopy: (type: CopyType) => void;
  /** Optional callback for copying individual lines */
  onCopyLine?: (line: DiffLine) => Promise<void>;
  /** Whether to show copy buttons */
  showCopyButtons?: boolean;
  /** Loading state for copy operations */
  loading?: boolean;
}

/**
 * Individual diff line component - memoized for performance
 */
const DiffLineComponent = memo<{
  line: DiffLine;
  index: number;
  onCopyLine?: (line: DiffLine) => Promise<void>;
}>(({ line, index, onCopyLine }) => {
  const handleCopyLine = useCallback(async () => {
    if (onCopyLine) {
      await onCopyLine(line);
    }
  }, [line, onCopyLine]);

  return (
    <div 
      key={index} 
      className="flex items-start group hover:bg-gray-25 transition-colors duration-150"
    >
      <div className="flex-shrink-0 w-16 px-2 py-1 text-xs text-gray-500 bg-gray-50 border-r select-none">
        {line.lineNumber}
      </div>
      <div className="flex-1 relative min-w-0">
        <div className={getLineClassName(line.type)}>
          <span className="text-gray-400 select-none mr-2" aria-hidden="true">
            {getPrefixSymbol(line.type)}
          </span>
          <span className="font-mono text-sm whitespace-pre-wrap break-words diff-line-text">
            {line.content || '\n'}
          </span>
        </div>
        {onCopyLine && (
          <button
            onClick={handleCopyLine}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 hover:bg-gray-200 rounded text-xs text-gray-500 hover:text-gray-700"
            title="Copy line"
            aria-label={`Copy line ${line.lineNumber}`}
          >
            📋
          </button>
        )}
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
  onCopy: (type: CopyType) => void;
  loading: boolean;
  onCopyLine?: (line: DiffLine) => Promise<void>;
}>(({ lines, title, onCopy, loading, onCopyLine }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between mb-2 px-4">
      <div className="font-medium text-sm text-gray-700">{title}</div>
      <CopySelect
        onCopy={onCopy}
        loading={loading}
        size="sm"
      />
    </div>
    <div className="border rounded-md overflow-visible" role="region" aria-label={title}>
      {lines.map((line, index) => (
        <DiffLineComponent
          key={`${line.lineNumber}-${index}`}
          line={line}
          index={index}
          onCopyLine={onCopyLine}
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
  onCopy: (type: CopyType) => void;
  loading: boolean;
  onCopyLine?: (line: DiffLine) => Promise<void>;
}>(({ lines, onCopy, loading, onCopyLine }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between px-4">
      <div className="font-medium text-sm text-gray-700">差分表示</div>
      <CopySelect
        onCopy={onCopy}
        loading={loading}
        size="sm"
      />
    </div>
    <div className="border rounded-md overflow-visible" role="region" aria-label="Unified diff view">
      {lines.map((line, index) => (
        <DiffLineComponent
          key={`${line.lineNumber}-${index}`}
          line={line}
          index={index}
          onCopyLine={onCopyLine}
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
  onCopy, 
  onCopyLine, 
  showCopyButtons = true, 
  loading = false 
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
          onCopy={onCopy}
          loading={loading}
          onCopyLine={showCopyButtons ? onCopyLine : undefined}
        />
        <SideBySidePanel
          lines={modifiedLines}
          title="Modified"
          onCopy={onCopy}
          loading={loading}
          onCopyLine={showCopyButtons ? onCopyLine : undefined}
        />
      </div>
    );
  }

  // Render unified view
  return (
    <UnifiedPanel
      lines={lines}
      onCopy={onCopy}
      loading={loading}
      onCopyLine={showCopyButtons ? onCopyLine : undefined}
    />
  );
});

DiffViewer.displayName = 'DiffViewer';