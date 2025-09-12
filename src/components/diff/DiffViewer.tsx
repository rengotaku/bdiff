import React, { useCallback } from 'react';
import { CopySelect, type CopyType } from '../ui/CopySelect';
import { getLineClassName, getPrefixSymbol } from '../../utils/diffRendering';
import type { DiffLine, ViewMode } from '../../types/types';

export interface DiffViewerProps {
  lines: DiffLine[];
  viewMode: ViewMode;
  onCopy: (type: CopyType) => void;
  onCopyLine?: (line: DiffLine) => Promise<void>;
  showCopyButtons?: boolean;
  loading?: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ 
  lines, 
  viewMode, 
  onCopy, 
  onCopyLine, 
  showCopyButtons = true, 
  loading = false 
}) => {
  // Suppress unused parameter warnings - these props may be used for future features
  void onCopyLine;
  void showCopyButtons;
  
  const renderLine = useCallback((line: DiffLine, index: number) => {
    return (
      <div key={index} className="flex items-start">
        <div className="flex-shrink-0 w-16 px-2 py-1 text-xs text-gray-500 bg-gray-50 border-r">
          {line.lineNumber}
        </div>
        <div className="flex-1">
          <div className={getLineClassName(line.type)}>
            <span className="text-gray-400 select-none">{getPrefixSymbol(line.type)}</span>
            {line.content || '\n'}
          </div>
        </div>
      </div>
    );
  }, []);

  if (viewMode === 'side-by-side') {
    const originalLines = lines.filter(l => l.type !== 'added');
    const modifiedLines = lines.filter(l => l.type !== 'removed');
    
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-2 px-4">
            <div className="font-medium text-sm text-gray-700">Original</div>
            <CopySelect
              onCopy={onCopy}
              loading={loading}
              size="sm"
            />
          </div>
          <div className="border rounded-md overflow-hidden">
            {originalLines.map((line, index) => renderLine(line, index))}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-2 px-4">
            <div className="font-medium text-sm text-gray-700">Modified</div>
            <CopySelect
              onCopy={onCopy}
              loading={loading}
              size="sm"
            />
          </div>
          <div className="border rounded-md overflow-hidden">
            {modifiedLines.map((line, index) => renderLine(line, index))}
          </div>
        </div>
      </div>
    );
  }

  // Unified view
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-4">
        <div className="font-medium text-sm text-gray-700">差分表示</div>
        <CopySelect
          onCopy={onCopy}
          loading={loading}
          size="sm"
        />
      </div>
      <div className="border rounded-md overflow-hidden">
        {lines.map((line, index) => renderLine(line, index))}
      </div>
    </div>
  );
};