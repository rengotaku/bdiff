import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
  size = 'default',
}) => {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'h-10 w-10',
      title: 'text-base',
      description: 'text-sm',
    },
    default: {
      container: 'py-12',
      icon: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-lg',
    },
  };

  const classes = sizeClasses[size];

  // Default icon if none provided
  const defaultIcon = (
    <svg
      className={cn(classes.icon, 'text-gray-300')}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  return (
    <div className={cn('flex flex-col items-center justify-center text-center', classes.container, className)}>
      <div className="flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-4">
        {icon || defaultIcon}
      </div>
      
      <h3 className={cn('font-semibold text-gray-900 mb-2', classes.title)}>
        {title}
      </h3>
      
      {description && (
        <p className={cn('text-gray-600 mb-6 max-w-md', classes.description)}>
          {description}
        </p>
      )}
      
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Pre-configured empty states for common scenarios
const NoFilesEmptyState: React.FC<Omit<EmptyStateProps, 'title' | 'icon'> & { onUpload?: () => void }> = ({
  onUpload,
  ...props
}) => {
  const icon = (
    <svg
      className="h-12 w-12 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  return (
    <EmptyState
      title="No files to compare"
      description="Upload or select files to see their differences"
      icon={icon}
      action={onUpload ? { label: 'Upload Files', onClick: onUpload } : undefined}
      {...props}
    />
  );
};

const NoResultsEmptyState: React.FC<Omit<EmptyStateProps, 'title' | 'icon'> & { onClear?: () => void }> = ({
  onClear,
  ...props
}) => {
  const icon = (
    <svg
      className="h-12 w-12 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );

  return (
    <EmptyState
      title="No results found"
      description="Try adjusting your search criteria or filters"
      icon={icon}
      action={onClear ? { label: 'Clear Filters', onClick: onClear, variant: 'secondary' } : undefined}
      {...props}
    />
  );
};

const ErrorEmptyState: React.FC<Omit<EmptyStateProps, 'title' | 'icon'> & { onRetry?: () => void }> = ({
  onRetry,
  ...props
}) => {
  const icon = (
    <svg
      className="h-12 w-12 text-red-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  );

  return (
    <EmptyState
      title="Something went wrong"
      description="We encountered an error while loading your data"
      icon={icon}
      action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
      {...props}
    />
  );
};

const LoadingEmptyState: React.FC<Omit<EmptyStateProps, 'title' | 'icon'>> = (props) => {
  const icon = (
    <svg
      className="h-12 w-12 text-gray-300 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <EmptyState
      title="Loading..."
      description="Please wait while we process your request"
      icon={icon}
      {...props}
    />
  );
};

export { EmptyState, NoFilesEmptyState, NoResultsEmptyState, ErrorEmptyState, LoadingEmptyState };