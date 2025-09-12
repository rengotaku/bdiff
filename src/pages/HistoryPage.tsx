import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentLayout } from '../components/layout/PageLayout';
import { HistoryList } from '../components/history/HistoryList';
import { HistorySearch } from '../components/history/HistorySearch';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Card, CardContent } from '../components/ui/Card';
import { useHistory } from '../contexts/HistoryContext';
import { useDiffContext } from '../contexts/DiffContext';
import { useToastHelpers } from '../components/common/Toast';
import type { DiffHistory, HistoryExportData } from '../types/types';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToastHelpers();
  
  const {
    historyItems,
    isLoading,
    error,
    config,
    storageStats,
    searchOptions,
    selectedItems,
    isInitialized,
    loadHistory,
    deleteSelectedItems,
    clearAllHistory,
    updateConfig,
    setSearchOptions,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    exportHistory,
    importHistory,
    getHistoryItem,
    deleteHistoryItem
  } = useHistory();

  const {
    setOriginalFile,
    setModifiedFile,
    setComparisonOptions,
    calculateDiff
  } = useDiffContext();

  // const { copyDiff } = useClipboard({
  //   onSuccess: (message) => showSuccess('コピー完了', message),
  //   onError: (error) => showError('コピー失敗', error)
  // });

  // Local state
  const [showSelection, setShowSelection] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Compute consent modal visibility based on loaded config
  // Only show when config is fully initialized and user hasn't given consent
  const showConsentModal = isInitialized && !config.userConsent;

  // Load history on mount
  useEffect(() => {
    if (config.userConsent) {
      loadHistory(searchOptions);
    }
  }, [loadHistory, searchOptions, config.userConsent]);

  // Handle search/filter changes
  const handleSearchChange = useCallback((options: typeof searchOptions) => {
    setSearchOptions(options);
  }, [setSearchOptions]);

  const handleApplySearch = useCallback(() => {
    loadHistory(searchOptions);
  }, [loadHistory, searchOptions]);

  // Handle item interactions
  const handleItemView = useCallback(async (item: DiffHistory) => {
    try {
      // Load the history item back into the main diff view
      const fullItem = await getHistoryItem(item.id);
      if (!fullItem) {
        showError('エラー', 'Failed to load history item');
        return;
      }

      // Set the files and options
      setOriginalFile({
        name: fullItem.originalFile.name,
        content: fullItem.originalFile.content,
        size: fullItem.originalFile.size
      });

      setModifiedFile({
        name: fullItem.modifiedFile.name,
        content: fullItem.modifiedFile.content,
        size: fullItem.modifiedFile.size
      });

      setComparisonOptions(fullItem.comparisonOptions);

      // Trigger diff calculation
      await calculateDiff();

      // Navigate to main page
      navigate('/');
      showSuccess('履歴読み込み完了', 'History item loaded successfully');
    } catch (error) {
      showError('エラー', 'Failed to load history item');
    }
  }, [getHistoryItem, setOriginalFile, setModifiedFile, setComparisonOptions, calculateDiff, navigate, showSuccess, showError]);

  const handleItemCopy = useCallback(async (item: DiffHistory) => {
    try {
      // Get the full item with decompressed content
      const fullItem = await getHistoryItem(item.id);
      if (!fullItem) {
        showError('エラー', 'Failed to get history item for copying');
        return;
      }

      // For now, copy basic information
      const content = `Comparison: ${fullItem.originalFile.name} vs ${fullItem.modifiedFile.name}
Date: ${fullItem.timestamp.toLocaleString()}
Similarity: ${Math.round(fullItem.diffResult.similarity)}%
Added: ${fullItem.diffResult.added} lines
Deleted: ${fullItem.diffResult.deleted} lines
Modified: ${fullItem.diffResult.modified} lines
Unchanged: ${fullItem.diffResult.unchanged} lines`;

      await navigator.clipboard.writeText(content);
      showSuccess('コピー完了', 'History item information copied to clipboard');
    } catch (error) {
      showError('コピー失敗', 'Failed to copy history item');
    }
  }, [getHistoryItem, showSuccess, showError]);

  const handleItemDelete = useCallback(async (id: string) => {
    await deleteHistoryItem(id);
    showSuccess('削除完了', 'History item deleted');
  }, [deleteHistoryItem, showSuccess]);

  // Handle bulk operations
  const handleBulkExport = useCallback(async () => {
    try {
      const selectedIds = Array.from(selectedItems);
      const exportData = await exportHistory(selectedIds);
      
      if (exportData) {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bdiff-history-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showSuccess('エクスポート完了', `${selectedIds.length} items exported`);
      }
    } catch (error) {
      showError('エクスポート失敗', 'Failed to export history');
    }
  }, [selectedItems, exportHistory, showSuccess, showError]);

  const handleBulkDelete = useCallback(() => {
    setShowBulkDeleteConfirm(true);
  }, []);

  const confirmBulkDelete = useCallback(async () => {
    await deleteSelectedItems();
    setShowBulkDeleteConfirm(false);
    setShowSelection(false);
    showSuccess('削除完了', `${selectedItems.size} items deleted`);
  }, [deleteSelectedItems, selectedItems.size, showSuccess]);

  // Handle import
  const handleImportFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImportFile(file || null);
  }, []);

  const handleImport = useCallback(async (overwrite = false) => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      const data: HistoryExportData = JSON.parse(text);
      
      const importedCount = await importHistory(data, overwrite);
      setShowImportModal(false);
      setImportFile(null);
      
      showSuccess('インポート完了', `${importedCount} items imported`);
    } catch (error) {
      showError('インポート失敗', 'Invalid import file or import failed');
    }
  }, [importFile, importHistory, showSuccess, showError]);

  // Handle user consent
  const handleConsentGrant = useCallback(async () => {
    console.log('📝 User granting consent - updating config...');
    await updateConfig({ userConsent: true });
    console.log('✅ Consent granted - history should now be active');
    showSuccess('設定保存完了', 'History saving enabled');
  }, [updateConfig, showSuccess]);

  const handleConsentDeny = useCallback(() => {
    // Just do nothing - the modal will remain visible until consent is given
    // Could add logic here to remember "not now" choice if needed
  }, []);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const confirmClearAll = useCallback(async () => {
    await clearAllHistory();
    setShowClearConfirm(false);
    showSuccess('履歴削除完了', 'All history cleared');
  }, [clearAllHistory, showSuccess]);

  return (
    <>
      <ContentLayout
        title="Comparison History"
        subtitle="View and manage your diff comparison history"
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSelection(!showSelection)}
            >
              {showSelection ? 'Cancel' : 'Select'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowImportModal(true)}
            >
              Import
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => exportHistory()}
              disabled={historyItems.length === 0}
            >
              Export All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearAll}
              disabled={historyItems.length === 0}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear All
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* User consent modal */}
          {showConsentModal && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-medium text-blue-900 mb-2">
                  Enable History Saving?
                </h3>
                <p className="text-blue-700 text-sm mb-4">
                  To use history features, we need your consent to save comparison data locally in your browser.
                  No data is sent to external servers.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleConsentGrant}>
                    Enable History
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleConsentDeny}>
                    Not Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="text-red-700">{error}</div>
              </CardContent>
            </Card>
          )}

          {/* Storage stats */}
          {storageStats && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">{storageStats.itemCount}</div>
                    <div className="text-gray-500">Items</div>
                  </div>
                  <div>
                    <div className="font-medium">
                      {(storageStats.totalSize / 1024 / 1024).toFixed(1)}MB
                    </div>
                    <div className="text-gray-500">Total Size</div>
                  </div>
                  <div>
                    <div className="font-medium">
                      {(storageStats.averageSize / 1024).toFixed(1)}KB
                    </div>
                    <div className="text-gray-500">Avg Size</div>
                  </div>
                  {storageStats.compressionRatio && (
                    <div>
                      <div className="font-medium">
                        {Math.round(storageStats.compressionRatio * 100)}%
                      </div>
                      <div className="text-gray-500">Compression</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search and filters */}
          {config.userConsent && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <HistorySearch
                  searchOptions={searchOptions}
                  onSearchChange={handleSearchChange}
                  onApplySearch={handleApplySearch}
                  itemCount={historyItems.length}
                  isLoading={isLoading}
                />
              </div>

              {/* History list */}
              <div className="lg:col-span-2">
                <HistoryList
                  items={historyItems}
                  selectedItems={selectedItems}
                  isLoading={isLoading}
                  showSelection={showSelection}
                  onItemSelect={toggleItemSelection}
                  onSelectAll={selectAllItems}
                  onClearSelection={clearSelection}
                  onItemView={handleItemView}
                  onItemDelete={handleItemDelete}
                  onItemCopy={handleItemCopy}
                  onBulkDelete={selectedItems.size > 0 ? handleBulkDelete : undefined}
                  onBulkExport={selectedItems.size > 0 ? handleBulkExport : undefined}
                />
              </div>
            </div>
          )}
        </div>
      </ContentLayout>

      {/* Modals */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All History"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete all comparison history? This action cannot be undone.
          </p>
          {storageStats && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div><strong>{storageStats.itemCount}</strong> items will be deleted</div>
              <div><strong>{(storageStats.totalSize / 1024 / 1024).toFixed(1)}MB</strong> will be freed</div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmClearAll}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear All
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        title="Delete Selected Items"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete {selectedItems.size} selected items?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowBulkDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import History"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select JSON file to import
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFileSelect}
              className="block w-full text-sm border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          {importFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="font-medium">Selected: {importFile.name}</div>
              <div className="text-gray-600">
                Size: {(importFile.size / 1024).toFixed(1)}KB
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowImportModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleImport(false)}
              disabled={!importFile}
            >
              Import (Merge)
            </Button>
            <Button
              onClick={() => handleImport(true)}
              disabled={!importFile}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Import (Replace)
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default HistoryPage;