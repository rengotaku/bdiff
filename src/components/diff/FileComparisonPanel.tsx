import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { CopyButton } from '../ui/CopyButton';
import { NoDifferencesDisplay } from './NoDifferencesDisplay';
import { DiffViewer } from './DiffViewer';
import { HTMLExportButton } from '../export/HTMLExportButton';
import { useExpandedView } from '../../hooks/useExpandedView';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cn } from '../../utils/cn';
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
  /** Enable character-level inline diff highlighting */
  enableCharDiff?: boolean;
  /** Collapse unchanged lines (show only context around changes) */
  collapseUnchanged?: boolean;
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
  onExportError,
  enableCharDiff = true,
  collapseUnchanged = true
}) => {
  const { t } = useTranslation();
  const { isExpanded, toggle: toggleExpanded } = useExpandedView();
  const panelRef = useRef<HTMLDivElement>(null);
  // Keep keyboard focus inside the panel while it covers the page (hidden inputs behind must not be reachable)
  useFocusTrap(panelRef, isExpanded);
  const expandLabel = isExpanded
    ? t('diffViewer.actions.collapse')
    : t('diffViewer.actions.expand');

  return (
    <Card
      ref={panelRef}
      className={cn(
        isExpanded
          ? 'fixed inset-0 z-[45] flex flex-col rounded-none border-0'
          : 'flex-1'
      )}
      data-expanded={isExpanded}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Statistics with Tooltips */}
            <div className="flex items-center gap-3 text-xs">
              <Tooltip content={t('diffViewer.statistics.similarity')} position="bottom">
                <Badge 
                  variant={similarityPercentage >= 80 ? 'success' : similarityPercentage >= 50 ? 'warning' : 'destructive'}
                  size="sm"
                >
                  {similarityPercentage}%
                </Badge>
              </Tooltip>
              <Tooltip content={t('diffViewer.statistics.additions')} position="bottom">
                <Badge variant="added" size="sm">+{diffResult.stats.added}</Badge>
              </Tooltip>
              <Tooltip content={t('diffViewer.statistics.deletions')} position="bottom">
                <Badge variant="removed" size="sm">-{diffResult.stats.removed}</Badge>
              </Tooltip>
              <Tooltip content={t('diffViewer.statistics.changes')} position="bottom">
                <Badge variant="modified" size="sm">~{diffResult.stats.modified}</Badge>
              </Tooltip>
              <Tooltip content={t('diffViewer.statistics.unchanged')} position="bottom">
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
              label={t('diffViewer.actions.copyDiff')}
            />
            <HTMLExportButton
              diffResult={diffResult}
              originalFile={originalFile || null}
              modifiedFile={modifiedFile || null}
              viewMode={viewMode}
              collapseUnchanged={collapseUnchanged}
              variant="ghost"
              size="sm"
              onSuccess={onExportSuccess}
              onError={onExportError}
            />
            <div className="flex items-center gap-1 bg-gray-100 rounded-md">
              <button
                onClick={() => onViewModeChange('side-by-side')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'side-by-side'
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-gray-light hover:text-gray'
                }`}
                title={t('diffViewer.viewMode.sideBySideTitle')}
                aria-label={t('diffViewer.viewMode.sideBySideTitle')}
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
                title={t('diffViewer.viewMode.unifiedTitle')}
                aria-label={t('diffViewer.viewMode.unifiedTitle')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
            <button
              onClick={toggleExpanded}
              className={`p-2 rounded-md transition-colors ${
                isExpanded
                  ? 'bg-gray-100 text-primary'
                  : 'text-gray-light hover:text-gray hover:bg-gray-100'
              }`}
              title={expandLabel}
              aria-label={expandLabel}
              aria-pressed={isExpanded}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {isExpanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('pt-0', isExpanded && 'flex-1 min-h-0')}>
        {hasNoDifferences ? (
          <div className={cn('flex items-center justify-center', isExpanded ? 'h-full' : 'h-[60vh]')}>
            <NoDifferencesDisplay />
          </div>
        ) : (
          <div className={cn('overflow-auto border rounded-md', isExpanded ? 'h-full' : 'max-h-[80vh]')}>
            <DiffViewer
              lines={diffResult.lines}
              viewMode={viewMode}
              enableCharDiff={enableCharDiff}
              contextLines={collapseUnchanged ? 3 : undefined}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};