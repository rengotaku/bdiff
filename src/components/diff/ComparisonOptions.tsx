import React, { useState } from 'react';
import type { ComparisonOptions } from '../../types/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { InfoIcon } from '../ui/InfoIcon';
import { Tooltip } from '../ui/Tooltip';

interface ComparisonOptionsProps {
  options: ComparisonOptions;
  onChange: (options: ComparisonOptions) => void;
  disabled?: boolean;
}

/**
 * Component for selecting comparison options
 */
export const ComparisonOptionsComponent: React.FC<ComparisonOptionsProps> = ({
  options,
  onChange,
  disabled = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleOptionChange = (key: keyof ComparisonOptions) => {
    onChange({
      ...options,
      [key]: !options[key]
    });
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            Comparison Options
            <Tooltip content="Customize how text comparison is performed">
              <InfoIcon className="h-4 w-4 text-gray-400" />
            </Tooltip>
          </div>
          <button
            onClick={toggleCollapse}
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
            aria-label={isCollapsed ? "Expand comparison options" : "Collapse comparison options"}
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${
                isCollapsed ? 'rotate-0' : 'rotate-180'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </CardTitle>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={options.sortLines}
              onChange={() => handleOptionChange('sortLines')}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Sort lines before comparison"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-700 group-hover:text-gray-900">
                Sort lines before comparison
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Compare content regardless of line order
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={options.ignoreCase}
              onChange={() => handleOptionChange('ignoreCase')}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Ignore case differences"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-700 group-hover:text-gray-900">
                Ignore case differences
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Treat uppercase and lowercase as identical
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={options.ignoreWhitespace}
              onChange={() => handleOptionChange('ignoreWhitespace')}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Ignore whitespace"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-700 group-hover:text-gray-900">
                Ignore whitespace
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Ignore leading and trailing spaces
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={options.ignoreTrailingNewlines}
              onChange={() => handleOptionChange('ignoreTrailingNewlines')}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Ignore trailing newlines"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-700 group-hover:text-gray-900">
                Ignore trailing newlines
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Don't treat final empty lines as differences
              </div>
            </div>
          </label>

          {/* Active options indicator */}
          {(options.sortLines || options.ignoreCase || options.ignoreWhitespace || options.ignoreTrailingNewlines) && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-xs text-gray-600">
                  Options active - comparison modified
                </span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ComparisonOptionsComponent;