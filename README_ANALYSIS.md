# BDiff Auto-Comparison Implementation Analysis

## Overview

Complete analysis of the automatic comparison feature in the BDiff diff visualization tool. This analysis examines current behavior, identifies the root cause, and provides implementation strategies for the requested fix.

## Analysis Documents

### 1. ANALYSIS_SUMMARY.md
**Start here for a quick overview**
- Executive summary of findings
- Key issues identified
- Solution overview
- Testing approach
- Implementation checklist

### 2. AUTO_COMPARISON_QUICK_REFERENCE.md
**Use this for implementation**
- Problem statement
- Root cause with code examples
- Solution strategies
- Implementation steps with code
- Critical call sites to update
- Testing checklist

### 3. AUTO_COMPARISON_ANALYSIS.md
**Complete technical reference**
- Detailed codebase analysis
- Every file location with line numbers
- Complete data flow diagrams
- State structure breakdown
- Edge case analysis
- 11 testing scenarios

### 4. COMPONENT_INTERACTION_DIAGRAM.md
**Visual architecture guide**
- Component interaction diagrams
- Five detailed data flow paths
- State relationships
- Proposed solution structure
- Before/after code comparisons
- Verification scenarios

## Quick Facts

Issue: Automatic comparison triggers for both text input and file selection

Desired: Only file selection should auto-compare, text input requires manual button

Root Cause: Auto-compare effect in useDiff.ts doesn't distinguish input source

Solution: Add source tracking flags (originalIsFromFile, modifiedIsFromFile)

Impact: 2 core files modified, ~20 lines changed total

Complexity: Low - straightforward state tracking

## File Locations

Critical files to modify:
- `/home/takuya/Workspace/bdiff/src/hooks/useDiff.ts` (lines 117-122)
- `/home/takuya/Workspace/bdiff/src/pages/HomePage.tsx` (lines 64-80, 143-148)

Reference files:
- `/home/takuya/Workspace/bdiff/src/components/diff/FileUploadArea.tsx`
- `/home/takuya/Workspace/bdiff/src/pages/DiffPage.tsx`
- `/home/takuya/Workspace/bdiff/src/types/types.ts`

## Current Behavior Matrix

| Input Method | Current | Desired |
|--------------|---------|---------|
| Type text | Auto-compare | Manual button |
| Upload file | Auto-compare | Auto-compare |
| Drag file | Auto-compare | Auto-compare |
| Drag text | Auto-compare | Manual button |
| File selector | Auto-compare | Auto-compare |

## Implementation Summary

### Step 1: Add State Flags
Add two boolean fields to track input source:
- `originalIsFromFile: boolean`
- `modifiedIsFromFile: boolean`

### Step 2: Update Auto-Compare Effect
Modify condition to require both flags to be true:
```typescript
if (state.originalFile && state.modifiedFile && 
    state.originalIsFromFile && state.modifiedIsFromFile &&
    !state.isProcessing && !state.diffResult) {
  calculateDiff()
}
```

### Step 3: Pass Source Information
When setting files, include source flag:
- Text input: `setOriginalFile(fileInfo, false)`
- File input: `setOriginalFile(fileInfo, true)`

### Step 4: Update Call Sites
Modify 3 call sites to pass correct flag:
- `handleFileSelect()` in HomePage
- `handleDrop()` file branch in HomePage
- `handleFileSelect()` in DiffPage

## Testing Scenarios

Essential tests to verify fix:
1. Type text without auto-compare ✓
2. Upload file with auto-compare ✓
3. Drag file with auto-compare ✓
4. Drag text without auto-compare ✓
5. Mixed inputs (no auto-compare) ✓
6. Manual button still works ✓

## Getting Started

1. **First time?** Read ANALYSIS_SUMMARY.md (5 min)
2. **Implementing?** Use AUTO_COMPARISON_QUICK_REFERENCE.md (10 min)
3. **Need details?** Check AUTO_COMPARISON_ANALYSIS.md (20 min)
4. **Want visuals?** See COMPONENT_INTERACTION_DIAGRAM.md (15 min)

## Key Insights

### The Problem
Users typing text inadvertently trigger auto-compare before they finish typing. Files correctly auto-compare when uploaded, but manual text input should not.

### Why It Happens
Both text input and file loading create `FileInfo` objects and call `setOriginalFile()`/`setModifiedFile()`. The auto-compare effect can't tell them apart.

### The Solution
Track the source of each input (file vs text) using boolean flags. Only auto-compare when both inputs came from files.

### Why This Works
- Minimal code changes (backward compatible)
- Solves the stated problem completely
- Maintains all existing functionality
- Easy to test and verify
- Follows React best practices

## Notes for Implementation

### Backward Compatibility
The optional `isFromFile` parameter defaults to `false`, so existing code works without changes initially.

### State Initialization
Don't forget to initialize both flags to `false` in the initial state and `clearAll()`.

### Dependencies Array
Update the effect's dependency array to include both new flags.

### Error Handling
Clearing files should reset the flags to `false`.

## Related Issues/PRs

This analysis addresses the requirement to differentiate between:
1. Automatic comparison for file selection operations
2. Manual button required for text input operations

See the analysis documents for complete requirements breakdown.

---

**Analysis Date:** November 5, 2025
**Project:** BDiff - File Diff Visualization Tool
**Framework:** React + TypeScript
**Status:** Analysis Complete - Ready for Implementation
