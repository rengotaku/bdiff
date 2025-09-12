import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { InfoIcon } from '../ui/InfoIcon';
import type { FileInfo } from '../../types/types';

export interface FileUploadAreaProps {
  title: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onFileSelect: (file: File) => Promise<void>;
  fileInfo?: FileInfo;
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  disabled?: boolean;
  tooltipColor?: 'green' | 'blue';
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
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
  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{title}</CardTitle>
          {fileInfo && (
            <Tooltip
              content={
                <div className="space-y-2 min-w-48">
                  <div className={`font-medium ${tooltipColor === 'green' ? 'text-green-200' : 'text-blue-200'} mb-2`}>
                    {title} Information
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>Name: {fileInfo.name}</div>
                    <div>Size: {fileInfo.size.toLocaleString()} bytes</div>
                    <div>Type: {fileInfo.name.split('.').pop()?.toUpperCase() || 'Unknown'}</div>
                    <div>Modified: {fileInfo.lastModified?.toLocaleString()}</div>
                    <div>Lines: {fileInfo.content.split('\n').length.toLocaleString()}</div>
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
            ${isDragging 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          disabled={disabled}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {value.length} characters
          </span>
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept="text/*,.txt,.js,.jsx,.ts,.tsx,.json,.md,.html,.css,.xml,.yaml,.yml"
              onChange={handleFileInputChange}
              disabled={disabled}
            />
            <span className="text-xs text-blue-600 hover:text-blue-700 underline">
              Browse file
            </span>
          </label>
        </div>
      </CardContent>
    </Card>
  );
};