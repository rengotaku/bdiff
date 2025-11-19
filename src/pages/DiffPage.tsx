import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { InfoIcon } from '../components/ui/InfoIcon';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { NoDifferencesDisplay } from '../components/diff/NoDifferencesDisplay';
import { CollapsibleFileSelector } from '../components/diff/CollapsibleFileSelector';
import { DiffViewer } from '../components/diff/DiffViewer';
import { HTMLExportButton } from '../components/export/HTMLExportButton';
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

  // Copy functionality - simple copy without toast notifications
  const {
    copyDiff,
    isLoading: isCopying
  } = useClipboard();

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
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">File Information</h3>
                  <Tooltip
                    content={
                      <div className="space-y-3 min-w-64">
                        <div>
                          <div className="font-medium text-green-200 mb-1">Original File</div>
                          <div className="space-y-1 text-sm">
                            <div>Name: {originalFile.name}</div>
                            <div>Size: {originalFile.size.toLocaleString()} bytes</div>
                            <div>Type: {originalFile.name.split('.').pop()?.toUpperCase() || 'Unknown'}</div>
                            <div>Modified: {originalFile.lastModified?.toLocaleString()}</div>
                            <div>Lines: {originalFile.content.split('\n').length.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="border-t border-gray-600 pt-2">
                          <div className="font-medium text-blue-200 mb-1">Modified File</div>
                          <div className="space-y-1 text-sm">
                            <div>Name: {modifiedFile.name}</div>
                            <div>Size: {modifiedFile.size.toLocaleString()} bytes</div>
                            <div>Type: {modifiedFile.name.split('.').pop()?.toUpperCase() || 'Unknown'}</div>
                            <div>Modified: {modifiedFile.lastModified?.toLocaleString()}</div>
                            <div>Lines: {modifiedFile.content.split('\n').length.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    }
                    position="bottom"
                  >
                    <InfoIcon size="sm" />
                  </Tooltip>
                </div>
                <div className="text-sm text-gray-600">
                  Comparing {originalFile.name} with {modifiedFile.name}
                </div>
              </div>

              {/* Comparison Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Comparison Statistics</h3>
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
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">View Mode</h3>
                <div className="space-y-3">
                  <ToggleSwitch
                    value={viewMode === 'split' ? 'side-by-side' : viewMode}
                    options={[
                      { value: 'side-by-side', label: 'Side by Side' },
                      { value: 'unified', label: 'Unified' }
                    ]}
                    onChange={(value) => setViewMode(value as ViewMode)}
                  />
                  
                  
                  <div className="pt-2 space-y-2">
                    <HTMLExportButton
                      diffResult={diffResult}
                      originalFile={originalFile}
                      modifiedFile={modifiedFile}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onSuccess={(filename) => console.log('Export success:', filename)}
                      onError={(error) => console.error('Export error:', error)}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleNewComparison}
                      className="w-full"
                    >
                      New Comparison
                    </Button>
                  </div>
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
                  onCopy={handleCopy}
                  loading={isCopying}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};