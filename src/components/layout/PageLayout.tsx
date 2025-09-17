import React from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Header, HeaderProps, Navigation } from './Header';

export interface PageLayoutProps {
  children: React.ReactNode;
  header?: HeaderProps | React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'default' | 'lg';
  background?: 'white' | 'gray' | 'transparent';
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  header,
  sidebar,
  footer,
  className,
  containerClassName,
  maxWidth = 'full',
  padding = 'default',
  background = 'gray',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-2 sm:p-4',
    default: 'p-4 sm:p-6 lg:p-8',
    lg: 'p-6 sm:p-8 lg:p-12',
  };

  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    transparent: 'bg-transparent',
  };

  const renderHeader = () => {
    if (!header) return null;
    
    if (React.isValidElement(header)) {
      return header;
    }
    
    return <Header {...(header as HeaderProps)} />;
  };

  return (
    <div className={cn('min-h-screen flex flex-col', backgroundClasses[background], className)}>
      {/* Header */}
      {renderHeader()}

      {/* Main layout */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        {sidebar && (
          <aside className="hidden lg:flex lg:flex-shrink-0">
            <div className="flex flex-col w-64">
              <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
                {sidebar}
              </div>
            </div>
          </aside>
        )}

        {/* Main content area */}
        <main className="flex-1 overflow-hidden">
          <div className={cn(maxWidthClasses[maxWidth], 'mx-auto', paddingClasses[padding], containerClassName)}>
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="flex-shrink-0">
          {footer}
        </footer>
      )}
    </div>
  );
};

// Specific layout variants for common page types

// Dashboard layout with sidebar navigation
interface DashboardLayoutProps extends Omit<PageLayoutProps, 'sidebar'> {
  navigationItems?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    active?: boolean;
    badge?: string | number;
  }>;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  navigationItems = [],
  sidebarHeader,
  sidebarFooter,
  ...props
}) => {
  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      {sidebarHeader && (
        <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200">
          {sidebarHeader}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item, index) => {
          const baseClasses = 'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200';
          const activeClasses = 'bg-primary text-white';
          const inactiveClasses = 'text-gray-700 hover:bg-gray-100 hover:text-gray-900';
          
          const itemClasses = cn(
            baseClasses,
            item.active ? activeClasses : inactiveClasses
          );

          const content = (
            <>
              {item.icon && (
                <span className="mr-3 flex-shrink-0 h-5 w-5">{item.icon}</span>
              )}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  'ml-3 inline-block py-0.5 px-2 text-xs rounded-full',
                  item.active 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'bg-gray-100 text-gray-600'
                )}>
                  {item.badge}
                </span>
              )}
            </>
          );

          if (item.href) {
            return (
              <a key={index} href={item.href} className={itemClasses}>
                {content}
              </a>
            );
          }

          return (
            <button
              key={index}
              type="button"
              onClick={item.onClick}
              className={itemClasses}
            >
              {content}
            </button>
          );
        })}
      </nav>

      {/* Sidebar footer */}
      {sidebarFooter && (
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
          {sidebarFooter}
        </div>
      )}
    </div>
  );

  return <PageLayout {...props} sidebar={sidebar} />;
};

// Centered layout for forms and simple pages
const CenteredLayout: React.FC<PageLayoutProps> = (props) => {
  return (
    <PageLayout
      {...props}
      maxWidth="lg"
      background="gray"
      className={cn('items-center justify-center', props.className)}
      containerClassName={cn('flex items-center justify-center min-h-[calc(100vh-4rem)]', props.containerClassName)}
    />
  );
};

// Full-width layout for data-heavy pages
const FullWidthLayout: React.FC<PageLayoutProps> = (props) => {
  return (
    <PageLayout
      {...props}
      maxWidth="full"
      padding="sm"
      background="white"
    />
  );
};

// Content layout with proper typography spacing
interface ContentLayoutProps extends PageLayoutProps {
  title?: string;
  subtitle?: string;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
}

const ContentLayout: React.FC<ContentLayoutProps> = ({
  title,
  subtitle,
  breadcrumb,
  actions,
  children,
  ...props
}) => {
  const location = useLocation();
  
  // Navigation items for the app
  const navigationItems = [
    {
      label: 'Compare',
      href: '/',
      active: location.pathname === '/'
    }
  ];

  const header = {
    title: title || 'BDiff',
    subtitle,
    actions,
    navigation: <Navigation items={navigationItems} variant="underline" />
  };

  return (
    <PageLayout {...props} maxWidth="2xl" header={header}>
      {/* Page header */}
      {breadcrumb && (
        <div className="mb-6">{breadcrumb}</div>
      )}
      
      {/* Main content */}
      <div className="space-y-6">
        {children}
      </div>
    </PageLayout>
  );
};

export { 
  PageLayout, 
  DashboardLayout, 
  CenteredLayout, 
  FullWidthLayout, 
  ContentLayout 
};