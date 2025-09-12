import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { InfoIcon } from '../components/ui/InfoIcon';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { ContentLayout } from '../components/layout/PageLayout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { NoDifferencesDisplay } from '../components/diff/NoDifferencesDisplay';
import { useDiffContext } from '../contexts/DiffContext';
import { useFileReader } from '../hooks/useFileReader';
import { DiffService } from '../services/diffService';
import type { FileInfo, DiffLine, ViewMode } from '../types/types';

interface DiffViewerProps {
  lines: DiffLine[];
  viewMode: ViewMode;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ lines, viewMode }) => {
  const renderLine = useCallback((line: DiffLine, index: number) => {
    const getLineClassName = (type: DiffLine['type']) => {
      const base = 'font-mono text-sm border-l-4 px-4 py-1 whitespace-pre-wrap';
      switch (type) {
        case 'added':
          return `${base} bg-green-50 border-green-400 text-green-800`;
        case 'removed':
          return `${base} bg-red-50 border-red-400 text-red-800`;
        case 'modified':
          return `${base} bg-blue-50 border-blue-400 text-blue-800`;
        default:
          return `${base} bg-white border-gray-200 text-gray-700`;
      }
    };

    const getPrefixSymbol = (type: DiffLine['type']) => {
      switch (type) {
        case 'added': return '+ ';
        case 'removed': return '- ';
        case 'modified': return '~ ';
        default: return '  ';
      }
    };

    return (
      <div key={index} className="flex items-start">
        <div className="flex-shrink-0 w-16 px-2 py-1 text-xs text-gray-500 bg-gray-50 border-r">
          {line.lineNumber}
        </div>
        <div className={getLineClassName(line.type)}>
          <span className="text-gray-400 select-none">{getPrefixSymbol(line.type)}</span>
          {line.content || '\n'}
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
          <div className="font-medium text-sm text-gray-700 mb-2 px-4">Original</div>
          <div className="border rounded-md overflow-hidden">
            {originalLines.map((line, index) => renderLine(line, index))}
          </div>
        </div>
        <div className="space-y-1">
          <div className="font-medium text-sm text-gray-700 mb-2 px-4">Modified</div>
          <div className="border rounded-md overflow-hidden">
            {modifiedLines.map((line, index) => renderLine(line, index))}
          </div>
        </div>
      </div>
    );
  }

  // Unified view
  return (
    <div className="border rounded-md overflow-hidden">
      {lines.map((line, index) => renderLine(line, index))}
    </div>
  );
};

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
    clearAll
  } = useDiffContext();
  
  const { readFile, isReading, error: fileError } = useFileReader();
  
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
      subtitle="File Comparison Tool"
      actions={
        <div className="flex items-center gap-3">
          {canCalculateDiff && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">View Mode:</span>
              <ToggleSwitch
                value={viewMode === 'split' ? 'side-by-side' : viewMode}
                options={[
                  { value: 'side-by-side', label: 'Side by Side' },
                  { value: 'unified', label: 'Unified' }
                ]}
                onChange={(value) => setViewMode(value as ViewMode)}
              />
            </div>
          )}
          <Button
            variant="secondary"
            onClick={handleClear}
            disabled={isReading || isProcessing}
            size="sm"
          >
            Clear All
          </Button>
          <Button
            variant="primary"
            onClick={handleStartComparison}
            disabled={!canCalculateDiff || isReading || isProcessing}
            size="sm"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="sm" />
                Comparing...
              </>
            ) : (
              'Compare Files'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Text Input with File Drop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Text */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Original Text</CardTitle>
                {originalFile && (
                  <Tooltip
                    content={
                      <div className="space-y-2 min-w-48">
                        <div className="font-medium text-green-200 mb-2">Original File Information</div>
                        <div className="space-y-1 text-sm">
                          <div>Name: {originalFile.name}</div>
                          <div>Size: {originalFile.size.toLocaleString()} bytes</div>
                          <div>Type: {originalFile.name.split('.').pop()?.toUpperCase() || 'Unknown'}</div>
                          <div>Modified: {originalFile.lastModified?.toLocaleString()}</div>
                          <div>Lines: {originalFile.content.split('\n').length.toLocaleString()}</div>
                        </div>
                      </div>
                    }
                    position="bottom"
                  >
                    <InfoIcon size="sm" />
                  </Tooltip>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                className={`
                  w-full h-64 p-4 border rounded-md resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                  ${isDragging && dragTarget === 'original' 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
                placeholder="Paste, type your original text here, or drop a file..."
                value={originalText}
                onChange={(e) => handleTextChange(e.target.value, 'original')}
                onDragEnter={(e) => handleDragEnter(e, 'original')}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'original')}
                disabled={isReading || isProcessing}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {originalText.length} characters
                </span>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="text/*,.txt,.js,.jsx,.ts,.tsx,.json,.md,.html,.css,.xml,.yaml,.yml"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const fileInfo = await readFile(file);
                        if (fileInfo) {
                          handleTextChange(fileInfo.content, 'original');
                        }
                      }
                    }}
                    disabled={isReading || isProcessing}
                  />
                  <span className="text-xs text-blue-600 hover:text-blue-700 underline">
                    Browse file
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Modified Text */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Modified Text</CardTitle>
                {modifiedFile && (
                  <Tooltip
                    content={
                      <div className="space-y-2 min-w-48">
                        <div className="font-medium text-blue-200 mb-2">Modified File Information</div>
                        <div className="space-y-1 text-sm">
                          <div>Name: {modifiedFile.name}</div>
                          <div>Size: {modifiedFile.size.toLocaleString()} bytes</div>
                          <div>Type: {modifiedFile.name.split('.').pop()?.toUpperCase() || 'Unknown'}</div>
                          <div>Modified: {modifiedFile.lastModified?.toLocaleString()}</div>
                          <div>Lines: {modifiedFile.content.split('\n').length.toLocaleString()}</div>
                        </div>
                      </div>
                    }
                    position="bottom"
                  >
                    <InfoIcon size="sm" />
                  </Tooltip>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                className={`
                  w-full h-64 p-4 border rounded-md resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                  ${isDragging && dragTarget === 'modified' 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
                placeholder="Paste, type your modified text here, or drop a file..."
                value={modifiedText}
                onChange={(e) => handleTextChange(e.target.value, 'modified')}
                onDragEnter={(e) => handleDragEnter(e, 'modified')}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'modified')}
                disabled={isReading || isProcessing}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {modifiedText.length} characters
                </span>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="text/*,.txt,.js,.jsx,.ts,.tsx,.json,.md,.html,.css,.xml,.yaml,.yml"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const fileInfo = await readFile(file);
                        if (fileInfo) {
                          handleTextChange(fileInfo.content, 'modified');
                        }
                      }
                    }}
                    disabled={isReading || isProcessing}
                  />
                  <span className="text-xs text-blue-600 hover:text-blue-700 underline">
                    Browse file
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>
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
            {/* Diff Viewer - Main Content */}
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
                  
                  {/* View Mode */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">View Mode:</span>
                    <ToggleSwitch
                      value={viewMode === 'split' ? 'side-by-side' : viewMode}
                      options={[
                        { value: 'side-by-side', label: 'Side by Side' },
                        { value: 'unified', label: 'Unified' }
                      ]}
                      onChange={(value) => setViewMode(value as ViewMode)}
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
                    />
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </ContentLayout>
  );
};