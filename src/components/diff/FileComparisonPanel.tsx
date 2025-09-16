import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { NoDifferencesDisplay } from './NoDifferencesDisplay';
import { DiffViewer } from './DiffViewer';
import { HTMLExportButton } from '../export/HTMLExportButton';
import type { CopyType } from '../ui/CopySelect';
import type { DiffResult, ViewMode, FileInfo } from '../../types/types';

export interface FileComparisonPanelProps {
  diffResult: DiffResult;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCopy: (type: CopyType) => void;
  onCopyLine?: (line: any) => Promise<void>;
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
  onCopyLine,
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
          
          {/* Export Button and View Mode */}
          <div className="flex items-center gap-3">
            <HTMLExportButton
              diffResult={diffResult}
              originalFile={originalFile || null}
              modifiedFile={modifiedFile || null}
              variant="secondary"
              size="sm"
              onSuccess={onExportSuccess}
              onError={onExportError}
            />
            <span className="text-sm text-gray-600">View Mode:</span>
            <ToggleSwitch
              value={viewMode === 'split' ? 'side-by-side' : viewMode}
              options={[
                { value: 'side-by-side', label: 'Side by Side' },
                { value: 'unified', label: 'Unified' }
              ]}
              onChange={(value) => onViewModeChange(value as ViewMode)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {hasNoDifferences ? (
          <div className="h-[60vh] flex items-center justify-center">
            <NoDifferencesDisplay />
          </div>
        ) : (
          <div className="h-[70vh] overflow-auto border rounded-md">
            <DiffViewer 
              lines={diffResult.lines} 
              viewMode={viewMode === 'split' ? 'side-by-side' : viewMode}
              onCopy={onCopy}
              onCopyLine={onCopyLine}
              showCopyButtons={true}
              loading={isCopying}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};