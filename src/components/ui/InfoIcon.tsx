import React from 'react';
import { cn } from '../../utils/cn';

export interface InfoIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const InfoIcon: React.FC<InfoIconProps> = ({ 
  className, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <svg
      className={cn(
        'text-gray-400 hover:text-gray-600 transition-colors cursor-help',
        sizeClasses[size],
        className
      )}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
};