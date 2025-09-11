import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  "inline-flex items-center rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        primary: "bg-primary text-white",
        secondary: "bg-gray-100 text-gray-900",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        destructive: "bg-red-100 text-red-800",
        outline: "border border-gray-200 text-gray-900",
        // Diff-specific variants
        added: "bg-diff-added text-diff-added-dark",
        removed: "bg-diff-removed text-diff-removed-dark",
        modified: "bg-diff-modified text-diff-modified-dark",
      },
      size: {
        default: "px-2.5 py-0.5",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  count?: number;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, count, children, ...props }, ref) => {
    const content = count !== undefined ? count.toString() : children;
    
    return (
      <div
        className={cn(badgeVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {icon && <span className="mr-1 h-3 w-3">{icon}</span>}
        {content}
      </div>
    );
  }
);

Badge.displayName = "Badge";

// Specific badge components for diff stats
interface DiffBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  count: number;
  showZero?: boolean;
}

const AddedBadge: React.FC<DiffBadgeProps> = ({ count, showZero = false, ...props }) => {
  if (count === 0 && !showZero) return null;
  
  return (
    <Badge variant="added" {...props}>
      +{count}
    </Badge>
  );
};

const RemovedBadge: React.FC<DiffBadgeProps> = ({ count, showZero = false, ...props }) => {
  if (count === 0 && !showZero) return null;
  
  return (
    <Badge variant="removed" {...props}>
      -{count}
    </Badge>
  );
};

const ModifiedBadge: React.FC<DiffBadgeProps> = ({ count, showZero = false, ...props }) => {
  if (count === 0 && !showZero) return null;
  
  return (
    <Badge variant="modified" {...props}>
      ~{count}
    </Badge>
  );
};

// Composite component for showing diff stats
interface DiffStatsBadgeProps {
  added: number;
  removed: number;
  modified: number;
  className?: string;
  showZero?: boolean;
}

const DiffStatsBadge: React.FC<DiffStatsBadgeProps> = ({
  added,
  removed,
  modified,
  className,
  showZero = false,
}) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <AddedBadge count={added} showZero={showZero} />
      <RemovedBadge count={removed} showZero={showZero} />
      <ModifiedBadge count={modified} showZero={showZero} />
    </div>
  );
};

export { Badge, badgeVariants, AddedBadge, RemovedBadge, ModifiedBadge, DiffStatsBadge };