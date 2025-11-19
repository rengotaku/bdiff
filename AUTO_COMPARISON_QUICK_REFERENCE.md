# Auto-Comparison Implementation - Quick Reference

## The Problem

Currently, **text input automatically triggers comparison**, but according to the issue, it should **only require manual button press**.

## The Root Cause

The auto-compare logic in `useDiff.ts` (lines 117-122) doesn't distinguish between text input and file input.

```typescript
useEffect(() => {
  if (state.originalFile && state.modifiedFile && !state.isProcessing && !state.diffResult) {
    calculateDiff()  // ← Triggers for BOTH text and file
  }
}, [state.originalFile, state.modifiedFile, ...])
```

## Current Data Flow

```
Text Input (WRONG - auto-compares)
├─ FileUploadArea textarea onChange
├─ handleTextChange()
├─ Creates FileInfo { name: "Original Text", content: "user typed text", ... }
├─ setOriginalFile() / setModifiedFile()
└─ useEffect in useDiff → calculateDiff() ❌ UNWANTED

File Upload (CORRECT - auto-compares)
├─ FileUploadArea file input onChange
├─ handleFileSelect()
├─ readFile() → extracts content
├─ handleTextChange()
├─ Creates FileInfo { name: "actual-file.txt", content: "file content", ... }
├─ setOriginalFile() / setModifiedFile()
└─ useEffect in useDiff → calculateDiff() ✅ WANTED
```

## Solution: Add Input Source Tracking

### Key Files to Modify

1. **useDiff.ts** - Add source tracking to state
2. **HomePage.tsx** - Pass source information when setting files
3. **Auto-compare effect** - Only trigger when both are files

### Implementation Strategy: Track Input Source

Add a new state field to track which inputs came from files vs text:

```typescript
interface UseDiffState {
  originalFile: FileInfo | null;
  modifiedFile: FileInfo | null;
  originalIsFromFile: boolean;  // NEW: track source
  modifiedIsFromFile: boolean;  // NEW: track source
  // ... rest of state
}
```

Then update the auto-compare effect:

```typescript
useEffect(() => {
  // Only auto-compare if BOTH are from files (not text input)
  if (state.originalFile && state.modifiedFile && 
      state.originalIsFromFile && state.modifiedIsFromFile &&
      !state.isProcessing && !state.diffResult) {
    calculateDiff()
  }
}, [state.originalFile, state.modifiedFile, state.originalIsFromFile, state.modifiedIsFromFile, ...])
```

### Modified Methods

Update setter functions:

```typescript
const setOriginalFile = (file: FileInfo | null, isFromFile: boolean = false) => {
  setState(prev => ({ 
    ...prev, 
    originalFile: file,
    originalIsFromFile: isFromFile,
    error: null 
  }))
}
```

## Critical Call Sites to Update

### In HomePage.tsx - handleFileSelect()

**From:**
```typescript
const handleFileSelect = useCallback(async (file: File, target: 'original' | 'modified') => {
  const fileInfo = await readFile(file);
  if (fileInfo) {
    handleTextChange(fileInfo.content, target);  // ← Need to mark as file
  }
}, ...);
```

**To:**
```typescript
const handleFileSelect = useCallback(async (file: File, target: 'original' | 'modified') => {
  const fileInfo = await readFile(file);
  if (fileInfo) {
    handleTextChangeFromFile(fileInfo.content, target);  // ← NEW: marks as file
  }
}, ...);
```

### In HomePage.tsx - handleTextChange() (for textarea input)

**Keep as-is:**
```typescript
const handleTextChange = useCallback((text: string, target: 'original' | 'modified') => {
  const fileInfo: FileInfo = {
    name: target === 'original' ? 'Original Text' : 'Modified Text',
    content: text,
    size: new Blob([text]).size,
    lastModified: new Date()
  };
  
  if (target === 'original') {
    setOriginalText(text);
    setOriginalFile(fileInfo);  // ← Marks as text (isFromFile = false)
  } else {
    setModifiedText(text);
    setModifiedFile(fileInfo);  // ← Marks as text (isFromFile = false)
  }
  clearError();
}, ...);
```

### In HomePage.tsx - handleDrop() (for drag-and-drop)

**From:**
```typescript
const handleDrop = useCallback(async (e: React.DragEvent, target: 'original' | 'modified') => {
  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) {
    const file = files[0];
    const fileInfo = await readFile(file);
    if (fileInfo) {
      handleTextChange(fileInfo.content, target);  // ← Problem: marks as text
    }
    return;
  }
  
  const textData = e.dataTransfer.getData('text/plain');
  if (textData) {
    handleTextChange(textData, target);  // ← Correct: text input
  }
}, ...);
```

**To:**
```typescript
const handleDrop = useCallback(async (e: React.DragEvent, target: 'original' | 'modified') => {
  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) {
    const file = files[0];
    const fileInfo = await readFile(file);
    if (fileInfo) {
      handleTextChangeFromFile(fileInfo.content, target);  // ← Mark as file
    }
    return;
  }
  
  const textData = e.dataTransfer.getData('text/plain');
  if (textData) {
    handleTextChange(textData, target);  // ← Correct: text input
  }
}, ...);
```

## Reset Behavior

When clearing inputs, reset the file flags:

```typescript
const handleClearOriginal = useCallback(() => {
  setOriginalText('');
  setOriginalFile(null);  // This should also set originalIsFromFile = false
}, [setOriginalFile]);
```

## Summary of Changes

| Component | Change | Impact |
|-----------|--------|--------|
| useDiff.ts | Add `originalIsFromFile` & `modifiedIsFromFile` flags | Tracks source |
| useDiff.ts | Update auto-compare effect condition | Only auto-compare if both from files |
| HomePage.tsx | Add `handleTextChangeFromFile()` or extend setters | Pass file flag |
| HomePage.tsx | Update `handleFileSelect()` | Call file-based setter |
| HomePage.tsx | Update `handleDrop()` file branch | Call file-based setter |
| DiffPage.tsx | Update `handleFileSelect()` | Call file-based setter |

## Testing Checklist

After implementation, verify:

- [ ] Typing in textarea doesn't auto-compare
- [ ] Uploading file auto-compares
- [ ] Dragging file auto-compares
- [ ] Dragging text doesn't auto-compare
- [ ] Mixed inputs (text + file) don't auto-compare
- [ ] Manual Compare button still works
- [ ] Clearing fields works correctly
- [ ] Switching between text/file inputs works
- [ ] No console errors

## Alternative: Simpler Approach Using FileInfo.name

Since files have real names and text inputs use "Original Text"/"Modified Text", you could detect the source:

```typescript
useEffect(() => {
  if (state.originalFile && state.modifiedFile && !state.isProcessing && !state.diffResult) {
    // Only auto-compare if at least one file has a real filename (not "Original/Modified Text")
    const hasRealFile = 
      (state.originalFile.name !== 'Original Text' && state.originalFile.name !== 'Modified Text') ||
      (state.modifiedFile.name !== 'Original Text' && state.modifiedFile.name !== 'Modified Text');
    
    if (hasRealFile) {
      calculateDiff()
    }
  }
}, [...])
```

**Pros:** Minimal code changes, no new state fields  
**Cons:** Less explicit, harder to understand, fragile name dependencies
