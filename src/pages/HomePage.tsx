import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { type CopyType } from '../components/ui/CopySelect';
import { ContentLayout } from '../components/layout/PageLayout';
import { FileUploadArea } from '../components/diff/FileUploadArea';
import { FileComparisonPanel } from '../components/diff/FileComparisonPanel';
import { DiffSettingsPanel } from '../components/diff/DiffSettingsPanel';
import ComparisonOptions from '../components/diff/ComparisonOptions';
import { useToastHelpers } from '../components/common/Toast';
import { useDiffContext } from '../contexts/DiffContext';
import { useFileReader } from '../hooks/useFileReader';
import { useClipboard } from '../hooks/useClipboard';
import { useKeyboardShortcuts, type KeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { DiffService } from '../services/diffService';
import { formatLineForCopy } from '../utils/diffRendering';
import type { FileInfo, DiffLine } from '../types/types';

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
    setComparisonOptions,
    clearAll
  } = useDiffContext();
  
  const { readFile, isReading, error: fileError } = useFileReader();
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();
  
  // Copy functionality
  const {
    copyDiff,
    copyAddedLines,
    copyRemovedLines,
    copyChangedLines,
    copyText,
    isLoading: isCopying
  } = useClipboard({
    onSuccess: (message) => showSuccessToast('コピー完了', message),
    onError: (error) => showErrorToast('コピー失敗', error)
  });
  
  // Text input states
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<'original' | 'modified' | null>(null);
  
  // Ref for auto-scroll
  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle text input changes
  const handleTextChange = useCallback((text: string, target: 'original' | 'modified') => {
    const fileInfo: FileInfo = {
      name: target === 'original' ? 'Original Text' : 'Modified Text',
      content: text,
      size: new Blob([text]).size,
      lastModified: new Date()
    };
    
    if (target === 'original') {
      setOriginalText(text);
      setOriginalFile(fileInfo);
    } else {
      setModifiedText(text);
      setModifiedFile(fileInfo);
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
        handleTextChange(fileInfo.content, target);
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
  }, [readFile, handleTextChange]);

  // File selection handlers
  const handleFileSelect = useCallback(async (file: File, target: 'original' | 'modified') => {
    const fileInfo = await readFile(file);
    if (fileInfo) {
      handleTextChange(fileInfo.content, target);
    }
  }, [readFile, handleTextChange]);

  // Handle comparison start
  const handleStartComparison = useCallback(async () => {
    await calculateDiff();
  }, [calculateDiff]);

  // Clear all data
  const handleClear = useCallback(() => {
    clearAll();
    setOriginalText('');
    setModifiedText('');
  }, [clearAll]);

  // Copy handlers
  const handleCopyAll = useCallback(async () => {
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
      // Error handled by useClipboard onError callback
    }
  }, [diffResult, copyDiff, originalFile, modifiedFile]);

  const handleCopyAdded = useCallback(async () => {
    if (!diffResult?.lines) return;
    try {
      await copyAddedLines(diffResult.lines, { format: 'diff', includeHeader: true });
    } catch (error) {
      // Error handled by useClipboard onError callback
    }
  }, [diffResult, copyAddedLines]);

  const handleCopyRemoved = useCallback(async () => {
    if (!diffResult?.lines) return;
    try {
      await copyRemovedLines(diffResult.lines, { format: 'diff', includeHeader: true });
    } catch (error) {
      // Error handled by useClipboard onError callback
    }
  }, [diffResult, copyRemovedLines]);

  const handleCopyChanged = useCallback(async () => {
    if (!diffResult?.lines) return;
    try {
      await copyChangedLines(diffResult.lines, { format: 'diff', includeHeader: true });
    } catch (error) {
      // Error handled by useClipboard onError callback
    }
  }, [diffResult, copyChangedLines]);

  const handleCopyLine = useCallback(async (line: DiffLine) => {
    try {
      const content = formatLineForCopy(line);
      await copyText(content);
    } catch (error) {
      // Error handled by useClipboard onError callback
    }
  }, [copyText]);

  const handleCopy = useCallback(async (type: CopyType) => {
    switch (type) {
      case 'all':
        await handleCopyAll();
        break;
      case 'added':
        await handleCopyAdded();
        break;
      case 'removed':
        await handleCopyRemoved();
        break;
      case 'changed':
        await handleCopyChanged();
        break;
    }
  }, [handleCopyAll, handleCopyAdded, handleCopyRemoved, handleCopyChanged]);

  const similarityPercentage = useMemo(() => {
    if (!diffResult) return 0;
    return Math.round(diffResult.stats.similarity);
  }, [diffResult]);

  const hasNoDifferences = useMemo(() => {
    return diffResult && !DiffService.hasDifferences(diffResult);
  }, [diffResult]);

  // Keyboard shortcuts
  const keyboardShortcuts: KeyboardShortcut[] = useMemo(() => {
    if (!diffResult?.lines) return [];

    return [
      {
        key: 'c',
        ctrlKey: true,
        action: handleCopyAll,
        description: '全ての差分をコピー'
      },
      {
        key: 'c',
        ctrlKey: true,
        shiftKey: true,
        action: handleCopyChanged,
        description: '変更行のみコピー'
      },
      {
        key: 'a',
        ctrlKey: true,
        shiftKey: true,
        action: handleCopyAdded,
        description: '追加行のみコピー'
      },
      {
        key: 'r',
        ctrlKey: true,
        shiftKey: true,
        action: handleCopyRemoved,
        description: '削除行のみコピー'
      }
    ];
  }, [diffResult?.lines, handleCopyAll, handleCopyChanged, handleCopyAdded, handleCopyRemoved]);

  useKeyboardShortcuts({
    enabled: !isProcessing && !!diffResult && !!originalFile && !!modifiedFile,
    shortcuts: keyboardShortcuts
  });

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
      subtitle="File Comparison Tool"
      actions={
        <DiffSettingsPanel
          canCalculateDiff={canCalculateDiff}
          isProcessing={isProcessing}
          isReading={isReading}
          onStartComparison={handleStartComparison}
          onClear={handleClear}
        />
      }
    >
      <div className="space-y-8">
        {/* File Upload Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FileUploadArea
            title="Original Text"
            placeholder="Paste, type your original text here, or drop a file..."
            value={originalText}
            onChange={(value) => handleTextChange(value, 'original')}
            onFileSelect={(file) => handleFileSelect(file, 'original')}
            fileInfo={originalFile || undefined}
            isDragging={isDragging && dragTarget === 'original'}
            onDragEnter={(e) => handleDragEnter(e, 'original')}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'original')}
            disabled={isReading || isProcessing}
            tooltipColor="green"
          />

          <FileUploadArea
            title="Modified Text"
            placeholder="Paste, type your modified text here, or drop a file..."
            value={modifiedText}
            onChange={(value) => handleTextChange(value, 'modified')}
            onFileSelect={(file) => handleFileSelect(file, 'modified')}
            fileInfo={modifiedFile || undefined}
            isDragging={isDragging && dragTarget === 'modified'}
            onDragEnter={(e) => handleDragEnter(e, 'modified')}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'modified')}
            disabled={isReading || isProcessing}
            tooltipColor="blue"
          />
        </div>

        {/* Comparison Options */}
        <div className="max-w-md">
          <ComparisonOptions
            options={comparisonOptions}
            onChange={setComparisonOptions}
            disabled={isReading || isProcessing}
          />
        </div>

        {/* Error Display */}
        {displayError && (
          <Card>
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-700 font-medium">Error</div>
                <div className="text-red-600 mt-1">{displayError}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Display */}
        {(isProcessing || !canCalculateDiff) && (
          <Card>
            <CardContent className="py-3">
              <div className="text-sm text-gray-600 text-center">
                {isProcessing
                  ? 'Auto-comparing files...'
                  : 'Select or enter content for both original and modified versions'
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
              onCopyLine={handleCopyLine}
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
      </div>
    </ContentLayout>
  );
};