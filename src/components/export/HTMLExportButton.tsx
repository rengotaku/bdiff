import React, { useState, useCallback } from 'react';
import { Button } from '../ui/Button';
import { HTMLExportDialog } from './HTMLExportDialog';
import { HtmlExportService, type HtmlExportOptions } from '../../services/htmlExportService';
import type { DiffResult, FileInfo } from '../../types/types';

interface HTMLExportButtonProps {
  /** The diff result to export */
  diffResult: DiffResult | null;
  /** Original file information */
  originalFile: FileInfo | null;
  /** Modified file information */
  modifiedFile: FileInfo | null;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Button size */
  size?: 'sm' | 'default' | 'lg';
  /** Custom className */
  className?: string;
  /** Success callback */
  onSuccess?: (filename: string) => void;
  /** Error callback */
  onError?: (error: string) => void;
}

/**
 * Button component for triggering HTML export with configuration dialog
 */
export const HTMLExportButton: React.FC<HTMLExportButtonProps> = ({
  diffResult,
  originalFile,
  modifiedFile,
  variant = 'secondary',
  size = 'sm',
  className,
  onSuccess,
  onError
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Check if export is possible
  const canExport = diffResult && originalFile && modifiedFile;

  /**
   * Handle opening the export dialog
   */
  const handleOpenDialog = useCallback(() => {
    if (!canExport) {
      onError?.('比較結果がありません。ファイルを比較してからエクスポートしてください。');
      return;
    }
    setIsDialogOpen(true);
  }, [canExport, onError]);

  /**
   * Handle closing the export dialog
   */
  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  /**
   * Handle export with the specified options
   */
  const handleExport = useCallback(async (options: HtmlExportOptions) => {
    if (!diffResult || !originalFile || !modifiedFile) {
      onError?.('エクスポートに必要なデータが不足しています');
      return;
    }

    setIsExporting(true);
    
    try {
      // Generate HTML content
      const htmlContent = HtmlExportService.generateHtmlDocument(
        diffResult,
        originalFile,
        modifiedFile,
        options
      );

      // Generate filename
      const filename = HtmlExportService.generateFilename(originalFile, modifiedFile);

      // Download the file
      HtmlExportService.downloadHtml(htmlContent, filename);

      // Success callback
      onSuccess?.(filename);
      
      // Close dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      onError?.(error instanceof Error ? error.message : 'エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  }, [diffResult, originalFile, modifiedFile, onSuccess, onError]);

  /**
   * Handle preview functionality
   */
  const handlePreview = useCallback(async (options: HtmlExportOptions) => {
    if (!diffResult || !originalFile || !modifiedFile) {
      onError?.('プレビューに必要なデータが不足しています');
      return;
    }

    try {
      // Generate HTML content
      const htmlContent = HtmlExportService.generateHtmlDocument(
        diffResult,
        originalFile,
        modifiedFile,
        options
      );

      // Open preview
      HtmlExportService.previewHtml(htmlContent);
    } catch (error) {
      console.error('Preview error:', error);
      onError?.(error instanceof Error ? error.message : 'プレビューの表示に失敗しました');
    }
  }, [diffResult, originalFile, modifiedFile, onError]);

  // Generate suggested filename for display
  const suggestedFilename = canExport && originalFile && modifiedFile
    ? HtmlExportService.generateFilename(originalFile, modifiedFile)
    : '';

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenDialog}
        disabled={!canExport}
        className={className}
        title={!canExport ? '比較結果がありません' : 'HTMLファイルとしてエクスポート'}
      >
        📄 HTML Export
      </Button>

      <HTMLExportDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onExport={handleExport}
        onPreview={handlePreview}
        isExporting={isExporting}
        suggestedFilename={suggestedFilename}
      />
    </>
  );
};