import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { HtmlExportOptions } from '../../services/export';

/**
 * Default HTML export options
 */
const DEFAULT_HTML_EXPORT_OPTIONS: HtmlExportOptions = {
  includeLineNumbers: true,
  includeHeader: true,
  includeStats: true,
  theme: 'light',
  differencesOnly: false,
  viewMode: 'side-by-side',
  title: 'BDiff Comparison Report',
  collapseUnchanged: false,
};

interface HTMLExportDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog is closed */
  onClose: () => void;
  /** Callback when export is confirmed */
  onExport: (options: HtmlExportOptions) => void;
  /** Callback for preview functionality */
  onPreview?: (options: HtmlExportOptions) => void;
  /** Whether export is currently in progress */
  isExporting?: boolean;
  /** Suggested filename */
  suggestedFilename?: string;
  /** Initial view mode inherited from DiffViewer */
  initialViewMode?: 'side-by-side' | 'unified';
}

/**
 * Dialog component for configuring HTML export options
 */
export const HTMLExportDialog: React.FC<HTMLExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  onPreview,
  isExporting = false,
  suggestedFilename = '',
  initialViewMode
}) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<HtmlExportOptions>(DEFAULT_HTML_EXPORT_OPTIONS);

  // Sync viewMode when dialog opens with inherited value
  useEffect(() => {
    if (isOpen && initialViewMode) {
      setOptions(prev => ({ ...prev, viewMode: initialViewMode }));
    }
  }, [isOpen, initialViewMode]);
  const [editableFilename, setEditableFilename] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Extract filename without extension and extension separately
  const fileExtension = suggestedFilename.match(/\.[^.]+$/)?.[0] || '.html';
  const filenameWithoutExt = suggestedFilename.replace(/\.[^.]+$/, '');

  // Initialize editable filename when suggestedFilename changes
  useEffect(() => {
    setEditableFilename(filenameWithoutExt);
  }, [filenameWithoutExt]);

  /**
   * Update a specific export option
   */
  const updateOption = useCallback(<K extends keyof HtmlExportOptions>(
    key: K,
    value: HtmlExportOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Handle export confirmation
   */
  const handleExport = useCallback(() => {
    const exportOptions = {
      ...options,
      filename: editableFilename ? `${editableFilename}${fileExtension}` : undefined
    };
    onExport(exportOptions);
  }, [options, editableFilename, fileExtension, onExport]);

  /**
   * Handle preview
   */
  const handlePreview = useCallback(() => {
    if (!onPreview) return;

    const previewOptions = {
      ...options,
      filename: editableFilename ? `${editableFilename}${fileExtension}` : undefined
    };
    onPreview(previewOptions);
  }, [options, editableFilename, fileExtension, onPreview]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('export.html.dialogTitle')}
      size="lg"
    >
      <div className="space-y-6">
        {/* Section 1: Filename */}
        {suggestedFilename && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('export.html.outputFilename')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editableFilename}
                onChange={(e) => setEditableFilename(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="px-2 py-2 text-sm font-mono text-gray-600">
                {fileExtension}
              </span>
            </div>
          </div>
        )}

        {/* Section 2: View Mode Selection with Icons */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('export.html.viewMode.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${options.viewMode === 'side-by-side' ? 'border-blue-500 bg-blue-50' : ''}`}>
              <input
                type="radio"
                name="viewMode"
                value="side-by-side"
                checked={options.viewMode === 'side-by-side'}
                onChange={(e) => updateOption('viewMode', e.target.value as 'unified' | 'side-by-side')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <svg className="w-5 h-5 ml-3 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
              <div className="ml-2 flex-1">
                <div className="text-sm font-medium text-gray-900">{t('export.html.viewMode.sideBySide')}</div>
                <div className="text-xs text-gray-500">{t('export.html.viewMode.sideBySideDesc')}</div>
              </div>
            </label>

            <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${options.viewMode === 'unified' ? 'border-blue-500 bg-blue-50' : ''}`}>
              <input
                type="radio"
                name="viewMode"
                value="unified"
                checked={options.viewMode === 'unified'}
                onChange={(e) => updateOption('viewMode', e.target.value as 'unified' | 'side-by-side')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <svg className="w-5 h-5 ml-3 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <div className="ml-2 flex-1">
                <div className="text-sm font-medium text-gray-900">{t('export.html.viewMode.unified')}</div>
                <div className="text-xs text-gray-500">{t('export.html.viewMode.unifiedDesc')}</div>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Advanced Options (collapsible) */}
        <div>
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors"
            onClick={() => setShowAdvanced(prev => !prev)}
          >
            <span className={`text-xs transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
            {t('export.html.displayOptions.advancedTitle')}
          </button>
          {showAdvanced && (
            <div className="space-y-3 mt-3 pl-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeHeader}
                  onChange={(e) => updateOption('includeHeader', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{t('export.html.displayOptions.includeHeader')}</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeStats}
                  onChange={(e) => updateOption('includeStats', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{t('export.html.displayOptions.includeStats')}</span>
              </label>
            </div>
          )}
        </div>

        {/* Section 4: Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isExporting}
            >
              {t('export.html.buttons.cancel')}
            </Button>

            {onPreview && (
              <Button
                variant="secondary"
                onClick={handlePreview}
                disabled={isExporting}
              >
                {t('export.html.buttons.preview')}
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? t('export.html.buttons.exporting') : t('export.html.buttons.export')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
