import React, { useState } from 'react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export type CopyType = 'all' | 'added' | 'removed' | 'changed';

export interface CopyOption {
  value: CopyType;
  label: string;
  description: string;
}

export interface CopySelectProps {
  onCopy: (type: CopyType) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DEFAULT_OPTIONS: CopyOption[] = [
  {
    value: 'all',
    label: '全てコピー',
    description: '差分全体をコピー'
  },
  {
    value: 'changed',
    label: '変更のみ',
    description: '変更行のみコピー'
  },
  {
    value: 'added',
    label: '追加のみ',
    description: '追加行のみコピー'
  },
  {
    value: 'removed',
    label: '削除のみ',
    description: '削除行のみコピー'
  }
];

// Copy icon SVG
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={cn("w-4 h-4", className)} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
    />
  </svg>
);

// Chevron down icon SVG
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={cn("w-4 h-4", className)} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M19 9l-7 7-7-7" 
    />
  </svg>
);

export const CopySelect: React.FC<CopySelectProps> = ({
  onCopy,
  loading = false,
  disabled = false,
  className,
  size = 'sm'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<CopyType>('all');

  const selectedOption = DEFAULT_OPTIONS.find(opt => opt.value === selectedValue) || DEFAULT_OPTIONS[0];

  const handleSelect = (option: CopyOption) => {
    setSelectedValue(option.value);
    setIsOpen(false);
    onCopy(option.value);
  };

  const toggleDropdown = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        className={cn(
          'flex items-center gap-2',
          sizeClasses[size],
          'border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
        )}
        onClick={toggleDropdown}
        disabled={disabled}
        loading={loading}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        role="combobox"
      >
        <CopyIcon />
        <span className="whitespace-nowrap">{selectedOption.label}</span>
        <ChevronDownIcon className={cn(
          'transition-transform duration-200',
          isOpen ? 'rotate-180' : 'rotate-0'
        )} />
      </Button>

      {isOpen && (
        <div className={cn(
          'absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}>
          <div className="py-1" role="listbox">
            {DEFAULT_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                  'transition-colors duration-150',
                  option.value === selectedValue && 'bg-blue-50 text-blue-700'
                )}
                onClick={() => handleSelect(option)}
                role="option"
                aria-selected={option.value === selectedValue}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-gray-500">{option.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default CopySelect;