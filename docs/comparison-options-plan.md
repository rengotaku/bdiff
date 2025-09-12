# Comparison Options Implementation Plan

## Overview
Implementation of flexible comparison options for text diff functionality as described in Issue #5.

## Features to Implement

### 1. Sort Lines Before Comparison
- Sort both texts line by line before comparison
- Allows comparing content regardless of line order
- Useful for configuration files and lists

### 2. Ignore Case Differences
- Case-insensitive comparison mode
- Treat `Hello` and `hello` as identical
- Useful for code and text comparisons

### 3. Ignore Whitespace
- Ignore leading and trailing whitespace
- Treat `  text  ` and `text` as identical
- Useful for formatted code and configuration files

## Implementation Tasks

### Phase 1: Core Logic
- [ ] Create comparison options interface in types.ts
- [ ] Implement text preprocessing functions
- [ ] Add option handling to diff service

### Phase 2: UI Components
- [ ] Add option checkboxes to DiffSettingsPanel
- [ ] Create ComparisonOptions component
- [ ] Update state management for options

### Phase 3: Integration
- [ ] Apply preprocessing before diff calculation
- [ ] Update diff viewer to show options state
- [ ] Add visual indicators for active options

### Phase 4: Testing & Polish
- [ ] Test each option individually
- [ ] Test option combinations
- [ ] Add keyboard shortcuts for options
- [ ] Update documentation

## Technical Details

### Preprocessing Pipeline
1. Apply whitespace trimming (if enabled)
2. Apply case normalization (if enabled)
3. Apply line sorting (if enabled)
4. Pass to diff algorithm

### State Management
- Options stored in DiffContext
- Persisted to localStorage
- Applied before diff calculation

### UI/UX Considerations
- Options panel clearly visible
- Visual feedback when options active
- Keyboard shortcuts for quick toggle
- Status indicators in diff viewer

## Testing Strategy
- Unit tests for preprocessing functions
- Integration tests for option combinations
- E2E tests for UI interactions
- Performance tests for large files

## Timeline
- Phase 1: Core logic (Day 1)
- Phase 2: UI components (Day 2)
- Phase 3: Integration (Day 3)
- Phase 4: Testing & polish (Day 4)