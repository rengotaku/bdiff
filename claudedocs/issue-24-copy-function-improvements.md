# Issue #24: Copy Function Improvements - Phase 1

## Overview
Simplified the copy functionality according to Issue #24 requirements.

## Changes Made

### 1. Removed Copy Type Selection UI
**Before**: CopySelect dropdown component with options for 'all', 'added', 'removed', 'changed'
**After**: Simple CopyButton with only "全てコピー" (Copy All) functionality

**Files Modified**:
- `src/components/diff/DiffViewer.tsx`
  - Replaced `CopySelect` with `CopyButton`
  - Changed `onCopy` prop from `(type: CopyType) => void` to `() => void`
  - Updated both `SideBySidePanel` and `UnifiedPanel` components

- `src/components/diff/FileComparisonPanel.tsx`
  - Removed `CopyType` import
  - Updated `onCopy` prop type from `(type: CopyType) => void` to `() => void`

### 2. Removed Keyboard Shortcuts
**Before**: Multiple Ctrl+C shortcuts for different copy types
- Ctrl+C: Copy all
- Ctrl+Shift+C: Copy changed
- Ctrl+Shift+A: Copy added
- Ctrl+Shift+R: Copy removed

**After**: No keyboard shortcuts - Ctrl+C now performs browser default (copy selected text)

**Files Modified**:
- `src/pages/DiffPage.tsx`
  - Removed `useKeyboardShortcuts` import
  - Removed `KeyboardShortcut` type import
  - Removed keyboard shortcuts memoization
  - Removed `useKeyboardShortcuts` hook usage
  - Simplified `handleCopy` from `(type: CopyType) => void` to `() => void`

- `src/pages/HomePage.tsx`
  - Removed `useKeyboardShortcuts` import
  - Removed `KeyboardShortcut` type import
  - Removed keyboard shortcuts memoization
  - Removed `useKeyboardShortcuts` hook usage
  - Removed `handleCopyAdded`, `handleCopyRemoved`, `handleCopyChanged` functions
  - Renamed `handleCopyAll` to `handleCopy` and simplified

### 3. Removed Toast Notifications
**Before**: Success and error toast notifications displayed after copy operations
**After**: Silent copy operations with console logging only

**Files Modified**:
- `src/pages/DiffPage.tsx`
  - Removed `useToastHelpers` import
  - Removed toast callbacks from `useClipboard` hook
  - Changed export callbacks to `console.log`/`console.error`

- `src/pages/HomePage.tsx`
  - Removed `useToastHelpers` import
  - Removed toast callbacks from `useClipboard` hook
  - Changed export callbacks to `console.log`/`console.error`
  - Removed `copyAddedLines`, `copyRemovedLines`, `copyChangedLines` from `useClipboard` destructuring

### 4. Column Copy Functionality ✅
**Before**: Individual line copy buttons (📋) appeared on hover for each diff line
**After**: All individual line copy buttons removed

**Files Modified**:
- `src/components/diff/DiffViewer.tsx`
  - Removed `onCopyLine` prop and functionality
  - Removed copy button from `DiffLineComponent`
  - Removed `showCopyButtons` prop (no longer needed)
  - Removed `useCallback` import (no longer needed)

- `src/components/diff/FileComparisonPanel.tsx`
  - Removed `onCopyLine` prop

- `src/pages/HomePage.tsx`
  - Removed `handleCopyLine` function
  - Removed `copyText` from `useClipboard` destructuring
  - Removed `formatLineForCopy` import
  - Removed `DiffLine` type import

## Behavior Changes

### Copy Functionality
1. **UI**: Single "全てコピー" button instead of dropdown selector
2. **Keyboard**: Ctrl+C now performs browser default text selection copy
3. **Feedback**: No visual feedback (toasts/modals) - silent operation
4. **Scope**: Always copies all diff lines

### User Experience
- **Simpler**: One-click copy without choosing type
- **Standard**: Ctrl+C behaves like normal text selection
- **Cleaner**: No modal/toast interruptions
- **Consistent**: Same behavior across all diff views

## Testing

### Build Status
✅ TypeScript compilation successful
✅ Vite build successful (336.74 kB gzipped: 103.69 kB)

### Manual Testing Required
- [ ] Click "全てコピー" button in unified view
- [ ] Click "全てコピー" button in side-by-side view
- [ ] Verify Ctrl+C copies selected text (browser default)
- [ ] Verify no toast/modal appears after copy
- [ ] Verify clipboard contains diff content

## Technical Details

### Dependencies Removed
- CopyType enum/type usage
- useKeyboardShortcuts hook
- Toast notification system (for copy operations)

### Dependencies Retained
- useClipboard hook (simplified usage)
- CopyButton component
- DiffFormatter for content formatting

## Follow-up Tasks
- None required - implementation complete

## Notes
- Individual line copy buttons (📋) remain functional
- Export functionality unchanged
- File upload/selection unchanged
