# bdiff Refactoring Design Document

**Issue**: #32 - リファクタリング
**Created**: 2025-11-25
**Status**: Design Phase

## Executive Summary

This document outlines a comprehensive refactoring plan for the bdiff codebase to improve code organization, reduce duplication, and enhance maintainability without breaking existing functionality.

## Current State Analysis

### Codebase Overview
- **Language**: TypeScript + React 18
- **Build Tool**: Vite
- **Total Files**: 58 TypeScript files
- **Lines of Code**: ~8,857 lines
- **Architecture**: Component-based with services, hooks, contexts, and utilities

### Directory Structure
```
src/
├── components/       # UI components (ui, layout, diff, export, common, examples)
├── contexts/         # React contexts (DiffContext)
├── hooks/           # Custom React hooks
├── pages/           # Page components (HomePage, DiffPage)
├── services/        # Business logic services
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

### Recent Evolution
Based on git history, the codebase has undergone significant evolution:
- Multiple HTML export improvements (#31, #29, #28)
- Copy functionality enhancements (#29, #28)
- History feature removal (#20)
- HTML/SVG export implementation (#19, #18)

### Identified Issues

#### 1. Export System Fragmentation
**Problem**: Export functionality is spread across multiple files with overlapping concerns.

**Affected Files**:
- `components/export/HTMLExportButton.tsx` - UI trigger
- `components/export/HTMLExportDialog.tsx` - Configuration UI
- `services/htmlExportService.ts` - HTML generation
- `services/svgDiffRenderer.ts` - SVG-specific rendering
- `utils/diffExport.ts` - Generic export formatting
- `utils/diffRendering.ts` - Display rendering utilities

**Impact**:
- Duplicated rendering logic
- Unclear responsibility boundaries
- Difficult to add new export formats

#### 2. Component Complexity
**Problem**: Large components with mixed responsibilities.

**Example - DiffPage.tsx**:
- File handling logic
- State management
- UI rendering
- Event handling
- Copy operations
- Export coordination

**Impact**:
- Difficult to test
- Hard to maintain
- Unclear component boundaries

#### 3. Service vs Utility Inconsistency
**Problem**: Unclear distinction between services and utilities.

**Examples**:
- `services/fileService.ts` - Clear service
- `services/clipboardService.ts` - Clear service
- `utils/diffFormatter.ts` - Actually coordinates other modules (deprecated, good pattern)
- `utils/textPreprocessor.ts` - Stateful processing (more like a service)

**Impact**:
- Architectural confusion
- Difficult for new developers to understand patterns

#### 4. Deprecated Pattern Exists
**Note**: `utils/diffFormatter.ts` already demonstrates good deprecation pattern:
```typescript
/**
 * @deprecated This file is maintained for backward compatibility.
 * Use the specialized modules directly:
 * - DiffParser from './diffParsing'
 * - DiffStyler from './diffStyling'
 * - DiffExporter from './diffExport'
 */
```
This pattern should be replicated in other refactoring work.

## Refactoring Architecture

### Design Principles

1. **Incremental Migration**: Refactor in phases with clear value at each step
2. **Backward Compatibility**: Use deprecation warnings before removal
3. **Clear Boundaries**: Establish and document architectural patterns
4. **Testability**: Design for easier testing at each layer
5. **No Behavior Changes**: Purely structural improvements

### Phase 1: Export System Consolidation

#### Objective
Unify export functionality into a cohesive, extensible architecture.

#### New Structure
```
src/
├── services/
│   └── export/
│       ├── ExportService.ts          # Main orchestrator
│       ├── renderers/
│       │   ├── BaseRenderer.ts       # Abstract base
│       │   ├── HTMLRenderer.ts       # HTML-specific rendering
│       │   ├── SVGRenderer.ts        # SVG-specific rendering
│       │   ├── PlainTextRenderer.ts  # Plain text export
│       │   └── MarkdownRenderer.ts   # Markdown export
│       └── RenderingEngine.ts        # Shared rendering logic
```

#### Interface Design
```typescript
// ExportService.ts
interface ExportOptions {
  format: 'html' | 'svg' | 'markdown' | 'plaintext';
  title?: string;
  includeStyles?: boolean;
  viewMode?: ViewMode;
  // ... other options
}

export class ExportService {
  static export(
    lines: DiffLine[],
    options: ExportOptions
  ): string | Blob {
    const renderer = this.getRenderer(options.format);
    return renderer.render(lines, options);
  }
}

// BaseRenderer.ts
abstract class BaseRenderer {
  abstract render(lines: DiffLine[], options: ExportOptions): string | Blob;

  protected renderLine(line: DiffLine): string {
    // Shared rendering logic
  }
}
```

#### Migration Strategy
1. Create new `services/export/` structure
2. Implement ExportService and renderers
3. Update `HTMLExportDialog.tsx` to use ExportService
4. Mark old files as deprecated:
   - `services/htmlExportService.ts`
   - `services/svgDiffRenderer.ts`
   - (keep `utils/diffExport.ts` as it's already well-structured)
5. Gradually migrate consumers
6. Remove deprecated files after one release cycle

#### Benefits
- Single entry point for all export operations
- Easy to add new export formats
- Shared rendering logic reduces duplication
- Clear separation: UI → Service → Renderer

### Phase 2: Component Decomposition

#### Objective
Break down large components into smaller, focused, testable units.

#### Target: DiffPage.tsx Refactoring

**Current Responsibilities**:
- Navigation
- File selection
- Diff calculation
- View mode management
- Copy operations
- Export coordination
- UI rendering

**Proposed Structure**:
```
src/
├── features/
│   └── diff-viewer/
│       ├── DiffViewerPage.tsx        # Main page (orchestration only)
│       ├── components/
│       │   ├── DiffHeader.tsx        # Header with title and actions
│       │   ├── DiffControls.tsx      # View mode, file selector
│       │   ├── DiffStatsBar.tsx      # Statistics display
│       │   └── DiffResultsView.tsx   # Diff display wrapper
│       └── hooks/
│           ├── useDiffComparison.ts  # Diff calculation logic
│           ├── useFileSelection.ts   # File handling logic
│           ├── useDiffExport.ts      # Export operations
│           └── useDiffCopy.ts        # Copy operations
```

**Hook Extraction Examples**:
```typescript
// useDiffComparison.ts
export function useDiffComparison() {
  const { calculateDiff, diffResult, isProcessing } = useDiffContext();

  const handleCompare = useCallback(async () => {
    await calculateDiff();
  }, [calculateDiff]);

  return {
    diffResult,
    isProcessing,
    handleCompare,
    hasDifferences: DiffService.hasDifferences(diffResult)
  };
}

// useFileSelection.ts
export function useFileSelection() {
  const { setOriginalFile, setModifiedFile } = useDiffContext();
  const { readFile } = useFileReader();

  const handleFileSelect = useCallback(async (files) => {
    if (files.original) {
      const fileInfo = await readFile(files.original);
      if (fileInfo) setOriginalFile(fileInfo);
    }
    // ... similar for modified
  }, [readFile, setOriginalFile, setModifiedFile]);

  return { handleFileSelect };
}
```

**Simplified DiffViewerPage.tsx**:
```typescript
export const DiffViewerPage: React.FC = () => {
  const { diffResult, handleCompare } = useDiffComparison();
  const { handleFileSelect } = useFileSelection();
  const { handleCopy, isCopying } = useDiffCopy();
  const { handleExport } = useDiffExport();

  return (
    <PageLayout>
      <DiffHeader onBack={handleGoBack} onNewComparison={handleNewComparison} />
      <DiffControls
        onFileSelect={handleFileSelect}
        onCompare={handleCompare}
      />
      <DiffStatsBar stats={diffResult?.stats} />
      <DiffResultsView
        diffResult={diffResult}
        onCopy={handleCopy}
        onExport={handleExport}
      />
    </PageLayout>
  );
};
```

#### Benefits
- Smaller, focused components (easier to understand)
- Testable hooks (business logic isolated)
- Reusable logic across different pages
- Clear component hierarchy

### Phase 3: Service/Utils Standardization

#### Objective
Establish clear patterns and documentation for services vs utilities.

#### Definitions

**Services** (`src/services/`):
- Stateful or stateless business logic
- May have dependencies on other services
- Handle complex operations
- Examples: DiffService, ExportService, ClipboardService

**Utils** (`src/utils/`):
- Pure utility functions
- No external dependencies (except other utils)
- Simple transformations
- Examples: cn.ts, textPreprocessor.ts (after review)

#### Candidates for Reclassification

**Move to services/**:
- `utils/textPreprocessor.ts` → `services/TextPreprocessorService.ts` (if stateful)
- Or keep in utils/ if made purely functional

#### Documentation
Create `src/ARCHITECTURE.md`:
```markdown
# Architecture Patterns

## Services vs Utilities

**Services** handle business logic and may:
- Maintain state
- Depend on other services
- Coordinate complex operations
- Example: `DiffService.calculateDiff()`

**Utilities** provide pure functions:
- No side effects
- Deterministic output
- Simple transformations
- Example: `cn(className1, className2)`
```

#### Benefits
- Clear architectural guidelines
- Easier onboarding for new developers
- Consistent patterns across codebase

### Phase 4: Testing Infrastructure

#### Objective
Establish testing foundation for better code quality and refactoring confidence.

#### Setup

**Testing Framework**: Vitest (Vite-native, fast)

**Installation**:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Configuration** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

#### Testing Strategy

**Priority 1 - Core Services**:
- `DiffService.test.ts` - Myers algorithm correctness
- `ExportService.test.ts` - Export format outputs
- `ClipboardService.test.ts` - Copy operations

**Priority 2 - Hooks**:
- `useDiffComparison.test.ts`
- `useFileSelection.test.ts`
- `useDiffCopy.test.ts`

**Priority 3 - Components**:
- `DiffViewer.test.tsx` - Rendering modes
- `DiffStatsBar.test.tsx` - Statistics display

#### Example Test Structure
```typescript
// DiffService.test.ts
import { describe, it, expect } from 'vitest';
import { DiffService } from './DiffService';

describe('DiffService', () => {
  describe('calculateDiff', () => {
    it('should detect added lines', () => {
      const result = DiffService.calculateDiff('line1', 'line1\nline2');
      expect(result.stats.added).toBe(1);
    });

    it('should detect removed lines', () => {
      const result = DiffService.calculateDiff('line1\nline2', 'line1');
      expect(result.stats.removed).toBe(1);
    });
  });
});
```

#### Benefits
- Confidence in refactoring
- Regression prevention
- Documentation through tests
- Faster development cycles

## Implementation Timeline

### Phase 1: Export System Consolidation
**Duration**: 1-2 days
**Files Changed**: ~6-8 files
**Risk**: Low (isolated to export functionality)

**Tasks**:
- [ ] Create `services/export/` structure
- [ ] Implement BaseRenderer and concrete renderers
- [ ] Create ExportService orchestrator
- [ ] Update HTMLExportDialog to use new service
- [ ] Mark old files as deprecated
- [ ] Update imports across codebase
- [ ] Verify export functionality unchanged

### Phase 2: Component Decomposition
**Duration**: 2-3 days
**Files Changed**: ~10-15 files
**Risk**: Medium (UI changes, need careful testing)

**Tasks**:
- [ ] Extract custom hooks from DiffPage
- [ ] Create smaller component splits
- [ ] Update imports and prop drilling
- [ ] Manual testing of all user flows
- [ ] Verify no regressions

### Phase 3: Service/Utils Standardization
**Duration**: 1 day
**Files Changed**: ~5 files + documentation
**Risk**: Low (mostly organizational)

**Tasks**:
- [ ] Review all utils for service candidates
- [ ] Move/refactor as needed
- [ ] Create ARCHITECTURE.md
- [ ] Update imports
- [ ] Add JSDoc comments for patterns

### Phase 4: Testing Infrastructure
**Duration**: Ongoing (2-3 days initial setup)
**Files Changed**: New test files
**Risk**: None (additive only)

**Tasks**:
- [ ] Install and configure Vitest
- [ ] Write core service tests
- [ ] Write hook tests
- [ ] Write component tests
- [ ] Add test CI integration
- [ ] Document testing patterns

## Migration Patterns

### Deprecation Pattern
Following the existing `diffFormatter.ts` pattern:

```typescript
/**
 * @deprecated This file is maintained for backward compatibility.
 * Use ExportService from 'services/export/ExportService' instead.
 *
 * Migration guide:
 * Before: htmlExportService.exportToHTML(lines, options)
 * After:  ExportService.export(lines, { format: 'html', ...options })
 *
 * This file will be removed in version 2.0
 */
```

### Component Migration Pattern
```typescript
// Old component - mark as deprecated
/**
 * @deprecated Use DiffViewerPage from 'features/diff-viewer' instead
 */
export const DiffPage: React.FC = () => {
  return <DiffViewerPage />;
};

// New location
export { DiffViewerPage } from './features/diff-viewer/DiffViewerPage';
```

## Risk Assessment

### Low Risk Areas
- Export system consolidation (isolated functionality)
- Service/utils reorganization (no logic changes)
- Testing infrastructure (additive)

### Medium Risk Areas
- Component decomposition (UI changes, prop changes)
- Hook extraction (logic movement)

### Mitigation Strategies
1. **Incremental Changes**: One phase at a time
2. **Deprecation Period**: Keep old code alongside new for 1-2 releases
3. **Manual Testing**: Test all user flows after each phase
4. **Type Safety**: TypeScript catches many issues at compile time
5. **Git Strategy**: Create feature branch for each phase, merge after validation

## Success Metrics

### Code Quality
- [ ] Reduced file complexity (LOC per file < 200)
- [ ] Clear separation of concerns (hooks, components, services)
- [ ] Consistent patterns (services vs utils documented)

### Maintainability
- [ ] Export system: Single entry point
- [ ] Components: < 100 LOC, single responsibility
- [ ] Test coverage: > 70% for services

### Developer Experience
- [ ] Clear architecture documentation
- [ ] Easy to add new export formats
- [ ] Easy to test individual components
- [ ] Faster onboarding for new developers

## Appendix

### File Structure Before/After

**Before**:
```
src/
├── components/
│   └── export/
│       ├── HTMLExportButton.tsx
│       └── HTMLExportDialog.tsx
├── services/
│   ├── htmlExportService.ts
│   └── svgDiffRenderer.ts
├── utils/
│   ├── diffExport.ts
│   └── diffRendering.ts
└── pages/
    └── DiffPage.tsx (300+ lines)
```

**After**:
```
src/
├── features/
│   └── diff-viewer/
│       ├── DiffViewerPage.tsx (< 100 lines)
│       ├── components/
│       │   ├── DiffHeader.tsx
│       │   ├── DiffControls.tsx
│       │   └── DiffResultsView.tsx
│       └── hooks/
│           ├── useDiffComparison.ts
│           ├── useFileSelection.ts
│           └── useDiffExport.ts
├── services/
│   └── export/
│       ├── ExportService.ts
│       ├── RenderingEngine.ts
│       └── renderers/
│           ├── BaseRenderer.ts
│           ├── HTMLRenderer.ts
│           └── SVGRenderer.ts
└── utils/
    └── diffExport.ts (unchanged, still valid)
```

### Key Decision Records

#### Decision 1: Feature-Based Organization
**Context**: Should we organize by type (components/, services/) or by feature?
**Decision**: Hybrid - keep existing structure, add features/ for page-level organization
**Rationale**: Minimizes disruption, allows gradual migration

#### Decision 2: Export Service Pattern
**Context**: Consolidate export into single service or keep specialized services?
**Decision**: Single ExportService with renderer pattern
**Rationale**: Easier to extend, reduces duplication, clear abstraction

#### Decision 3: Testing Framework
**Context**: Jest vs Vitest?
**Decision**: Vitest
**Rationale**: Native Vite integration, faster, modern API

---

**Document Version**: 1.0
**Last Updated**: 2025-11-25
**Next Review**: After Phase 1 completion
