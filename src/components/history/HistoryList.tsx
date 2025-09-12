import React, { useMemo, useState, useCallback } from 'react';
import type { DiffHistory } from '../../types/types';
import { HistoryItem } from './HistoryItem';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface HistoryListProps {
  items: DiffHistory[];
  selectedItems: Set<string>;
  isLoading?: boolean;
  showSelection?: boolean;
  onItemSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onItemView: (item: DiffHistory) => void;
  onItemDelete: (id: string) => void;
  onItemCopy: (item: DiffHistory) => void;
  onBulkDelete?: () => void;
  onBulkExport?: () => void;
  className?: string;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  selectedItems,
  isLoading = false,
  showSelection = false,
  onItemSelect,
  onSelectAll,
  onClearSelection,
  onItemView,
  onItemDelete,
  onItemCopy,
  onBulkDelete,
  onBulkExport,
  className = ''
}) => {
  const [virtualizationEnabled, setVirtualizationEnabled] = useState(items.length > 100);
  // const [itemHeight] = useState(160); // Approximate height per item
  const [containerHeight] = useState(600); // Max container height
  
  // Calculate visible items for virtualization
  const visibleItems = useMemo(() => {
    if (!virtualizationEnabled || items.length <= 100) {
      return items;
    }

    // Simple virtualization - show first 50 items
    // In a real implementation, this would be based on scroll position
    return items.slice(0, 50);
  }, [items, virtualizationEnabled]);

  const allSelected = useMemo(() => {
    return items.length > 0 && items.every(item => selectedItems.has(item.id));
  }, [items, selectedItems]);

  const someSelected = useMemo(() => {
    return selectedItems.size > 0 && !allSelected;
  }, [selectedItems.size, allSelected]);

  const handleSelectAllToggle = useCallback(() => {
    if (allSelected || someSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  }, [allSelected, someSelected, onSelectAll, onClearSelection]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Loading skeleton */}
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-gray-200 rounded mt-1"></div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="flex gap-2">
                    <div className="h-5 bg-gray-200 rounded w-12"></div>
                    <div className="h-5 bg-gray-200 rounded w-12"></div>
                    <div className="h-5 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-400 mb-4">
          <svg 
            className="mx-auto h-16 w-16" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No history items found
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Your comparison history will appear here once you start comparing files. 
          Make sure history saving is enabled in your settings.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Bulk actions toolbar */}
      {showSelection && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) input.indeterminate = someSelected;
              }}
              onChange={handleSelectAllToggle}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              aria-label="Select all items"
            />
            <span className="text-sm text-gray-600">
              {selectedItems.size === 0 
                ? `Select items (${items.length} total)`
                : `${selectedItems.size} selected`
              }
            </span>
          </div>

          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2">
              {onBulkExport && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onBulkExport}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Export ({selectedItems.size})
                </Button>
              )}
              {onBulkDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onBulkDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete ({selectedItems.size})
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Performance info */}
      {items.length > 100 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              <strong>{items.length} items</strong> in history. 
              {virtualizationEnabled 
                ? ' Showing first 50 for performance.' 
                : ' All items loaded.'
              }
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setVirtualizationEnabled(!virtualizationEnabled)}
              className="text-blue-600 hover:bg-blue-100 text-xs"
            >
              {virtualizationEnabled ? 'Show All' : 'Enable Virtualization'}
            </Button>
          </div>
        </div>
      )}

      {/* History items */}
      <div 
        className="space-y-4"
        style={virtualizationEnabled ? { 
          maxHeight: containerHeight,
          overflowY: 'auto'
        } : undefined}
      >
        {visibleItems.map((item) => (
          <HistoryItem
            key={item.id}
            item={item}
            isSelected={selectedItems.has(item.id)}
            onSelect={onItemSelect}
            onView={onItemView}
            onDelete={onItemDelete}
            onCopy={onItemCopy}
            showSelection={showSelection}
          />
        ))}
      </div>

      {/* Load more indicator for virtualization */}
      {virtualizationEnabled && visibleItems.length < items.length && (
        <div className="text-center py-4">
          <Button
            onClick={() => setVirtualizationEnabled(false)}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
          >
            Load {items.length - visibleItems.length} more items
          </Button>
        </div>
      )}
    </div>
  );
};

export default HistoryList;