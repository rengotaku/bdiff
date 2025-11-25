import React, { useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { HtmlExportOptions } from '../../services/export';

/**
 * Default HTML export options
 */
const DEFAULT_HTML_EXPORT_OPTIONS: Required<HtmlExportOptions> = {
  includeLineNumbers: true,
  includeHeader: true,
  includeStats: true,
  theme: 'light',
  differencesOnly: false,
  viewMode: 'unified',
  title: 'BDiff Comparison Report',
  originalFile: undefined as any,
  modifiedFile: undefined as any,
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
  suggestedFilename = ''
}) => {
  const [options, setOptions] = useState<HtmlExportOptions>(DEFAULT_HTML_EXPORT_OPTIONS);
  const [customTitle, setCustomTitle] = useState('');

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
      title: customTitle || undefined
    };
    onExport(exportOptions);
  }, [options, customTitle, onExport]);

  /**
   * Handle preview
   */
  const handlePreview = useCallback(() => {
    if (!onPreview) return;

    const previewOptions = {
      ...options,
      title: customTitle || undefined
    };
    onPreview(previewOptions);
  }, [options, customTitle, onPreview]);

  /**
   * Reset to default options
   */
  const handleReset = useCallback(() => {
    setOptions(DEFAULT_HTML_EXPORT_OPTIONS);
    setCustomTitle('');
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="HTML Export Settings"
      size="lg"
    >
      <div className="space-y-6">
        {/* Section 1: Basic Settings */}
        <div className="space-y-4">
          {/* Filename */}
          {suggestedFilename && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Filename
              </label>
              <input
                type="text"
                value={suggestedFilename}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 font-mono text-sm"
              />
            </div>
          )}

          {/* Custom Title */}
          <div>
            <label htmlFor="custom-title" className="block text-sm font-medium text-gray-700 mb-2">
              Custom Title (Optional)
            </label>
            <input
              id="custom-title"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Use default title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              If left blank, an auto-generated title will be used
            </p>
          </div>
        </div>

        {/* Section 2: View Mode Selection */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">表示形式 (View Mode)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="viewMode"
                value="unified"
                checked={options.viewMode === 'unified'}
                onChange={(e) => updateOption('viewMode', e.target.value as 'unified' | 'side-by-side')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3 flex-1">
                <div className="text-sm font-medium text-gray-900">Unified</div>
                <div className="text-xs text-gray-500">1カラムの行単位表示</div>
              </div>
            </label>

            <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="viewMode"
                value="side-by-side"
                checked={options.viewMode === 'side-by-side'}
                onChange={(e) => updateOption('viewMode', e.target.value as 'unified' | 'side-by-side')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3 flex-1">
                <div className="text-sm font-medium text-gray-900">Side by Side</div>
                <div className="text-xs text-gray-500">2カラムの並列表示</div>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Options (2-column grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Display Options */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Display Options</h3>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeLineNumbers}
                  onChange={(e) => updateOption('includeLineNumbers', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">行番号を表示</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeHeader}
                  onChange={(e) => updateOption('includeHeader', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">ファイル情報のヘッダーを含める</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeStats}
                  onChange={(e) => updateOption('includeStats', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">統計情報を含める</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.differencesOnly}
                  onChange={(e) => updateOption('differencesOnly', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">差分のみ表示</span>
              </label>
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Theme</h3>
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={options.theme === 'light'}
                  onChange={(e) => updateOption('theme', e.target.value as 'light' | 'dark')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Light</div>
                  <div className="text-xs text-gray-500">印刷に最適</div>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={options.theme === 'dark'}
                  onChange={(e) => updateOption('theme', e.target.value as 'light' | 'dark')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Dark</div>
                  <div className="text-xs text-gray-500">画面閲覧に最適</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Actions */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={isExporting}
          >
            Reset
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </Button>

            {onPreview && (
              <Button
                variant="secondary"
                onClick={handlePreview}
                disabled={isExporting}
              >
                Preview
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
