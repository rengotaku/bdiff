import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  navigation?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title = 'BDiff',
  subtitle,
  actions,
  navigation,
  className,
  sticky = false,
}) => {
  return (
    <header
      className={cn(
        'bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8',
        sticky && 'sticky top-0 z-40',
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        {/* Main header content */}
        <div className="flex items-center justify-between h-12">
          {/* Left side - Logo and title */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-end gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">{title}</h1>
              {subtitle && (
                <p className="text-xs text-gray-light">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Center - Navigation (if provided) */}
          {navigation && (
            <div className="hidden md:block">
              {navigation}
            </div>
          )}

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            {actions}
            <LanguageSwitcher />
            <a
              href="https://github.com/rengotaku/bdiff"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="GitHub Repository"
            >
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Mobile navigation (if provided) */}
        {navigation && (
          <div className="md:hidden border-t border-gray-200 py-3">
            {navigation}
          </div>
        )}
      </div>
    </header>
  );
};

// Navigation component for use in header
interface NavigationProps {
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    active?: boolean;
    disabled?: boolean;
  }>;
  variant?: 'pills' | 'underline';
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({
  items,
  variant = 'underline',
  className,
}) => {
  const baseClasses = 'flex space-x-1';
  
  const variantClasses = {
    pills: '',
    underline: 'border-b border-gray-200',
  };

  const itemClasses = {
    pills: {
      base: 'px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
      active: 'bg-primary text-white',
      inactive: 'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
      disabled: 'text-gray-400 cursor-not-allowed',
    },
    underline: {
      base: 'px-3 py-2 text-sm font-medium border-b-2 transition-all duration-200',
      active: 'border-primary text-primary',
      inactive: 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300',
      disabled: 'border-transparent text-gray-400 cursor-not-allowed',
    },
  };

  const classes = itemClasses[variant];

  return (
    <nav className={cn(baseClasses, variantClasses[variant], className)}>
      {items.map((item, index) => {
        const itemClassName = cn(
          classes.base,
          item.active ? classes.active : classes.inactive,
          item.disabled && classes.disabled
        );

        if (item.href && !item.disabled) {
          return (
            <a
              key={index}
              href={item.href}
              className={itemClassName}
            >
              {item.label}
            </a>
          );
        }

        return (
          <button
            key={index}
            type="button"
            onClick={item.onClick}
            disabled={item.disabled}
            className={itemClassName}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

// Breadcrumb component for header
interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <svg
                  className="flex-shrink-0 h-4 w-4 text-gray-300 mx-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              
              {isLast ? (
                <span className="text-sm font-medium text-gray-500" aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Header action components
interface HeaderActionsProps {
  children: React.ReactNode;
  className?: string;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({ children, className }) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {children}
    </div>
  );
};

// User menu component for header
interface UserMenuProps {
  user?: {
    name: string;
    email?: string;
    avatar?: string;
  };
  menuItems?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'destructive';
  }>;
  className?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({
  user,
  menuItems = [],
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!user) {
    return (
      <Button variant="primary" size="sm">
        Sign In
      </Button>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        {user.avatar ? (
          <img
            className="h-6 w-6 rounded-full"
            src={user.avatar}
            alt={user.name}
          />
        ) : (
          <div className="h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium">{user.name}</span>
        <svg
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
            {menuItems.map((item, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  'flex w-full items-center px-4 py-2 text-sm text-left transition-colors',
                  item.variant === 'destructive'
                    ? 'text-red-700 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export { Header, Navigation, Breadcrumb, HeaderActions, UserMenu };