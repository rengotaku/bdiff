import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { NoDifferencesDisplay } from '../components/diff/NoDifferencesDisplay';
import { CollapsibleFileSelector } from '../components/diff/CollapsibleFileSelector';
import { DiffViewer } from '../components/diff/DiffViewer';
import { HTMLExportButton } from '../components/export/HTMLExportButton';
import { CopyButton } from '../components/ui/CopyButton';
import { useToastHelpers } from '../components/common/Toast';
import { useDiffContext } from '../contexts/DiffContext';
import { useFileReader } from '../hooks/useFileReader';
import { useClipboard } from '../hooks/useClipboard';
import { DiffService } from '../services/diffService';
import type { ViewMode } from '../types/types';

export const DiffPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    originalFile,
    modifiedFile,
    diffResult,
    isProcessing,
    error,
    viewMode,
    setViewMode,
    setOriginalFile,
    setModifiedFile,
    calculateDiff,
    clearAll
  } = useDiffContext();
  
  const { readFile } = useFileReader();
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();

  // Copy functionality with toast notifications
  const {
    copyDiff,
    isLoading: isCopying
  } = useClipboard({
    onSuccess: () => showSuccessToast('コピー完了', '差分をクリップボードにコピーしました'),
    onError: (error) => showErrorToast('コピー失敗', error)
  });

  const handleGoBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleNewComparison = useCallback(() => {
    clearAll();
    navigate('/');
  }, [clearAll, navigate]);

  const handleFileSelect = useCallback(async (files: { original: File | null; modified: File | null }) => {
    if (files.original) {
      const fileInfo = await readFile(files.original);
      if (fileInfo) setOriginalFile(fileInfo);
    }
    if (files.modified) {
      const fileInfo = await readFile(files.modified);
      if (fileInfo) setModifiedFile(fileInfo);
    }
  }, [readFile, setOriginalFile, setModifiedFile]);

  const handleNewComparisonFromSelector = useCallback(async () => {
    await calculateDiff();
  }, [calculateDiff]);

  // Simplified copy handler - only copy all
  const handleCopy = useCallback(async () => {
    if (!diffResult?.lines) return;

    const filename = originalFile?.name && modifiedFile?.name
      ? `${originalFile.name} vs ${modifiedFile.name}`
      : '差分比較結果';

    try {
      await copyDiff(diffResult.lines, {
        format: 'diff',
        filename,
        originalFilename: originalFile?.name,
        modifiedFilename: modifiedFile?.name,
        includeHeader: true
      });
    } catch (error) {
      // Error silently handled
      console.error('Copy failed:', error);
    }
  }, [diffResult, copyDiff, originalFile, modifiedFile]);

  const similarityPercentage = useMemo(() => {
    if (!diffResult) return 0;
    return Math.round(diffResult.stats.similarity);
  }, [diffResult]);

  const hasNoDifferences = useMemo(() => {
    return diffResult && !DiffService.hasDifferences(diffResult);
  }, [diffResult]);

  // Loading state
  if (isProcessing) {
    return (
      <PageLayout
        header={{
          title: 'File Comparison',
          subtitle: 'Processing your files...',
        }}
        maxWidth="full"
      >
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">Processing files...</h3>
                <p className="text-gray-600 mt-1">Calculating differences between your files</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout
        header={{
          title: 'File Comparison',
          subtitle: 'Comparison failed',
        }}
        maxWidth="full"
      >
        <Card>
          <CardContent>
            <EmptyState
              title="Error occurred"
              description={error}
              action={{ label: 'Go Back', onClick: handleGoBack }}
            />
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  // No files state
  if (!originalFile || !modifiedFile || !diffResult) {
    return (
      <PageLayout
        header={{
          title: 'File Comparison',
          subtitle: 'No files to compare',
        }}
        maxWidth="full"
      >
        <Card>
          <CardContent>
            <EmptyState
              title="No files to compare"
              description="Upload or select files to see their differences"
              action={{ label: 'Upload Files', onClick: handleGoBack }}
            />
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={{
        title: 'File Comparison',
        subtitle: `${originalFile.name} vs ${modifiedFile.name}`,
      }}
      maxWidth="full"
    >
      <div className="space-y-6">
        {/* Collapsible File Selector */}
        <CollapsibleFileSelector
          onFileSelect={handleFileSelect}
          onNewComparison={handleNewComparisonFromSelector}
        />
        
        {/* Combined File Info, Stats, and View Mode */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* File Information */}
              <div className="space-y-4 min-h-[200px] flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">File Information</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-1">Original</div>
                      <div className="text-sm text-gray-600">{originalFile.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-700 mb-1">Modified</div>
                      <div className="text-sm text-gray-600">{modifiedFile.name}</div>
                    </div>
                  </div>
                </div>
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700 transition-colors">
                    詳細情報を表示
                  </summary>
                  <div className="mt-3 space-y-3 pl-4">
                    <div>
                      <div className="font-medium text-green-700 mb-1">Original File</div>
                      <div className="space-y-1">
                        <div>Size: {originalFile.size.toLocaleString()} bytes</div>
                        <div>Type: {originalFile.name.split('.').pop()?.toUpperCase() || 'Unknown'}</div>
                        <div>Modified: {originalFile.lastModified?.toLocaleString()}</div>
                        <div>Lines: {originalFile.content.split('\n').length.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="font-medium text-blue-700 mb-1">Modified File</div>
                      <div className="space-y-1">
                        <div>Size: {modifiedFile.size.toLocaleString()} bytes</div>
                        <div>Type: {modifiedFile.name.split('.').pop()?.toUpperCase() || 'Unknown'}</div>
                        <div>Modified: {modifiedFile.lastModified?.toLocaleString()}</div>
                        <div>Lines: {modifiedFile.content.split('\n').length.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>

              {/* Comparison Statistics */}
              <div className="space-y-4 min-h-[200px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Comparison Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Similarity</span>
                    <Badge
                      variant={similarityPercentage >= 80 ? 'success' : similarityPercentage >= 50 ? 'warning' : 'destructive'}
                    >
                      {similarityPercentage}%
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Added</span>
                      <Badge variant="added" size="sm">+{diffResult.stats.added}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Removed</span>
                      <Badge variant="removed" size="sm">-{diffResult.stats.removed}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Modified</span>
                      <Badge variant="modified" size="sm">~{diffResult.stats.modified}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Unchanged</span>
                      <Badge variant="secondary" size="sm">{diffResult.stats.unchanged}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Mode and Actions */}
              <div className="space-y-4 min-h-[200px] flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">View Mode</h3>
                  <ToggleSwitch
                    value={viewMode === 'split' ? 'side-by-side' : viewMode}
                    options={[
                      { value: 'side-by-side', label: 'Side by Side' },
                      { value: 'unified', label: 'Unified' }
                    ]}
                    onChange={(value) => setViewMode(value as ViewMode)}
                  />
                </div>

                <div className="space-y-3">
                  <CopyButton
                    onClick={handleCopy}
                    loading={isCopying}
                    size="sm"
                    label="全てコピー"
                    className="w-full h-10"
                  />
                  <HTMLExportButton
                    diffResult={diffResult}
                    originalFile={originalFile}
                    modifiedFile={modifiedFile}
                    variant="ghost"
                    size="sm"
                    className="w-full h-10"
                    onSuccess={(filename) => showSuccessToast('エクスポート完了', `${filename} をダウンロードしました`)}
                    onError={(error) => showErrorToast('エクスポート失敗', error)}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleNewComparison}
                    className="w-full h-10"
                  >
                    New Comparison
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diff Viewer */}
        <Card>
          <CardHeader>
            <CardTitle>Differences</CardTitle>
          </CardHeader>
          <CardContent>
            {hasNoDifferences ? (
              <NoDifferencesDisplay />
            ) : (
              <div className="overflow-auto">
                <DiffViewer
                  lines={diffResult.lines}
                  viewMode={viewMode === 'split' ? 'side-by-side' : viewMode}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};