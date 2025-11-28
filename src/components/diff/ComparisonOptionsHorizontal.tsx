import React from 'react';
import type { ComparisonOptions } from '../../types/types';

interface ComparisonOptionsHorizontalProps {
  options: ComparisonOptions;
  onChange: (options: ComparisonOptions) => void;
  disabled?: boolean;
}

/**
 * Horizontal layout component for comparison options
 */
export const ComparisonOptionsHorizontal: React.FC<ComparisonOptionsHorizontalProps> = ({
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

  const optionsList = [
    {
      key: 'sortLines' as const,
      label: 'Sort lines',
      description: 'Compare regardless of line order'
    },
    {
      key: 'ignoreCase' as const,
      label: 'Ignore case',
      description: 'Uppercase and lowercase identical'
    },
    {
      key: 'ignoreWhitespace' as const,
      label: 'Ignore whitespace',
      description: 'Ignore leading/trailing spaces'
    },
    {
      key: 'ignoreTrailingNewlines' as const,
      label: 'Ignore trailing newlines',
      description: 'Ignore final empty lines'
    }
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {optionsList.map(({ key, label, description }) => (
        <label
          key={key}
          className="flex items-center gap-2 cursor-pointer group"
          title={description}
        >
          <input
            type="checkbox"
            checked={options[key]}
            onChange={() => handleOptionChange(key)}
            disabled={disabled}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={label}
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900 select-none">
            {label}
          </span>
        </label>
      ))}
    </div>
  );
};
