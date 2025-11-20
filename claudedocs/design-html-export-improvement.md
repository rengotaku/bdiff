# HTML Export Improvement Design Document

**Issue**: #30 - エクスポートするHTMLの改良 (HTML Export Improvement)
**Created**: 2025-11-21
**Status**: Design Phase

## 📋 Requirements

### Primary Goals
1. **Visual Consistency**: Make exported HTML appearance match the application's visual design
2. **View Mode Selection**: Allow users to choose between Unified and Side-by-Side views for export

### User Story
> As a user comparing files, I want to export the diff visualization to HTML with the same visual appearance as the application, and choose between Unified or Side-by-Side view formats, so that I can share and reference the comparison results in a format that matches my workflow.

## 🎯 Current State Analysis

### Existing Implementation
- **Location**: `src/services/htmlExportService.ts`
- **Current View**: Unified view only (line-by-line diff)
- **Style System**: Custom CSS embedded in HTML export
- **Export Options**:
  - Include line numbers
  - Include header metadata
  - Include statistics
  - Theme selection (light/dark)
  - Differences-only mode

### Gap Analysis
| Feature | Current | Required | Gap |
|---------|---------|----------|-----|
| Visual consistency | Custom styles | App-matched styles | High |
| View mode | Unified only | Unified + Side-by-Side | High |
| Layout system | Custom CSS | Tailwind-like responsive | Medium |
| Color scheme | Basic colors | App color palette | Medium |
| Interactive elements | None | Optional view switcher | Low |

## 🏗️ Architecture Design

### Component Structure

```
HTMLExportService (Enhanced)
├── View Mode Support
│   ├── generateUnifiedView()
│   ├── generateSideBySideView()
│   └── generateHybridView() [optional]
├── Style System
│   ├── getApplicationStyles()
│   ├── getUnifiedStyles()
│   └── getSideBySideStyles()
└── Export Options
    ├── viewMode: 'unified' | 'side-by-side'
    ├── includeViewSwitcher: boolean [optional]
    └── [existing options...]
```

### Data Flow

```
User Action (Export)
    ↓
HTMLExportDialog
    ├── Select View Mode
    ├── Configure Options
    └── Confirm Export
    ↓
HTMLExportButton
    ↓
HtmlExportService.generateHtmlDocument()
    ├── Apply View Mode
    │   ├── Unified → Single column layout
    │   └── Side-by-Side → Two column layout
    ├── Inject Application Styles
    └── Generate HTML
    ↓
Download/Preview
```

## 📐 Technical Specification

### 1. Enhanced Export Options Interface

```typescript
export interface HtmlExportOptions {
  // Existing options
  includeLineNumbers: boolean;
  includeHeader: boolean;
  includeStats: boolean;
  theme: 'light' | 'dark';
  title?: string;
  differencesOnly: boolean;

  // NEW: View mode selection
  viewMode: 'unified' | 'side-by-side';

  // OPTIONAL: Interactive view switcher in exported HTML
  includeViewSwitcher?: boolean;
}

export const DEFAULT_HTML_EXPORT_OPTIONS: HtmlExportOptions = {
  includeLineNumbers: true,
  includeHeader: true,
  includeStats: true,
  theme: 'light',
  differencesOnly: false,
  viewMode: 'unified', // Default to unified for backward compatibility
  includeViewSwitcher: false, // Phase 2 feature
};
```

### 2. View Mode Rendering Strategy

#### Unified View (Current - Enhanced)
```typescript
private static generateUnifiedView(
  lines: DiffLine[],
  options: HtmlExportOptions
): string {
  // Current implementation enhanced with application styles
  // Single column, line-by-line diff
  // Each line shows: [symbol] [line#] [content]
}
```

#### Side-by-Side View (New)
```typescript
private static generateSideBySideView(
  lines: DiffLine[],
  options: HtmlExportOptions
): string {
  // Two-column layout matching DiffViewer component
  // Left panel: Original (removed/unchanged)
  // Right panel: Modified (added/unchanged)
  // Aligned by line pairs
}
```

### 3. Style System Integration

#### Application Color Palette Extraction
```typescript
// Map application Tailwind classes to CSS variables
const APP_COLORS = {
  // Background colors
  'bg-green-50': '#f0fdf4',
  'bg-green-100': '#dcfce7',
  'bg-red-50': '#fef2f2',
  'bg-red-100': '#fee2e2',
  'bg-yellow-50': '#fefce8',
  'bg-yellow-100': '#fef3c7',
  'bg-gray-50': '#f9fafb',
  'bg-gray-100': '#f3f4f6',

  // Border colors
  'border-green-200': '#bbf7d0',
  'border-red-200': '#fecaca',
  'border-yellow-200': '#fde047',
  'border-gray-200': '#e5e7eb',

  // Text colors
  'text-green-700': '#15803d',
  'text-red-700': '#b91c1c',
  'text-yellow-700': '#a16207',
  'text-gray-600': '#4b5563',
};
```

#### Unified View Styles
```css
/* Enhanced unified view matching application */
.diff-line {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.875rem;
  line-height: 1.25rem;
  border-left: 3px solid transparent;
  transition: background-color 150ms;
}

.diff-line-added {
  background-color: var(--green-50);
  border-left-color: var(--green-500);
  color: var(--green-700);
}

.diff-line-removed {
  background-color: var(--red-50);
  border-left-color: var(--red-500);
  color: var(--red-700);
}

.diff-line-modified {
  background-color: var(--yellow-50);
  border-left-color: var(--yellow-500);
  color: var(--yellow-700);
}

.diff-line-unchanged {
  background-color: var(--gray-50);
  color: var(--gray-600);
}
```

#### Side-by-Side View Styles
```css
/* Two-column layout for side-by-side view */
.side-by-side-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.side-panel {
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  overflow: hidden;
}

.side-panel-header {
  padding: 0.75rem 1rem;
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  font-size: 0.875rem;
}

.side-panel-content {
  max-height: 600px;
  overflow-y: auto;
}

.side-line {
  display: flex;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5rem;
  min-height: 1.5rem;
}

.side-line.removed {
  background-color: var(--red-50);
  color: var(--red-700);
}

.side-line.added {
  background-color: var(--green-50);
  color: var(--green-700);
}

.side-line.modified {
  background-color: var(--yellow-50);
  color: var(--yellow-700);
}

.side-line.unchanged {
  background-color: var(--gray-50);
  color: var(--gray-600);
}

/* Responsive: stack on mobile */
@media (max-width: 768px) {
  .side-by-side-container {
    grid-template-columns: 1fr;
  }
}
```

### 4. Line Pairing Algorithm for Side-by-Side

```typescript
interface LinePair {
  original: DiffLine | null;
  modified: DiffLine | null;
  pairType: 'unchanged' | 'modified' | 'added' | 'removed';
}

private static pairLinesForSideBySide(lines: DiffLine[]): LinePair[] {
  const pairs: LinePair[] = [];
  let originalIndex = 0;
  let modifiedIndex = 0;

  const originalLines = lines.filter(l => l.type !== 'added');
  const modifiedLines = lines.filter(l => l.type !== 'removed');

  while (originalIndex < originalLines.length || modifiedIndex < modifiedLines.length) {
    const origLine = originalLines[originalIndex];
    const modLine = modifiedLines[modifiedIndex];

    if (origLine && modLine && origLine.type === 'unchanged' && modLine.type === 'unchanged') {
      // Both unchanged - pair them
      pairs.push({
        original: origLine,
        modified: modLine,
        pairType: 'unchanged'
      });
      originalIndex++;
      modifiedIndex++;
    } else if (origLine && modLine && origLine.type === 'modified' && modLine.type === 'modified') {
      // Both modified - pair them
      pairs.push({
        original: origLine,
        modified: modLine,
        pairType: 'modified'
      });
      originalIndex++;
      modifiedIndex++;
    } else if (origLine && origLine.type === 'removed') {
      // Removed line - no pair on right
      pairs.push({
        original: origLine,
        modified: null,
        pairType: 'removed'
      });
      originalIndex++;
    } else if (modLine && modLine.type === 'added') {
      // Added line - no pair on left
      pairs.push({
        original: null,
        modified: modLine,
        pairType: 'added'
      });
      modifiedIndex++;
    } else {
      // Fallback: advance both
      pairs.push({
        original: origLine || null,
        modified: modLine || null,
        pairType: 'unchanged'
      });
      if (origLine) originalIndex++;
      if (modLine) modifiedIndex++;
    }
  }

  return pairs;
}
```

## 🔧 Implementation Plan

### Phase 1: Core View Mode Support (This Issue)

#### Step 1: Update Export Options
- [ ] Extend `HtmlExportOptions` interface with `viewMode` field
- [ ] Update `DEFAULT_HTML_EXPORT_OPTIONS` with default view mode
- [ ] Add view mode validation

#### Step 2: Implement Side-by-Side Rendering
- [ ] Create `generateSideBySideView()` method
- [ ] Implement line pairing algorithm
- [ ] Generate two-column HTML structure
- [ ] Add side-by-side specific CSS

#### Step 3: Update Export Dialog UI
- [ ] Add view mode selector (Radio buttons or Tabs)
- [ ] Update preview functionality to support both views
- [ ] Add helpful tooltips explaining view modes

#### Step 4: Style System Enhancement
- [ ] Extract application color palette
- [ ] Create CSS variables matching application theme
- [ ] Update unified view styles for consistency
- [ ] Implement responsive layout for side-by-side

#### Step 5: Testing & Validation
- [ ] Test unified view with new styles
- [ ] Test side-by-side view rendering
- [ ] Test with various diff sizes (small, medium, large)
- [ ] Test responsive behavior on mobile
- [ ] Test both light and dark themes
- [ ] Test print styles for both views

### Phase 2: Interactive View Switcher (Future Enhancement)

```typescript
// Optional: Add JavaScript to toggle views in exported HTML
private static generateViewSwitcherScript(): string {
  return `
    <script>
    function toggleView() {
      const unified = document.getElementById('unified-view');
      const sideBySide = document.getElementById('side-by-side-view');
      const button = document.getElementById('view-toggle');

      if (unified.style.display === 'none') {
        unified.style.display = 'block';
        sideBySide.style.display = 'none';
        button.textContent = 'Switch to Side-by-Side';
      } else {
        unified.style.display = 'none';
        sideBySide.style.display = 'grid';
        button.textContent = 'Switch to Unified';
      }
    }
    </script>
  `;
}
```

## 📊 UI Mockup

### Export Dialog Enhancement

```
┌────────────────────────────────────────┐
│  Export to HTML                      │
├────────────────────────────────────────┤
│                                        │
│  View Mode:                            │
│  ○ Unified      ● Side by Side        │
│                                        │
│  Options:                              │
│  ☑ Include line numbers                │
│  ☑ Include header                      │
│  ☑ Include statistics                  │
│  ☐ Differences only                    │
│                                        │
│  Theme:                                │
│  ● Light       ○ Dark                  │
│                                        │
│  [ Preview ]  [ Cancel ]  [ Export ]   │
└────────────────────────────────────────┘
```

### Exported HTML - Unified View

```
┌─────────────────────────────────────────────┐
│  📄 BDiff Comparison Report                 │
│  Generated: 2025-11-21 15:30:00            │
├─────────────────────────────────────────────┤
│  📊 Statistics                              │
│  +15   -8   ~12   =256   89% Similar       │
├─────────────────────────────────────────────┤
│  🔄 Comparison Result                       │
│                                             │
│  1:   function calculate() {                │
│  2: -   return price * 0.1;                │
│  3: +   return price * tax;                │
│  4: ~   return total;                       │
│  5:   }                                      │
└─────────────────────────────────────────────┘
```

### Exported HTML - Side by Side View

```
┌─────────────────────────────────────────────┐
│  📄 BDiff Comparison Report                 │
│  Generated: 2025-11-21 15:30:00            │
├─────────────────────────────────────────────┤
│  📊 Statistics                              │
│  +15   -8   ~12   =256   89% Similar       │
├─────────────────────────────────────────────┤
│  🔄 Comparison Result                       │
│                                             │
│  ┌──────────────┬──────────────┐           │
│  │   Original   │   Modified   │           │
│  ├──────────────┼──────────────┤           │
│  │ 1: function  │ 1: function  │           │
│  │ 2: price*0.1 │ 2: price*tax │           │
│  │ 3: return    │ 3: return    │           │
│  └──────────────┴──────────────┘           │
└─────────────────────────────────────────────┘
```

## 🧪 Test Cases

### Unit Tests
1. **Line Pairing Algorithm**
   - Test with only additions
   - Test with only removals
   - Test with modifications
   - Test with mixed changes
   - Test with large diffs (1000+ lines)

2. **View Generation**
   - Generate unified view HTML
   - Generate side-by-side view HTML
   - Validate HTML structure
   - Validate CSS injection

3. **Style Consistency**
   - Color palette matches application
   - Layout matches application components
   - Responsive behavior works correctly

### Integration Tests
1. Export unified view and verify visual match
2. Export side-by-side view and verify layout
3. Switch between views in dialog preview
4. Test with light/dark themes
5. Test print functionality for both views
6. Test with differences-only mode

### Edge Cases
- Empty diff (no changes)
- Very large diff (10,000+ lines)
- Single line diff
- Only additions (new file)
- Only removals (deleted file)
- Files with special characters
- Files with very long lines (>200 chars)

## 📝 Documentation Updates

### User Documentation
- [ ] Add view mode section to export guide
- [ ] Add screenshots of both view modes
- [ ] Document when to use each view mode

### Developer Documentation
- [ ] Update `HtmlExportService` API documentation
- [ ] Document line pairing algorithm
- [ ] Add examples of custom styling

## 🎨 Design Decisions

### View Mode Defaults
**Decision**: Default to `unified` view mode
**Rationale**:
- Backward compatibility with existing exports
- Unified view is more compact for large diffs
- Users can opt-in to side-by-side when needed

### Style Approach
**Decision**: Embed application-matched CSS inline
**Rationale**:
- Standalone HTML files (no external dependencies)
- Consistent appearance across environments
- Easy to share via email or file hosting

### Line Pairing Strategy
**Decision**: Intelligent pairing based on line types
**Rationale**:
- Maintains visual alignment for unchanged lines
- Clearly shows additions/removals/modifications
- Matches user expectations from side-by-side view in app

### Responsive Breakpoint
**Decision**: Stack panels at 768px width
**Rationale**:
- Standard tablet breakpoint
- Maintains readability on mobile
- Consistent with application responsive design

## 🚀 Success Metrics

- [ ] Visual consistency: 95%+ match with application appearance
- [ ] User adoption: 40%+ use side-by-side view within 1 month
- [ ] Performance: Export completes in <2 seconds for 1000 line diffs
- [ ] Quality: Zero visual rendering bugs reported
- [ ] Compatibility: Works in Chrome, Firefox, Safari, Edge (latest versions)

## 📚 References

- Current implementation: `src/services/htmlExportService.ts`
- DiffViewer component: `src/components/diff/DiffViewer.tsx`
- Application styles: `src/styles/` (Tailwind configuration)
- Issue #30: https://github.com/rengotaku/bdiff/issues/30

## 🔄 Next Steps

1. Review and approve design document
2. Create implementation tasks
3. Begin Phase 1 implementation
4. Conduct user testing with side-by-side view
5. Gather feedback and iterate
6. Plan Phase 2 (interactive switcher) if needed
