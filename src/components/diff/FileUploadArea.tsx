import React, { useCallback, useId, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
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
  /** Callback when clear button is clicked */
  onClear?: () => void;
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
  onClear
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle id={labelId}>{title}</CardTitle>
          </div>
          {onClear && (value || fileInfo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={disabled}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Main textarea with drag and drop support */}
          <textarea
            id={textareaId}
            aria-labelledby={labelId}
            aria-describedby={`${textareaId}-count`}
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


          {/* Footer with character count and file input */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span 
                id={`${textareaId}-count`} 
                aria-live="polite"
              >
                {characterCountText}
              </span>
              {fileInfo && (
                <span>
                  <strong>Loaded:</strong> {fileInfo.name} ({formatFileSize(fileInfo.size)})
                </span>
              )}
            </div>
            
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