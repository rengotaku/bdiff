import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { ContentLayout } from '../components/layout/PageLayout';
import { FileUploadArea } from '../components/diff/FileUploadArea';
import { FileComparisonPanel } from '../components/diff/FileComparisonPanel';
import { DiffSettingsPanel } from '../components/diff/DiffSettingsPanel';
import { ComparisonOptionsSidebar } from '../components/diff/ComparisonOptionsSidebar';
import { useToastHelpers } from '../components/common/Toast';
import { useDiffContext } from '../contexts/DiffContext';
import { useFileReader } from '../hooks/useFileReader';
import { useClipboard } from '../hooks/useClipboard';
import { DiffService } from '../services/diffService';
import type { FileInfo } from '../types/types';

export const HomePage: React.FC = () => {
  const {
    setOriginalFile,
    setModifiedFile,
    calculateDiff,
    canCalculateDiff,
    isProcessing,
    error,
    clearError,
    diffResult,
    originalFile,
    modifiedFile,
    viewMode,
    setViewMode,
    comparisonOptions,
    setComparisonOptions
  } = useDiffContext();
  
  const { readFile, isReading, error: fileError } = useFileReader();
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();

  // Copy functionality with toast notifications
  const {
    copyDiff,
    isLoading: isCopying
  } = useClipboard({
    onSuccess: () => showSuccessToast('コピー完了', '差分をクリップボードにコピーしました'),
    onError: (error) => showErrorToast('コピー失敗', error)
  });
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<'original' | 'modified' | null>(null);
  
  // Ref for auto-scroll
  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle text input changes (typing in textarea)
  const handleTextChange = useCallback((text: string, target: 'original' | 'modified') => {
    const fileInfo: FileInfo = {
      name: target === 'original' ? 'Original Text' : 'Modified Text',
      content: text,
      size: new Blob([text]).size,
      lastModified: new Date()
    };

    if (target === 'original') {
      setOriginalFile(fileInfo, false); // false = text input, not file
    } else {
      setModifiedFile(fileInfo, false); // false = text input, not file
    }
    clearError();
  }, [setOriginalFile, setModifiedFile, clearError]);

  // Handle file content changes (from file upload/drop)
  const handleFileContent = useCallback((text: string, target: 'original' | 'modified', fileName: string) => {
    const fileInfo: FileInfo = {
      name: fileName,
      content: text,
      size: new Blob([text]).size,
      lastModified: new Date()
    };

    if (target === 'original') {
      setOriginalFile(fileInfo, true); // true = from file
    } else {
      setModifiedFile(fileInfo, true); // true = from file
    }
    clearError();
  }, [setOriginalFile, setModifiedFile, clearError]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent, target: 'original' | 'modified') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragTarget(target);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
      setDragTarget(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, target: 'original' | 'modified') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragTarget(null);
    
    // Method 1: Standard file drop (Works on most browsers)
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      const fileInfo = await readFile(file);
      if (fileInfo) {
        handleFileContent(fileInfo.content, target, fileInfo.name);
      }
      return;
    }
    
    // Method 2: Handle text data (Fallback for Linux/Ubuntu)
    const textData = e.dataTransfer.getData('text/plain');
    if (textData) {
      // Check if it's a file path (Linux specific)
      if (textData.startsWith('file://')) {
        console.warn('File paths dropped from file manager are not directly accessible due to browser security. Please use the file input dialog instead.');
        return;
      }
      // Otherwise treat as text content
      handleTextChange(textData, target);
      return;
    }
    
    // Method 3: Handle URI list (Additional Linux support)
    const uriList = e.dataTransfer.getData('text/uri-list');
    if (uriList) {
      console.warn('File URIs dropped from file manager detected. Please use the file input dialog for better compatibility.');
    }
  }, [readFile, handleFileContent, handleTextChange]);

  // File selection handlers
  const handleFileSelect = useCallback(async (file: File, target: 'original' | 'modified') => {
    const fileInfo = await readFile(file);
    if (fileInfo) {
      handleFileContent(fileInfo.content, target, fileInfo.name);
    }
  }, [readFile, handleFileContent]);

  // Handle comparison start
  const handleStartComparison = useCallback(async () => {
    await calculateDiff();
  }, [calculateDiff]);

  // Clear original text
  const handleClearOriginal = useCallback(() => {
    setOriginalFile(null);
  }, [setOriginalFile]);

  // Clear modified text
  const handleClearModified = useCallback(() => {
    setModifiedFile(null);
  }, [setModifiedFile]);


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

  const displayError = error || fileError;

  // Auto-scroll to results when comparison is completed
  useEffect(() => {
    if (diffResult && !isProcessing && resultsRef.current) {
      // Small delay to ensure the content is rendered
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [diffResult, isProcessing]);

  return (
    <ContentLayout
      title="BDiff"
      subtitle="Visualizing Changes, Beautifully"
    >
      <div className="space-y-8">
        {/* File Upload Areas */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FileUploadArea
              title="Original Text"
              placeholder="Paste, type your original text here, or drop a file..."
              value={originalFile?.content || ''}
              onChange={(value) => handleTextChange(value, 'original')}
              onFileSelect={(file) => handleFileSelect(file, 'original')}
              onClear={handleClearOriginal}
              fileInfo={originalFile || undefined}
              isDragging={isDragging && dragTarget === 'original'}
              onDragEnter={(e) => handleDragEnter(e, 'original')}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'original')}
              disabled={isReading || isProcessing}
            />

            <FileUploadArea
              title="Modified Text"
              placeholder="Paste, type your modified text here, or drop a file..."
              value={modifiedFile?.content || ''}
              onChange={(value) => handleTextChange(value, 'modified')}
              onFileSelect={(file) => handleFileSelect(file, 'modified')}
              onClear={handleClearModified}
              fileInfo={modifiedFile || undefined}
              isDragging={isDragging && dragTarget === 'modified'}
              onDragEnter={(e) => handleDragEnter(e, 'modified')}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'modified')}
              disabled={isReading || isProcessing}
            />
          </div>

          {/* Compare Files Button */}
          <div className="flex justify-center">
            <DiffSettingsPanel
              canCalculateDiff={canCalculateDiff}
              isProcessing={isProcessing}
              isReading={isReading}
              onStartComparison={handleStartComparison}
            />
          </div>
        </div>

        {/* Error Display */}
        {displayError && (
          <Card>
            <CardContent>
              <div className="bg-red-50 border border-danger rounded-md p-4">
                <div className="text-danger-dark font-medium">Error</div>
                <div className="text-danger mt-1">{displayError}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Display */}
        {(isProcessing || !canCalculateDiff || (!diffResult && canCalculateDiff)) && (
          <Card>
            <CardContent className="py-3">
              <div className="text-sm text-gray-600 text-center">
                {isProcessing
                  ? 'Auto-comparing files...'
                  : !canCalculateDiff
                  ? 'Select or enter content for both original and modified versions'
                  : 'Ready to compare - Click "Compare Files" button'
                }
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Results */}
        {diffResult && originalFile && modifiedFile && (
          <div ref={resultsRef} className="space-y-4">
            <FileComparisonPanel
              diffResult={diffResult}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onCopy={handleCopy}
              isCopying={isCopying}
              hasNoDifferences={Boolean(hasNoDifferences)}
              similarityPercentage={similarityPercentage}
              originalFile={originalFile}
              modifiedFile={modifiedFile}
              onExportSuccess={(filename) => showSuccessToast('エクスポート完了', `${filename} をダウンロードしました`)}
              onExportError={(error) => showErrorToast('エクスポート失敗', error)}
            />
          </div>
        )}

        {/* Comparison Options Sidebar */}
        <ComparisonOptionsSidebar
          options={comparisonOptions}
          onChange={setComparisonOptions}
          disabled={isReading || isProcessing}
        />
      </div>
    </ContentLayout>
  );
};