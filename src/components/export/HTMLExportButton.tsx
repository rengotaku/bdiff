import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { HTMLExportDialog } from './HTMLExportDialog';
import { ExportService, type HtmlExportOptions } from '../../services/export';
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
  variant = 'ghost',
  size = 'sm',
  className,
  onSuccess,
  onError
}) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Check if export is possible
  const canExport = diffResult && originalFile && modifiedFile;

  /**
   * Handle opening the export dialog
   */
  const handleOpenDialog = useCallback(() => {
    if (!canExport) {
      onError?.(t('export.html.noResultsMessage'));
      return;
    }
    setIsDialogOpen(true);
  }, [canExport, onError, t]);

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
      onError?.('Missing required data for export');
      return;
    }

    setIsExporting(true);

    try {
      // Prepare export options with file information
      const exportOptions: HtmlExportOptions = {
        ...options,
        originalFile,
        modifiedFile,
      };

      // Export and download using new ExportService
      ExportService.exportAndDownload(diffResult.lines, 'html', exportOptions);

      // Generate filename for success callback
      const filename = options.filename || ExportService.generateFilename(originalFile, modifiedFile, 'html');

      // Success callback
      onSuccess?.(filename);

      // Close dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      onError?.(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [diffResult, originalFile, modifiedFile, onSuccess, onError]);

  /**
   * Handle preview functionality
   */
  const handlePreview = useCallback(async (options: HtmlExportOptions) => {
    if (!diffResult || !originalFile || !modifiedFile) {
      onError?.('Missing required data for preview');
      return;
    }

    try {
      // Prepare export options with file information
      const exportOptions: HtmlExportOptions = {
        ...options,
        originalFile,
        modifiedFile,
      };

      // Export and preview using new ExportService
      ExportService.exportHtmlAndPreview(diffResult.lines, exportOptions);
    } catch (error) {
      console.error('Preview error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to display preview');
    }
  }, [diffResult, originalFile, modifiedFile, onError]);

  // Generate suggested filename for display
  const suggestedFilename = canExport && originalFile && modifiedFile
    ? ExportService.generateFilename(originalFile, modifiedFile, 'html')
    : '';

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenDialog}
        disabled={!canExport}
        className={className}
        title={!canExport ? t('export.html.noResults') : t('export.html.buttonTooltip')}
      >
        {t('export.html.buttonLabel')}
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