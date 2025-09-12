import React, { useCallback, useId, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { InfoIcon } from '../ui/InfoIcon';
import type { FileInfo } from '../../types/types';

export interface FileUploadAreaProps {
  /** Title for the upload area */
  title: string;
  /** Placeholder text for the textarea */
  placeholder: string;
  /** Current text value */
  value: string;
  /** Callback when text changes */
  onChange: (value: string) => void;
  /** Callback when a file is selected */
  onFileSelect: (file: File) => Promise<void>;
  /** Information about the currently loaded file */
  fileInfo?: FileInfo;
  /** Whether drag and drop is active */
  isDragging: boolean;
  /** Drag enter handler */
  onDragEnter: (e: React.DragEvent) => void;
  /** Drag leave handler */
  onDragLeave: (e: React.DragEvent) => void;
  /** Drag over handler */
  onDragOver: (e: React.DragEvent) => void;
  /** Drop handler */
  onDrop: (e: React.DragEvent) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Tooltip color theme */
  tooltipColor?: 'green' | 'blue';
}

/**
 * File upload area component with drag-and-drop support and accessibility features
 * Supports both text input and file upload with comprehensive keyboard navigation
 */
export const FileUploadArea: React.FC<FileUploadAreaProps> = memo(({
  title,
  placeholder,
  value,
  onChange,
  onFileSelect,
  fileInfo,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  disabled = false,
  tooltipColor = 'green'
}) => {
  const textareaId = useId();
  const fileInputId = useId();
  const labelId = useId();

  /**
   * Handle file input change with error handling
   */
  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await onFileSelect(file);
      } catch (error) {
        console.error('Failed to process selected file:', error);
        // Clear the input to allow selecting the same file again
        e.target.value = '';
      }
    }
  }, [onFileSelect]);

  /**
   * Handle textarea value change
   */
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  /**
   * Get file type from filename
   */
  const getFileType = useCallback((filename: string): string => {
    const extension = filename.split('.').pop();
    return extension?.toUpperCase() || 'Unknown';
  }, []);

  /**
   * Format file size for display
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }, []);

  /**
   * Calculate character count display text
   */
  const characterCountText = useMemo(() => {
    const count = value.length;
    const lines = value.split('\n').length;
    return `${count.toLocaleString()} characters, ${lines.toLocaleString()} lines`;
  }, [value]);

  return (
    <Card className={isDragging ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle id={labelId}>{title}</CardTitle>
          {fileInfo && (
            <Tooltip
              content={
                <div className="space-y-2 min-w-64">
                  <div className={`font-medium ${
                    tooltipColor === 'green' ? 'text-green-200' : 'text-blue-200'
                  } mb-2`}>
                    {title} Information
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><strong>Name:</strong> {fileInfo.name}</div>
                    <div><strong>Size:</strong> {formatFileSize(fileInfo.size)}</div>
                    <div><strong>Type:</strong> {getFileType(fileInfo.name)}</div>
                    {fileInfo.lastModified && (
                      <div><strong>Modified:</strong> {fileInfo.lastModified.toLocaleString()}</div>
                    )}
                    <div><strong>Lines:</strong> {fileInfo.content.split('\n').length.toLocaleString()}</div>
                  </div>
                </div>
              }
              position="bottom"
            >
              <InfoIcon size="sm" aria-label={`${title} file information`} />
            </Tooltip>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Main textarea with drag and drop support */}
          <textarea
            id={textareaId}
            aria-labelledby={labelId}
            aria-describedby={`${textareaId}-help ${textareaId}-count`}
            className={`
              w-full h-64 p-4 border rounded-md resize-none font-mono text-sm 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
              transition-all duration-200 ease-in-out
              ${isDragging 
                ? 'border-blue-400 bg-blue-50 shadow-sm' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
            `}
            placeholder={placeholder}
            value={value}
            onChange={handleTextareaChange}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            disabled={disabled}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            aria-invalid={false}
          />

          {/* Helper text */}
          <div id={`${textareaId}-help`} className="text-xs text-gray-500">
            Drop a file here, paste text, or use the file browser below
          </div>

          {/* Footer with character count and file input */}
          <div className="flex items-center justify-between">
            <span 
              id={`${textareaId}-count`} 
              className="text-sm text-gray-500"
              aria-live="polite"
            >
              {characterCountText}
            </span>
            
            <div>
              <label htmlFor={fileInputId} className="cursor-pointer group">
                <input
                  id={fileInputId}
                  type="file"
                  className="sr-only"
                  accept="text/*,.txt,.js,.jsx,.ts,.tsx,.json,.md,.html,.css,.xml,.yaml,.yml,.log,.csv,.conf,.config,.ini,.properties"
                  onChange={handleFileInputChange}
                  disabled={disabled}
                  aria-describedby={`${fileInputId}-help`}
                />
                <span className={`
                  text-xs underline transition-colors duration-150
                  ${disabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-600 hover:text-blue-700 focus:text-blue-800 group-focus-within:ring-2 group-focus-within:ring-blue-500 group-focus-within:ring-opacity-50 rounded px-1'
                  }
                `}>
                  Browse file
                </span>
              </label>
              
              <div id={`${fileInputId}-help`} className="sr-only">
                Select a text file to upload. Supported formats include .txt, .js, .jsx, .ts, .tsx, .json, .md, .html, .css, and more.
              </div>
            </div>
          </div>

          {/* File upload status */}
          {fileInfo && (
            <div className="text-xs text-gray-600 bg-gray-50 rounded px-3 py-2 border-l-2 border-gray-300">
              <strong>Loaded:</strong> {fileInfo.name} ({formatFileSize(fileInfo.size)})
            </div>
          )}

          {/* Loading or error states could be added here */}
          {disabled && (
            <div className="text-xs text-gray-500 italic">
              Processing... Please wait.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

FileUploadArea.displayName = 'FileUploadArea';