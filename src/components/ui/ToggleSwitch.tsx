import React from 'react';
import { cn } from '../../utils/cn';

export interface ToggleSwitchProps {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  options,
  onChange,
  className
}) => {
  return (
    <div className={cn('inline-flex rounded-lg bg-gray-100 p-1', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
            'min-w-[80px] text-center',
            value === option.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};