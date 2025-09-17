import React, { useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { HtmlExportOptions, DEFAULT_HTML_EXPORT_OPTIONS } from '../../services/htmlExportService';

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
      title="📄 HTML Export Settings"
      size="lg"
    >
      <div className="space-y-6">
        {/* Filename Preview */}
        {suggestedFilename && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-900">Output Filename</div>
            <div className="text-sm text-blue-700 mt-1 font-mono">{suggestedFilename}</div>
          </div>
        )}

        {/* Custom Title */}
        <div>
          <label htmlFor="custom-title" className="block text-sm font-medium mb-2">
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
          <div className="text-xs text-gray-500 mt-1">
            If left blank, an auto-generated title will be used
          </div>
        </div>

        {/* Display Options */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">📋 Display Options</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeLineNumbers}
                  onChange={(e) => updateOption('includeLineNumbers', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">行番号を表示</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeHeader}
                  onChange={(e) => updateOption('includeHeader', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">ファイル情報のヘッダーを含める</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeStats}
                  onChange={(e) => updateOption('includeStats', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">統計情報を含める</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.differencesOnly}
                  onChange={(e) => updateOption('differencesOnly', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">差分のみ表示 (未変更行を隠す)</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Theme Selection */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">🎨 テーマ</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={options.theme === 'light'}
                  onChange={(e) => updateOption('theme', e.target.value as 'light' | 'dark')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium">☀️ ライトテーマ</div>
                  <div className="text-xs text-gray-500">印刷に最適</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={options.theme === 'dark'}
                  onChange={(e) => updateOption('theme', e.target.value as 'light' | 'dark')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium">🌙 ダークテーマ</div>
                  <div className="text-xs text-gray-500">画面閲覧に最適</div>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Export Options Summary */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">📊 設定概要</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-medium">行番号:</span> 
                <span className={options.includeLineNumbers ? 'text-green-600' : 'text-gray-500'}>
                  {options.includeLineNumbers ? '表示' : '非表示'}
                </span>
              </div>
              <div>
                <span className="font-medium">ヘッダー:</span> 
                <span className={options.includeHeader ? 'text-green-600' : 'text-gray-500'}>
                  {options.includeHeader ? '含める' : '含めない'}
                </span>
              </div>
              <div>
                <span className="font-medium">統計:</span> 
                <span className={options.includeStats ? 'text-green-600' : 'text-gray-500'}>
                  {options.includeStats ? '含める' : '含めない'}
                </span>
              </div>
              <div>
                <span className="font-medium">表示:</span> 
                <span className={options.differencesOnly ? 'text-blue-600' : 'text-gray-500'}>
                  {options.differencesOnly ? '差分のみ' : '全体'}
                </span>
              </div>
              <div>
                <span className="font-medium">テーマ:</span> 
                <span className="capitalize">{options.theme === 'light' ? 'ライト' : 'ダーク'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={isExporting}
          >
            リセット
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isExporting}
            >
              キャンセル
            </Button>
            
            {onPreview && (
              <Button
                variant="secondary"
                onClick={handlePreview}
                disabled={isExporting}
              >
                👀 プレビュー
              </Button>
            )}
            
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  エクスポート中...
                </>
              ) : (
                <>
                  💾 エクスポート
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Help text */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">💡 ヒント:</div>
            <ul className="space-y-1">
              <li>• HTMLファイルはスタンドアロンで、ブラウザで直接開けます</li>
              <li>• ライトテーマは印刷に、ダークテーマは画面閲覧に適しています</li>
              <li>• プレビュー機能で設定を確認してからエクスポートできます</li>
              <li>• ファイルサイズを小さくしたい場合は「差分のみ表示」を選択してください</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
};