import React, { useState, useCallback } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import type { DiffHistory } from '../../types/types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { Modal } from '../ui/Modal';

interface HistoryItemProps {
  item: DiffHistory;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (item: DiffHistory) => void;
  onDelete: (id: string) => void;
  onCopy: (item: DiffHistory) => void;
  showSelection?: boolean;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({
  item,
  isSelected,
  onSelect,
  onView,
  onDelete,
  onCopy,
  showSelection = false
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSelect = useCallback(() => {
    onSelect(item.id);
  }, [onSelect, item.id]);

  const handleView = useCallback(() => {
    onView(item);
  }, [onView, item]);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(() => {
    onDelete(item.id);
    setShowDeleteConfirm(false);
  }, [onDelete, item.id]);

  const handleCopy = useCallback(() => {
    onCopy(item);
  }, [onCopy, item]);

  const getSimilarityColor = (similarity: number): string => {
    if (similarity >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (similarity >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (similarity >= 40) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getDiffTypeColor = (type: 'added' | 'removed' | 'modified'): string => {
    switch (type) {
      case 'added': return 'bg-green-50 text-green-700 border-green-200';
      case 'removed': return 'bg-red-50 text-red-700 border-red-200';
      case 'modified': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const truncateFileName = (filename: string, maxLength = 30): string => {
    if (filename.length <= maxLength) return filename;
    const extension = filename.split('.').pop() || '';
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.') || filename.length);
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4);
    return `${truncatedName}...${extension ? `.${extension}` : ''}`;
  };

  const formatTimestamp = (date: Date): string => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return format(date, 'MMM d, yyyy HH:mm');
    }
  };

  const getComparisonOptionsText = (): string => {
    const options = [];
    if (item.comparisonOptions.sortLines) options.push('Sort');
    if (item.comparisonOptions.ignoreCase) options.push('Case');
    if (item.comparisonOptions.ignoreWhitespace) options.push('Space');
    if (item.comparisonOptions.ignoreTrailingNewlines) options.push('Newlines');
    return options.length > 0 ? options.join(', ') : 'None';
  };

  return (
    <>
      <Card className={`transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Selection checkbox */}
            {showSelection && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelect}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                aria-label={`Select ${item.originalFile.name} vs ${item.modifiedFile.name}`}
              />
            )}

            <div className="flex-1 min-w-0">
              {/* Header with files and timestamp */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Tooltip content={item.originalFile.name}>
                      <span className="font-medium text-sm text-gray-900 truncate max-w-[120px]">
                        {truncateFileName(item.originalFile.name)}
                      </span>
                    </Tooltip>
                    <span className="text-gray-400">vs</span>
                    <Tooltip content={item.modifiedFile.name}>
                      <span className="font-medium text-sm text-gray-900 truncate max-w-[120px]">
                        {truncateFileName(item.modifiedFile.name)}
                      </span>
                    </Tooltip>
                  </div>
                  <Tooltip content={format(item.timestamp, 'PPpp')}>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(item.timestamp)}
                    </div>
                  </Tooltip>
                </div>

                {/* Similarity badge */}
                <Badge 
                  className={`${getSimilarityColor(item.diffResult.similarity)} font-medium px-2 py-1`}
                  size="sm"
                >
                  {Math.round(item.diffResult.similarity)}% similar
                </Badge>
              </div>

              {/* Diff statistics */}
              <div className="flex items-center gap-2 mb-2">
                {item.diffResult.added > 0 && (
                  <Badge className={getDiffTypeColor('added')} size="sm">
                    +{item.diffResult.added}
                  </Badge>
                )}
                {item.diffResult.deleted > 0 && (
                  <Badge className={getDiffTypeColor('removed')} size="sm">
                    -{item.diffResult.deleted}
                  </Badge>
                )}
                {item.diffResult.modified > 0 && (
                  <Badge className={getDiffTypeColor('modified')} size="sm">
                    ~{item.diffResult.modified}
                  </Badge>
                )}
                {item.diffResult.unchanged > 0 && (
                  <Badge className="bg-gray-50 text-gray-600 border-gray-200" size="sm">
                    ={item.diffResult.unchanged}
                  </Badge>
                )}
              </div>

              {/* Comparison options */}
              {(item.comparisonOptions.sortLines || 
                item.comparisonOptions.ignoreCase || 
                item.comparisonOptions.ignoreWhitespace || 
                item.comparisonOptions.ignoreTrailingNewlines) && (
                <div className="mb-2">
                  <Tooltip content="Comparison options used">
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                      Options: {getComparisonOptionsText()}
                    </Badge>
                  </Tooltip>
                </div>
              )}

              {/* File sizes */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span>
                  Original: {(item.originalFile.size / 1024).toFixed(1)}KB
                </span>
                <span>
                  Modified: {(item.modifiedFile.size / 1024).toFixed(1)}KB
                </span>
                {item.metadata.processingTime && (
                  <span>
                    {item.metadata.processingTime}ms
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleView}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  variant="ghost"
                >
                  View
                </Button>
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  variant="ghost"
                >
                  Copy
                </Button>
                <Button
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  variant="ghost"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete History Item"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this comparison history?
          </p>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm">
              <div className="font-medium text-gray-900">
                {item.originalFile.name} vs {item.modifiedFile.name}
              </div>
              <div className="text-gray-500">
                {formatTimestamp(item.timestamp)}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default HistoryItem;