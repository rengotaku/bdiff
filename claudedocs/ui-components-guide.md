# BDiff UI Components Guide

A comprehensive set of UI components built with TypeScript, React, and Tailwind CSS, following Any.do's clean and minimal design principles.

## 🎨 Design System

### Color Scheme
- **Primary**: Blue (`#2563eb`) for main actions and branding
- **Secondary**: Gray (`#64748b`) for secondary actions
- **Diff Colors**:
  - Added: Green (`#d4f4dd` background, `#16a34a` text)
  - Removed: Red (`#fdd4d4` background, `#dc2626` text)  
  - Modified: Yellow (`#fef3c7` background, `#ca8a04` text)

### Typography
- **Font Family**: Inter for UI, JetBrains Mono for code
- **Spacing**: Consistent 4px grid system
- **Shadows**: Subtle elevation with gray shadows

## 📦 Component Categories

### Basic UI Components (`src/components/ui/`)

#### Button
Flexible button component with multiple variants and states:
```tsx
<Button variant="primary" size="default" loading={false}>
  Click Me
</Button>
```

**Variants**: primary, secondary, ghost, destructive  
**Sizes**: sm, default, lg, icon  
**Features**: Loading state, left/right icons, full accessibility

#### Card  
Container component with consistent styling:
```tsx
<Card padding="default" shadow="default">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

#### Input
Text input with label, validation, and icon support:
```tsx
<Input
  label="Email Address"
  placeholder="Enter your email"
  error="Please enter a valid email"
  leftIcon={<SearchIcon />}
  type="email"
/>
```

#### Modal
Accessible modal dialog with keyboard navigation:
```tsx
<Modal 
  isOpen={isOpen} 
  onClose={handleClose}
  title="Modal Title"
  size="default"
>
  Modal content
</Modal>
```

**Features**: Backdrop click handling, escape key closing, focus management

#### Badge
Status indicators including diff-specific variants:
```tsx
<Badge variant="success">Active</Badge>
<DiffStatsBadge added={23} removed={15} modified={8} />
```

**Variants**: default, primary, success, warning, destructive, added, removed, modified

### Common Components (`src/components/common/`)

#### LoadingSpinner
Loading indicators for various contexts:
```tsx
<LoadingSpinner size="default" color="primary" />
<LoadingOverlay isVisible={loading} message="Processing..." />
<InlineLoading message="Loading data..." />
```

#### ErrorBoundary
React error boundary with user-friendly fallback UI:
```tsx
<ErrorBoundary onError={handleError}>
  <YourComponent />
</ErrorBoundary>
```

**Features**: Development error details, retry functionality, custom fallback UI

#### Toast
Notification system with multiple types:
```tsx
// Provider setup
<ToastProvider>
  <App />
</ToastProvider>

// Usage with hook
const toast = useToastHelpers();
toast.success("Operation completed!");
toast.error("Something went wrong");
```

**Types**: success, error, warning, info  
**Features**: Auto-dismiss, action buttons, positioning

#### EmptyState
Empty state variations for different scenarios:
```tsx
<NoFilesEmptyState onUpload={handleUpload} />
<NoResultsEmptyState onClear={clearFilters} />
<ErrorEmptyState onRetry={retry} />
```

### Layout Components (`src/components/layout/`)

#### Header
Application header with navigation and actions:
```tsx
<Header
  title="BDiff"
  subtitle="File comparison tool"
  navigation={<Navigation items={navItems} />}
  actions={<HeaderActions />}
/>
```

#### PageLayout
Main layout wrapper with multiple variants:
```tsx
<PageLayout
  header={headerProps}
  sidebar={sidebarContent}
  maxWidth="2xl"
  padding="default"
>
  Page content
</PageLayout>

// Specialized layouts
<DashboardLayout navigationItems={navItems}>
<CenteredLayout>
<FullWidthLayout>
<ContentLayout title="Page Title">
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install class-variance-authority clsx tailwind-merge
```

### 2. Setup Tailwind Config
Ensure your `tailwind.config.js` includes the custom colors and fonts:
```js
theme: {
  extend: {
    colors: {
      primary: { DEFAULT: '#2563eb', hover: '#1d4ed8' },
      diff: {
        added: '#d4f4dd',
        'added-dark': '#16a34a',
        // ... other diff colors
      }
    }
  }
}
```

### 3. Import Components
```tsx
import { 
  Button, 
  Card, 
  Input, 
  ToastProvider, 
  PageLayout 
} from '@/components';
```

### 4. Wrap App with Providers
```tsx
function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <PageLayout>
          {/* Your app content */}
        </PageLayout>
      </ToastProvider>
    </ErrorBoundary>
  );
}
```

## ♿ Accessibility Features

All components follow WCAG 2.1 AA standards:

- **Keyboard Navigation**: Tab order, Enter/Space activation, Escape handling
- **Screen Reader Support**: Proper ARIA labels, roles, and descriptions  
- **Focus Management**: Visible focus indicators, focus trapping in modals
- **Color Contrast**: All text meets minimum contrast ratios
- **Semantic HTML**: Proper HTML structure and landmarks

## 🎯 Best Practices

### Component Usage
- Use semantic variants (`primary` for main actions, `secondary` for supporting actions)
- Provide loading states for async operations
- Include proper error handling and user feedback
- Follow consistent spacing and sizing patterns

### Accessibility
- Always include labels for form inputs
- Provide alt text for images and icons
- Use proper heading hierarchy
- Test with keyboard-only navigation

### Performance
- Use React.memo for heavy components
- Implement proper error boundaries
- Optimize bundle size with tree shaking

## 📱 Responsive Design

All components are mobile-first and responsive:
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Grid System**: CSS Grid and Flexbox with responsive utilities
- **Touch Targets**: Minimum 44px for interactive elements
- **Typography**: Scales appropriately across screen sizes

## 🔧 Customization

Components use Tailwind's utility classes and can be customized via:
- **CSS Variables**: Override color values
- **Tailwind Config**: Extend theme with custom values
- **Component Props**: Most styling can be overridden via className prop
- **Variants**: Use class-variance-authority for consistent variants

This component library provides a solid foundation for building the BDiff file comparison interface with modern React patterns, excellent accessibility, and a clean, professional appearance.