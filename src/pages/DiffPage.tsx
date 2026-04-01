import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    onSuccess: () => showSuccessToast(t('toast.copyComplete'), t('toast.copyMessage')),
    onError: (error) => showErrorToast(t('errors.copyFailed'), error)
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
      : 'Diff Comparison Result';

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
          title: t('diffPage.title'),
          subtitle: t('diffPage.processingSubtitle'),
        }}
        maxWidth="full"
      >
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">{t('diffPage.processingFiles')}</h3>
                <p className="text-gray-600 mt-1">{t('diffPage.calculatingDifferences')}</p>
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
          title: t('diffPage.title'),
          subtitle: t('diffPage.comparisonFailed'),
        }}
        maxWidth="full"
      >
        <Card>
          <CardContent>
            <EmptyState
              title={t('diffPage.errorOccurred')}
              description={error}
              action={{ label: t('diffPage.goBack'), onClick: handleGoBack }}
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
          title: t('diffPage.title'),
          subtitle: t('diffPage.noFilesToCompare'),
        }}
        maxWidth="full"
      >
        <Card>
          <CardContent>
            <EmptyState
              title={t('diffPage.noFilesToCompare')}
              description={t('diffPage.uploadDescription')}
              action={{ label: t('diffPage.uploadFiles'), onClick: handleGoBack }}
            />
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={{
        title: t('diffPage.title'),
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('diffPage.fileInformation')}</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-1">{t('diffPage.original')}</div>
                      <div className="text-sm text-gray-600">{originalFile.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-700 mb-1">{t('diffPage.modified')}</div>
                      <div className="text-sm text-gray-600">{modifiedFile.name}</div>
                    </div>
                  </div>
                </div>
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700 transition-colors">
                    {t('diffPage.showDetails')}
                  </summary>
                  <div className="mt-3 space-y-3 pl-4">
                    <div>
                      <div className="font-medium text-green-700 mb-1">{t('diffPage.originalFile')}</div>
                      <div className="space-y-1">
                        <div>{t('diffPage.size')} {originalFile.size.toLocaleString()} bytes</div>
                        <div>{t('diffPage.type')} {originalFile.name.split('.').pop()?.toUpperCase() || 'Unknown'}</div>
                        <div>{t('diffPage.lastModified')} {originalFile.lastModified?.toLocaleString()}</div>
                        <div>{t('diffPage.linesCount')} {originalFile.content.split('\n').length.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="font-medium text-blue-700 mb-1">{t('diffPage.modifiedFile')}</div>
                      <div className="space-y-1">
                        <div>{t('diffPage.size')} {modifiedFile.size.toLocaleString()} bytes</div>
                        <div>{t('diffPage.type')} {modifiedFile.name.split('.').pop()?.toUpperCase() || 'Unknown'}</div>
                        <div>{t('diffPage.lastModified')} {modifiedFile.lastModified?.toLocaleString()}</div>
                        <div>{t('diffPage.linesCount')} {modifiedFile.content.split('\n').length.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>

              {/* Comparison Statistics */}
              <div className="space-y-4 min-h-[200px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('diffPage.comparisonStatistics')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{t('diffPage.similarity')}</span>
                    <Badge
                      variant={similarityPercentage >= 80 ? 'success' : similarityPercentage >= 50 ? 'warning' : 'destructive'}
                    >
                      {similarityPercentage}%
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{t('diffPage.added')}</span>
                      <Badge variant="added" size="sm">+{diffResult.stats.added}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{t('diffPage.removed')}</span>
                      <Badge variant="removed" size="sm">-{diffResult.stats.removed}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{t('diffPage.modifiedStat')}</span>
                      <Badge variant="modified" size="sm">~{diffResult.stats.modified}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{t('diffPage.unchanged')}</span>
                      <Badge variant="secondary" size="sm">{diffResult.stats.unchanged}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Mode and Actions */}
              <div className="space-y-4 min-h-[200px] flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('diffPage.viewMode')}</h3>
                  <ToggleSwitch
                    value={viewMode === 'split' ? 'side-by-side' : viewMode}
                    options={[
                      { value: 'side-by-side', label: t('diffPage.sideBySide') },
                      { value: 'unified', label: t('diffPage.unified') }
                    ]}
                    onChange={(value) => setViewMode(value as ViewMode)}
                  />
                </div>

                <div className="space-y-3">
                  <CopyButton
                    onClick={handleCopy}
                    loading={isCopying}
                    size="sm"
                    label={t('diffViewer.actions.copyDiff')}
                    className="w-full h-10"
                  />
                  <HTMLExportButton
                    diffResult={diffResult}
                    originalFile={originalFile}
                    modifiedFile={modifiedFile}
                    variant="ghost"
                    size="sm"
                    className="w-full h-10"
                    onSuccess={(filename) => showSuccessToast(t('export.success'), t('export.successMessage', { filename }))}
                    onError={(error) => showErrorToast(t('export.error'), error)}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleNewComparison}
                    className="w-full h-10"
                  >
                    {t('diffPage.newComparison')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diff Viewer */}
        <Card>
          <CardHeader>
            <CardTitle>{t('diffPage.differences')}</CardTitle>
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