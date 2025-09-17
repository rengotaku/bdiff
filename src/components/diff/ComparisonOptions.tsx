import React from 'react';
import type { ComparisonOptions } from '../../types/types';

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
  const handleOptionChange = (key: keyof ComparisonOptions) => {
    onChange({
      ...options,
      [key]: !options[key]
    });
  };

  return (
    <div className="space-y-3">
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
    </div>
  );
};

export default ComparisonOptionsComponent;