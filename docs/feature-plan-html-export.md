# HTML Export Feature Implementation Plan

## Issue Reference
- **Issue #10**: HTMLエクスポート機能 - 差分結果の文書化と共有

## Overview
Implement HTML export functionality to save and share diff comparison results as standalone HTML files optimized for viewing in browsers and printing.

## Phase 1: Core HTML Generation Engine
- [ ] Create HTMLExportService for generating standalone HTML files
- [ ] Design template structure with embedded CSS/JS
- [ ] Implement diff content rendering to HTML format
- [ ] Add metadata and statistics section

## Phase 2: Export Options & UI
- [ ] Create HTMLExportDialog component with configuration options
- [ ] Implement display options (line numbers, stats inclusion, diff-only view)
- [ ] Add theming support (light/dark modes)
- [ ] Implement font and styling customization

## Phase 3: File Generation & Download
- [ ] Implement blob creation and download functionality
- [ ] Add filename generation with timestamps
- [ ] Implement file sanitization and security measures
- [ ] Add progress indicators for large exports

## Phase 4: Advanced Features
- [ ] Print optimization styles
- [ ] Responsive design for mobile viewing
- [ ] Preview functionality
- [ ] Export templates customization

## Technical Implementation

### Key Files to Create/Modify:
- `src/services/htmlExportService.ts` - Core HTML generation logic
- `src/components/export/HTMLExportDialog.tsx` - Export configuration UI
- `src/components/export/HTMLExportButton.tsx` - Export trigger button
- `src/templates/htmlExportTemplate.ts` - HTML template definitions
- `src/styles/exportStyles.ts` - Embedded CSS for exported HTML

### Integration Points:
- DiffPage: Add export button to results view
- DiffResult: Integrate with existing diff data structure
- Toast notifications: Success/error feedback for export operations

## Security Considerations
- HTML escaping for all user content
- Filename sanitization
- XSS prevention measures
- Local-only file generation (no server upload)

## Testing Strategy
- Unit tests for HTML generation service
- Browser compatibility testing
- Print layout verification
- Large file performance testing
- Security vulnerability testing