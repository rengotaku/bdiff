import React, { useState, useCallback, useMemo } from 'react';
import type { HistorySearchOptions, ComparisonOptions } from '../../types/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface HistorySearchProps {
  searchOptions: HistorySearchOptions;
  onSearchChange: (options: HistorySearchOptions) => void;
  onApplySearch: () => void;
  itemCount?: number;
  isLoading?: boolean;
  className?: string;
}

export const HistorySearch: React.FC<HistorySearchProps> = ({
  searchOptions,
  onSearchChange,
  onApplySearch,
  itemCount,
  isLoading = false,
  className = ''
}) => {
  const [localQuery, setLocalQuery] = useState(searchOptions.query || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localOptions, setLocalOptions] = useState<HistorySearchOptions>(searchOptions);

  const hasActiveFilters = useMemo(() => {
    return !!(
      searchOptions.query ||
      searchOptions.dateRange ||
      searchOptions.similarityRange ||
      searchOptions.comparisonOptions ||
      (searchOptions.sortBy && searchOptions.sortBy !== 'timestamp') ||
      (searchOptions.sortOrder && searchOptions.sortOrder !== 'desc')
    );
  }, [searchOptions]);

  const handleQueryChange = useCallback((value: string) => {
    setLocalQuery(value);
    setLocalOptions(prev => ({ ...prev, query: value || undefined }));
  }, []);

  const handleQuerySubmit = useCallback(() => {
    onSearchChange(localOptions);
    onApplySearch();
  }, [localOptions, onSearchChange, onApplySearch]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuerySubmit();
    }
  }, [handleQuerySubmit]);

  const handleSortChange = useCallback((sortBy: HistorySearchOptions['sortBy']) => {
    const newOptions = { ...localOptions, sortBy };
    setLocalOptions(newOptions);
    onSearchChange(newOptions);
  }, [localOptions, onSearchChange]);

  const handleSortOrderChange = useCallback(() => {
    const newOrder: 'asc' | 'desc' = localOptions.sortOrder === 'desc' ? 'asc' : 'desc';
    const newOptions = { ...localOptions, sortOrder: newOrder };
    setLocalOptions(newOptions);
    onSearchChange(newOptions);
  }, [localOptions, onSearchChange]);

  const handleDateRangeChange = useCallback((field: 'start' | 'end', value: string) => {
    if (!value) {
      // Remove date range if either field is cleared
      const newOptions = { ...localOptions };
      delete newOptions.dateRange;
      setLocalOptions(newOptions);
      onSearchChange(newOptions);
      return;
    }

    const date = new Date(value);
    const dateRange = localOptions.dateRange || { 
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date() 
    };
    
    const newOptions = {
      ...localOptions,
      dateRange: {
        ...dateRange,
        [field]: date
      }
    };
    setLocalOptions(newOptions);
    onSearchChange(newOptions);
  }, [localOptions, onSearchChange]);

  const handleSimilarityRangeChange = useCallback((field: 'min' | 'max', value: number) => {
    const similarityRange = localOptions.similarityRange || { min: 0, max: 100 };
    const newOptions = {
      ...localOptions,
      similarityRange: {
        ...similarityRange,
        [field]: value
      }
    };
    setLocalOptions(newOptions);
    onSearchChange(newOptions);
  }, [localOptions, onSearchChange]);

  const handleComparisonOptionFilter = useCallback((
    option: keyof ComparisonOptions, 
    value: boolean | undefined
  ) => {
    const comparisonOptions = localOptions.comparisonOptions || {};
    
    if (value === undefined) {
      // Remove the filter for this option
      const { [option]: _, ...rest } = comparisonOptions;
      const newOptions = {
        ...localOptions,
        comparisonOptions: Object.keys(rest).length > 0 ? rest : undefined
      };
      setLocalOptions(newOptions);
      onSearchChange(newOptions);
    } else {
      const newOptions = {
        ...localOptions,
        comparisonOptions: {
          ...comparisonOptions,
          [option]: value
        }
      };
      setLocalOptions(newOptions);
      onSearchChange(newOptions);
    }
  }, [localOptions, onSearchChange]);

  const handleClearFilters = useCallback(() => {
    const clearedOptions: HistorySearchOptions = {
      sortBy: 'timestamp',
      sortOrder: 'desc'
    };
    setLocalOptions(clearedOptions);
    setLocalQuery('');
    onSearchChange(clearedOptions);
  }, [onSearchChange]);

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Search & Filter
            {itemCount !== undefined && (
              <span className="text-gray-500 font-normal ml-2">
                ({itemCount} items)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                Filtered
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search query */}
        <div className="flex gap-2">
          <Input
            placeholder="Search file names or content..."
            value={localQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleQuerySubmit}
            disabled={isLoading}
            size="sm"
          >
            Search
          </Button>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Sort by:</span>
          <div className="flex items-center gap-1">
            {(['timestamp', 'similarity', 'originalFile', 'modifiedFile'] as const).map((option) => (
              <Button
                key={option}
                size="sm"
                variant={localOptions.sortBy === option ? 'primary' : 'ghost'}
                onClick={() => handleSortChange(option)}
                className="text-xs px-2 py-1"
              >
                {option === 'timestamp' ? 'Date' : 
                 option === 'similarity' ? 'Similarity' :
                 option === 'originalFile' ? 'Original' : 'Modified'}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSortOrderChange}
              className="text-xs px-2 py-1"
            >
              {localOptions.sortOrder === 'desc' ? '↓' : '↑'}
            </Button>
          </div>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-gray-200">
            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From date</label>
                <Input
                  type="date"
                  value={localOptions.dateRange ? formatDateForInput(localOptions.dateRange.start) : ''}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To date</label>
                <Input
                  type="date"
                  value={localOptions.dateRange ? formatDateForInput(localOptions.dateRange.end) : ''}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Similarity range */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">
                Similarity range: {localOptions.similarityRange?.min || 0}% - {localOptions.similarityRange?.max || 100}%
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={localOptions.similarityRange?.min || 0}
                  onChange={(e) => handleSimilarityRangeChange('min', parseInt(e.target.value))}
                  className="text-sm"
                />
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={localOptions.similarityRange?.max || 100}
                  onChange={(e) => handleSimilarityRangeChange('max', parseInt(e.target.value))}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Comparison options filter */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">Filter by comparison options</label>
              <div className="grid grid-cols-2 gap-2">
                {(['sortLines', 'ignoreCase', 'ignoreWhitespace', 'ignoreTrailingNewlines'] as const).map((option) => (
                  <div key={option} className="flex items-center gap-2">
                    <select
                      value={
                        localOptions.comparisonOptions?.[option] === undefined ? 'any' :
                        localOptions.comparisonOptions[option] ? 'enabled' : 'disabled'
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        handleComparisonOptionFilter(
                          option,
                          value === 'any' ? undefined : value === 'enabled'
                        );
                      }}
                      className="text-xs border border-gray-300 rounded px-1 py-0.5"
                    >
                      <option value="any">Any</option>
                      <option value="enabled">On</option>
                      <option value="disabled">Off</option>
                    </select>
                    <span className="text-xs text-gray-600">
                      {option === 'sortLines' ? 'Sort' :
                       option === 'ignoreCase' ? 'Case' :
                       option === 'ignoreWhitespace' ? 'Space' : 'Newlines'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-gray-200">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearFilters}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistorySearch;