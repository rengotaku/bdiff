import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { CopyButton } from '../ui/CopyButton';
import { NoDifferencesDisplay } from './NoDifferencesDisplay';
import { DiffViewer } from './DiffViewer';
import { HTMLExportButton } from '../export/HTMLExportButton';
import type { DiffResult, ViewMode, FileInfo } from '../../types/types';

export interface FileComparisonPanelProps {
  diffResult: DiffResult;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCopy: () => void;
  isCopying: boolean;
  hasNoDifferences: boolean;
  similarityPercentage: number;
  originalFile?: FileInfo | null | undefined;
  modifiedFile?: FileInfo | null | undefined;
  onExportSuccess?: (filename: string) => void;
  onExportError?: (error: string) => void;
}

export const FileComparisonPanel: React.FC<FileComparisonPanelProps> = ({
  diffResult,
  viewMode,
  onViewModeChange,
  onCopy,
  isCopying,
  hasNoDifferences,
  similarityPercentage,
  originalFile,
  modifiedFile,
  onExportSuccess,
  onExportError
}) => {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Statistics with Tooltips */}
            <div className="flex items-center gap-3 text-xs">
              <Tooltip content="Similarity percentage between the two files" position="bottom">
                <Badge 
                  variant={similarityPercentage >= 80 ? 'success' : similarityPercentage >= 50 ? 'warning' : 'destructive'}
                  size="sm"
                >
                  {similarityPercentage}%
                </Badge>
              </Tooltip>
              <Tooltip content="Added lines" position="bottom">
                <Badge variant="added" size="sm">+{diffResult.stats.added}</Badge>
              </Tooltip>
              <Tooltip content="Removed lines" position="bottom">
                <Badge variant="removed" size="sm">-{diffResult.stats.removed}</Badge>
              </Tooltip>
              <Tooltip content="Modified lines" position="bottom">
                <Badge variant="modified" size="sm">~{diffResult.stats.modified}</Badge>
              </Tooltip>
              <Tooltip content="Unchanged lines" position="bottom">
                <Badge variant="secondary" size="sm">{diffResult.stats.unchanged}</Badge>
              </Tooltip>
            </div>
          </div>
          
          {/* Copy, Export Button and View Mode */}
          <div className="flex items-center gap-3">
            <CopyButton
              onClick={onCopy}
              loading={isCopying}
              size="sm"
              label="📋 全てコピー"
            />
            <HTMLExportButton
              diffResult={diffResult}
              originalFile={originalFile || null}
              modifiedFile={modifiedFile || null}
              variant="secondary"
              size="sm"
              onSuccess={onExportSuccess}
              onError={onExportError}
            />
            <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
              <button
                onClick={() => onViewModeChange('split')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'split' 
                    ? 'bg-white shadow-sm text-primary' 
                    : 'text-gray-light hover:text-gray'
                }`}
                title="Side by Side View"
                aria-label="Side by Side View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange('unified')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'unified' 
                    ? 'bg-white shadow-sm text-primary' 
                    : 'text-gray-light hover:text-gray'
                }`}
                title="Unified View"
                aria-label="Unified View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {hasNoDifferences ? (
          <div className="h-[60vh] flex items-center justify-center">
            <NoDifferencesDisplay />
          </div>
        ) : (
          <div className="max-h-[80vh] overflow-auto border rounded-md">
            <DiffViewer
              lines={diffResult.lines}
              viewMode={viewMode === 'split' ? 'side-by-side' : viewMode}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};