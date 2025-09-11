import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../utils/cn';

export interface CollapsibleFileSelectorProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onFileSelect?: (files: { original: File | null; modified: File | null }) => void;
  onNewComparison?: () => void;
  className?: string;
}

export const CollapsibleFileSelector: React.FC<CollapsibleFileSelectorProps> = ({
  isCollapsed: controlledIsCollapsed,
  onToggle,
  onFileSelect,
  onNewComparison,
  className
}) => {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(true);
  
  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;
  const handleToggle = onToggle || (() => setInternalIsCollapsed(!internalIsCollapsed));

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [modifiedFile, setModifiedFile] = useState<File | null>(null);

  const handleFileChange = (type: 'original' | 'modified', file: File | null) => {
    if (type === 'original') {
      setOriginalFile(file);
    } else {
      setModifiedFile(file);
    }
    
    const newFiles = type === 'original' 
      ? { original: file, modified: modifiedFile }
      : { original: originalFile, modified: file };
    
    onFileSelect?.(newFiles);
  };

  const canCompare = originalFile && modifiedFile;

  return (
    <Card className={cn('mb-6', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggle}
              className="px-3"
            >
              {isCollapsed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </Button>
            <span className="text-sm font-medium text-gray-700">
              {isCollapsed ? 'Select New Files' : 'File Selection'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {canCompare && (
              <Button
                variant="primary"
                size="sm"
                onClick={onNewComparison}
              >
                Compare Files
              </Button>
            )}
            {!isCollapsed && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setOriginalFile(null);
                  setModifiedFile(null);
                  onFileSelect?.({ original: null, modified: null });
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original File Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Original File
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleFileChange('original', file);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                {originalFile && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleFileChange('original', null)}
                  >
                    ×
                  </Button>
                )}
              </div>
              {originalFile && (
                <div className="text-xs text-gray-500">
                  {originalFile.name} ({Math.round(originalFile.size / 1024)} KB)
                </div>
              )}
            </div>

            {/* Modified File Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Modified File
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleFileChange('modified', file);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                {modifiedFile && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleFileChange('modified', null)}
                  >
                    ×
                  </Button>
                )}
              </div>
              {modifiedFile && (
                <div className="text-xs text-gray-500">
                  {modifiedFile.name} ({Math.round(modifiedFile.size / 1024)} KB)
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};