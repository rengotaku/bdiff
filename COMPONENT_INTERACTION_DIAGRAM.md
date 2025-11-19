# Component Interaction Diagram - Auto-Comparison Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     DiffContext (Global State)              │
│  useDiff() Hook manages: originalFile, modifiedFile, etc.   │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌────────────┐
  │HomePage  │    │DiffPage  │    │DiffProvider│
  │  (Main)  │    │ (Results)│    │  (Setup)   │
  └──────────┘    └──────────┘    └────────────┘
        │
        │
   ┌────┴─────────────────────────┐
   │                              │
   ▼                              ▼
FileUploadArea              CollapsibleFileSelector
(Two instances:              (On DiffPage)
 original & modified)
```

## Detailed Data Flow - Current Implementation

### Path 1: Text Input (User Types in Textarea)

```
User types in textarea
        │
        ▼
FileUploadArea onChange
        │
        ├─ event: React.ChangeEvent<HTMLTextAreaElement>
        │
        ▼
handleTextareaChange()
(FileUploadArea.tsx:77)
        │
        ├─ calls: onChange(e.target.value)
        │
        ▼
handleTextChange()
(HomePage.tsx:64)
        │
        ├─ Creates FileInfo { name: "Original Text", content: string, ... }
        │
        ├─ setOriginalText(text)  ← local state
        │
        ▼
setOriginalFile(fileInfo)
(from context)
        │
        ├─ Updates context: setState({ originalFile: fileInfo, ... })
        │
        ▼
useDiff Hook detects change
(useDiff.ts:118)
        │
        ├─ originalFile: FileInfo ✓
        ├─ modifiedFile: FileInfo ✓
        ├─ isProcessing: false ✓
        ├─ diffResult: null ✓
        │
        ▼
calculateDiff() called  ❌ PROBLEM: Auto-compared when it shouldn't
```

### Path 2: File Upload (User Selects File via Dialog)

```
User clicks "Browse file" link
        │
        ▼
FileUploadArea file input onChange
        │
        ├─ event: React.ChangeEvent<HTMLInputElement>
        │
        ▼
handleFileInputChange()
(FileUploadArea.tsx:61)
        │
        ├─ calls: onFileSelect(file)
        │
        ▼
handleFileSelect()
(HomePage.tsx:143)
        │
        ├─ calls: readFile(file)  ← async file reading
        │
        ▼
[File reading completes]
        │
        ├─ fileInfo: { name: "actual-file.txt", content: string, ... }
        │
        ▼
handleTextChange(fileInfo.content, target)
        │
        ├─ Creates FileInfo with same content
        │
        ├─ setOriginalFile(fileInfo)
        │
        ▼
useDiff Hook detects change
        │
        ├─ originalFile: FileInfo ✓
        ├─ modifiedFile: FileInfo ✓
        ├─ isProcessing: false ✓
        ├─ diffResult: null ✓
        │
        ▼
calculateDiff() called  ✅ CORRECT: Auto-compared as intended
```

### Path 3: Drag & Drop Files

```
User drags file into textarea
        │
        ├─ onDragEnter event
        ├─ onDragOver event
        │
        ▼
onDrop event handler
(HomePage.tsx:105)
        │
        ├─ Detects: e.dataTransfer.files
        │
        ▼
readFile(file)  ← async file reading
        │
        ▼
[File reading completes]
        │
        ├─ fileInfo: { name: "dropped-file.txt", content: string, ... }
        │
        ▼
handleTextChange(fileInfo.content, target)  ← Problem: same as text input
        │
        ├─ Creates FileInfo
        │
        ▼
setOriginalFile(fileInfo)
        │
        ▼
Auto-compare triggered  ✅ WANTED: Should auto-compare for file drops
```

### Path 4: Drag & Drop Text

```
User drags text into textarea
        │
        ├─ onDragEnter event
        ├─ onDragOver event
        │
        ▼
onDrop event handler
(HomePage.tsx:105)
        │
        ├─ Detects: e.dataTransfer.getData('text/plain')
        │
        ├─ textData: string (not from file)
        │
        ▼
handleTextChange(textData, target)
        │
        ├─ Creates FileInfo { name: "Original Text", content: textData, ... }
        │
        ▼
setOriginalFile(fileInfo)
        │
        ▼
Auto-compare triggered  ❌ PROBLEM: Should NOT auto-compare for text drops
```

### Path 5: File Selection on DiffPage

```
User opens CollapsibleFileSelector on DiffPage
        │
        ├─ onFileSelect callback triggered
        │
        ▼
handleFileSelect()
(DiffPage.tsx:65)
        │
        ├─ calls: readFile(file)
        │
        ▼
[File reading completes]
        │
        ├─ fileInfo: FileInfo
        │
        ▼
setOriginalFile(fileInfo)
setModifiedFile(fileInfo)
        │
        ▼
useDiff effect detects both files set
        │
        ▼
calculateDiff() called  ✅ CORRECT: Auto-compare for file selection
```

## State Structure Relationships

```
UseDiffContext
│
├─ state.originalFile
│  ├─ .name: string
│  │  ├─ "Original Text" (from text input)
│  │  ├─ "actual-file.txt" (from file upload)
│  │  └─ "dropped-file.txt" (from file drop)
│  │
│  ├─ .content: string
│  ├─ .size: number
│  └─ .lastModified?: Date
│
├─ state.modifiedFile
│  └─ [same as originalFile]
│
├─ state.inputType: 'file' | 'text'  ← EXISTS BUT UNUSED
│
├─ state.diffResult
│  └─ Only set after calculateDiff() completes
│
└─ state.isProcessing
   └─ Prevents multiple simultaneous calculations
```

## The Auto-Compare Effect

```typescript
useEffect(() => {
  if (state.originalFile && state.modifiedFile && !state.isProcessing && !state.diffResult) {
    calculateDiff()
  }
}, [state.originalFile, state.modifiedFile, state.isProcessing, state.diffResult, calculateDiff])
```

### Trigger Conditions (All must be true)

| Condition | Current | Required |
|-----------|---------|----------|
| `state.originalFile !== null` | ✓ any content | ✓ any content |
| `state.modifiedFile !== null` | ✓ any content | ✓ any content |
| `!state.isProcessing` | ✓ not processing | ✓ not processing |
| `!state.diffResult` | ✓ no result exists | ✓ no result exists |
| **New: both are from files** | ✗ not checked | **✓ MUST ADD** |

## Proposed Solution: Source Tracking

### Enhanced State Structure

```typescript
interface UseDiffState {
  originalFile: FileInfo | null;
  modifiedFile: FileInfo | null;
  
  // NEW: Track input source
  originalIsFromFile: boolean;    // true if uploaded/dropped file
  modifiedIsFromFile: boolean;    // true if uploaded/dropped file
  
  diffResult: DiffResult | null;
  isProcessing: boolean;
  error: string | null;
  viewMode: ViewMode;
  inputType: InputType;  // Still exists for other potential uses
  comparisonOptions: ComparisonOptions;
}
```

### Enhanced Setters

```typescript
const setOriginalFile = (file: FileInfo | null, isFromFile: boolean = false) => {
  setState(prev => ({
    ...prev,
    originalFile: file,
    originalIsFromFile: isFromFile,  // NEW
    error: null
  }))
}

const setModifiedFile = (file: FileInfo | null, isFromFile: boolean = false) => {
  setState(prev => ({
    ...prev,
    modifiedFile: file,
    modifiedIsFromFile: isFromFile,  // NEW
    error: null
  }))
}
```

### Enhanced Effect

```typescript
useEffect(() => {
  // Only auto-compare if BOTH came from files
  if (state.originalFile && state.modifiedFile && 
      state.originalIsFromFile && state.modifiedIsFromFile &&  // NEW
      !state.isProcessing && !state.diffResult) {
    calculateDiff()
  }
}, [
  state.originalFile, 
  state.modifiedFile, 
  state.originalIsFromFile,      // NEW
  state.modifiedIsFromFile,      // NEW
  state.isProcessing, 
  state.diffResult, 
  calculateDiff
])
```

## Call Sites That Need Updates

### HomePage.tsx - handleFileSelect()

```typescript
// BEFORE
const handleFileSelect = useCallback(async (file: File, target: 'original' | 'modified') => {
  const fileInfo = await readFile(file);
  if (fileInfo) {
    handleTextChange(fileInfo.content, target);  // ← Problem
  }
}, [readFile, handleTextChange]);

// AFTER - Option A: New handler
const handleTextChangeFromFile = useCallback((text: string, target: 'original' | 'modified') => {
  const fileInfo: FileInfo = {
    name: target === 'original' ? 'Original Text' : 'Modified Text',
    content: text,
    size: new Blob([text]).size,
    lastModified: new Date()
  };
  
  if (target === 'original') {
    setOriginalText(text);
    setOriginalFile(fileInfo, true);  // ← Pass true for isFromFile
  } else {
    setModifiedText(text);
    setModifiedFile(fileInfo, true);  // ← Pass true for isFromFile
  }
  clearError();
}, [setOriginalFile, setModifiedFile, clearError]);

const handleFileSelect = useCallback(async (file: File, target: 'original' | 'modified') => {
  const fileInfo = await readFile(file);
  if (fileInfo) {
    handleTextChangeFromFile(fileInfo.content, target);  // ← Call new handler
  }
}, [readFile, handleTextChangeFromFile]);
```

### HomePage.tsx - handleDrop() (File drop branch)

```typescript
// BEFORE
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
    handleTextChange(textData, target);  // ← Correct
  }
}, [readFile, handleTextChange]);

// AFTER
const handleDrop = useCallback(async (e: React.DragEvent, target: 'original' | 'modified') => {
  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) {
    const file = files[0];
    const fileInfo = await readFile(file);
    if (fileInfo) {
      handleTextChangeFromFile(fileInfo.content, target);  // ← Call file handler
    }
    return;
  }
  
  const textData = e.dataTransfer.getData('text/plain');
  if (textData) {
    handleTextChange(textData, target);  // ← Correct: text handler
  }
}, [readFile, handleTextChange, handleTextChangeFromFile]);  // ← Add dependency
```

### DiffPage.tsx - handleFileSelect()

```typescript
// BEFORE
const handleFileSelect = useCallback(async (files: { original: File | null; modified: File | null }) => {
  if (files.original) {
    const fileInfo = await readFile(files.original);
    if (fileInfo) setOriginalFile(fileInfo);  // ← Missing isFromFile flag
  }
  if (files.modified) {
    const fileInfo = await readFile(files.modified);
    if (fileInfo) setModifiedFile(fileInfo);  // ← Missing isFromFile flag
  }
}, [readFile, setOriginalFile, setModifiedFile]);

// AFTER
const handleFileSelect = useCallback(async (files: { original: File | null; modified: File | null }) => {
  if (files.original) {
    const fileInfo = await readFile(files.original);
    if (fileInfo) setOriginalFile(fileInfo, true);  // ← Pass true
  }
  if (files.modified) {
    const fileInfo = await readFile(files.modified);
    if (fileInfo) setModifiedFile(fileInfo, true);  // ← Pass true
  }
}, [readFile, setOriginalFile, setModifiedFile]);
```

## Verification Diagram

```
Test Scenario 1: User types text
    user input (textarea)
         │
         ▼
    handleTextChange()
         │
    setOriginalFile(fileInfo, false)  ← false flag
         │
         ▼
    useEffect checks:
    ✓ originalFile exists
    ✓ modifiedFile exists
    ✗ originalIsFromFile = false
    ├─ Condition fails
    └─ NO auto-compare ✅

Test Scenario 2: User uploads file
    user selects file (dialog)
         │
         ▼
    handleFileSelect()
         │
    setOriginalFile(fileInfo, true)  ← true flag
         │
         ▼
    useEffect checks:
    ✓ originalFile exists
    ✓ modifiedFile exists
    ✓ originalIsFromFile = true
    ├─ Conditions pass
    └─ Auto-compare triggered ✅

Test Scenario 3: Mixed (text + file)
    text in original, file in modified
         │
         ├─ setOriginalFile(fileInfo, false)
         │
         ├─ setModifiedFile(fileInfo, true)
         │
         ▼
    useEffect checks:
    ✓ originalFile exists
    ✓ modifiedFile exists
    ✗ originalIsFromFile = false
    ├─ Condition fails
    └─ NO auto-compare ✅
```

