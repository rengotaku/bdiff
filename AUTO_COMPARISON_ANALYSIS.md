# BDiff Automatic Comparison Implementation Analysis

## Executive Summary

The bdiff application currently implements **automatic comparison triggered by both file selection and text input**. The auto-compare mechanism is currently indiscriminate - it triggers whenever both `originalFile` and `modifiedFile` are set, regardless of whether they came from file uploads or manual text input.

The issue requests that **file selection should trigger auto-compare**, but **text input should require manual button press**.

---

## 1. Current Auto-Compare Mechanism

### Location: `/home/takuya/Workspace/bdiff/src/hooks/useDiff.ts` (Lines 117-122)

```typescript
// Auto-compare when both files are uploaded
useEffect(() => {
  if (state.originalFile && state.modifiedFile && !state.isProcessing && !state.diffResult) {
    calculateDiff()
  }
}, [state.originalFile, state.modifiedFile, state.isProcessing, state.diffResult, calculateDiff])
```

**Current Behavior:**
- Automatically triggers `calculateDiff()` when:
  - Both `originalFile` AND `modifiedFile` are set (non-null)
  - Processing is not currently active
  - No diff result has been calculated yet

**Problem:** This effect doesn't differentiate between:
1. Files loaded via file upload (should auto-compare)
2. Text entered manually (should require manual button press)

---

## 2. Data Flow Analysis

### 2.1 File Upload Path (HomePage.tsx)

**Location:** `/home/takuya/Workspace/bdiff/src/pages/HomePage.tsx` (Lines 143-148)

```typescript
const handleFileSelect = useCallback(async (file: File, target: 'original' | 'modified') => {
  const fileInfo = await readFile(file);
  if (fileInfo) {
    handleTextChange(fileInfo.content, target);
  }
}, [readFile, handleTextChange]);
```

**Process Flow:**
1. File is selected by user
2. `readFile()` hook reads file content asynchronously
3. Content is passed to `handleTextChange()` which calls `setOriginalFile()` or `setModifiedFile()`
4. This triggers the auto-compare effect in `useDiff`

### 2.2 Text Input Path (HomePage.tsx)

**Location:** `/home/takuya/Workspace/bdiff/src/pages/HomePage.tsx` (Lines 64-80)

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
    setOriginalFile(fileInfo);
  } else {
    setModifiedText(text);
    setModifiedFile(fileInfo);
  }
  clearError();
}, [setOriginalFile, setModifiedFile, clearError]);
```

**Process Flow:**
1. User types in textarea
2. onChange event fires (FileUploadArea.tsx, line 142)
3. `handleTextChange()` is called with new text
4. Creates a `FileInfo` object and calls `setOriginalFile()` or `setModifiedFile()`
5. This triggers the auto-compare effect (UNWANTED - should require manual button press)

### 2.3 File Selector Widget Path (DiffPage.tsx)

**Location:** `/home/takuya/Workspace/bdiff/src/components/diff/CollapsibleFileSelector.tsx` (Lines 29-41)

```typescript
const handleFileChange = (type: 'original' | 'modified', file: File | null) => {
  if (type === 'original') {
    setOriginalFile(file);
  } else {
    setModifiedFile(file);
  }
  
  const newFiles = type === 'original' 
    ? { original: file, modified: modifiedFile }
    : { original: originalFile, modified: file };
  
  onFileSelect?.(newFiles);
};
```

**Note:** This component manages its own local file state and calls the parent callback. The parent (DiffPage.tsx) then calls `setOriginalFile()` and `setModifiedFile()` through the context, which triggers auto-compare.

---

## 3. Entry Points for Setting File Content

### 3.1 Direct File Content Sources

| Source | Component | File | Lines | Triggers Auto-Compare |
|--------|-----------|------|-------|----------------------|
| **Text Input** | FileUploadArea | HomePage.tsx | 319, 335 | ✅ YES (should be ❌ NO) |
| **File Upload** | FileUploadArea | HomePage.tsx | 320, 336 | ✅ YES (correct) |
| **Drag & Drop** | HomePage.tsx | HomePage.tsx | 105-140 | ✅ YES (depends on source) |
| **File Selector** | CollapsibleFileSelector | DiffPage.tsx | 253-256 | ✅ YES (correct) |

### 3.2 Drag & Drop Handling (HomePage.tsx, Lines 105-140)

```typescript
const handleDrop = useCallback(async (e: React.DragEvent, target: 'original' | 'modified') => {
  // Method 1: Standard file drop
  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) {
    const file = files[0];
    const fileInfo = await readFile(file);
    if (fileInfo) {
      handleTextChange(fileInfo.content, target);  // ← Uses handleTextChange
    }
    return;
  }
  
  // Method 2: Text data (text/plain)
  const textData = e.dataTransfer.getData('text/plain');
  if (textData) {
    handleTextChange(textData, target);  // ← Uses handleTextChange
  }
});
```

**Problem:** Both file drops and text drops go through `handleTextChange()`, which triggers auto-compare regardless of source.

---

## 4. Manual Comparison Trigger

### 4.1 HomePage - Compare Button

**Location:** `/home/takuya/Workspace/bdiff/src/pages/HomePage.tsx` (Lines 350-356)

```typescript
<DiffSettingsPanel
  canCalculateDiff={canCalculateDiff}
  isProcessing={isProcessing}
  isReading={isReading}
  onStartComparison={handleStartComparison}
/>
```

**Handler:** `/home/takuya/Workspace/bdiff/src/pages/HomePage.tsx` (Lines 151-153)

```typescript
const handleStartComparison = useCallback(async () => {
  await calculateDiff();
}, [calculateDiff]);
```

### 4.2 DiffPage - Compare Files Button

**Location:** `/home/takuya/Workspace/bdiff/src/components/diff/CollapsibleFileSelector.tsx` (Lines 72-80)

```typescript
{canCompare && (
  <Button
    variant="primary"
    size="sm"
    onClick={onNewComparison}
  >
    Compare Files
  </Button>
)}
```

**Handler:** `/home/takuya/Workspace/bdiff/src/pages/DiffPage.tsx` (Lines 76-78)

```typescript
const handleNewComparisonFromSelector = useCallback(async () => {
  await calculateDiff();
}, [calculateDiff]);
```

---

## 5. State Structure

### 5.1 UseDiffState (useDiff.ts, Lines 6-15)

```typescript
interface UseDiffState {
  originalFile: FileInfo | null;
  modifiedFile: FileInfo | null;
  diffResult: DiffResult | null;
  isProcessing: boolean;
  error: string | null;
  viewMode: ViewMode;
  inputType: InputType;  // ← Has 'file' or 'text' but NOT USED for auto-compare
  comparisonOptions: ComparisonOptions;
}
```

**Key Finding:** The state tracks `inputType` but it's **never used** to control the auto-compare behavior. This field is set but not leveraged.

### 5.2 FileInfo Interface (types.ts, Lines 29-42)

```typescript
export interface FileInfo {
  name: string;        // e.g., "Original Text" or "file.txt"
  content: string;
  size: number;
  lastModified?: Date;
  type?: string;       // MIME type if available
  extension?: string;
}
```

**Potential Solution:** The `name` field contains "Original Text"/"Modified Text" for manual input and actual filenames for files. This could be used to distinguish sources.

---

## 6. Required Changes to Implement Issue

### 6.1 What Needs to Change

1. **Identify the source of data** when `setOriginalFile()` or `setModifiedFile()` is called
   - Text input from textarea
   - File upload via file dialog
   - File drop via drag-and-drop
   - File selection from CollapsibleFileSelector

2. **Disable auto-compare for text input**
   - Text entered manually should NOT trigger auto-compare
   - Button press should still be available for manual comparison

3. **Keep auto-compare for file operations**
   - File uploads should trigger auto-compare
   - File drops should trigger auto-compare
   - File selector should trigger auto-compare

### 6.2 Implementation Approaches

**Option A: Track Input Source via State Flag**
- Add `lastInputType: 'text' | 'file'` to state
- Only auto-compare if last input was file-based
- Modify auto-compare effect to check this flag

**Option B: Add Source Parameter to Setters**
- Extend `setOriginalFile()` and `setModifiedFile()` to accept a source parameter
- Pass source through all call sites
- Use source in auto-compare effect

**Option C: Create Separate Handlers**
- Create `setOriginalFileFromFile()` and `setOriginalFileFromText()`
- Create `setModifiedFileFromFile()` and `setModifiedFileFromText()`
- Only auto-compare when file-based setters are called

**Option D: Use FileInfo.name as Indicator**
- Files have actual filenames; manual input has "Original Text"/"Modified Text"
- Check if both names follow text pattern (both contain "Text") to skip auto-compare
- Simpler but less explicit

---

## 7. File Location Summary

| File | Purpose | Lines |
|------|---------|-------|
| `/home/takuya/Workspace/bdiff/src/hooks/useDiff.ts` | **CRITICAL:** Auto-compare effect | 117-122 |
| `/home/takuya/Workspace/bdiff/src/pages/HomePage.tsx` | **CRITICAL:** Text input & file handling | 64-80, 143-148, 151-153 |
| `/home/takuya/Workspace/bdiff/src/components/diff/FileUploadArea.tsx` | **CRITICAL:** Textarea onChange handler | 77-79, 142 |
| `/home/takuya/Workspace/bdiff/src/pages/DiffPage.tsx` | CollapsibleFileSelector integration | 76-78, 253-256 |
| `/home/takuya/Workspace/bdiff/src/components/diff/CollapsibleFileSelector.tsx` | File selector widget | 29-41 |
| `/home/takuya/Workspace/bdiff/src/types/types.ts` | Type definitions | All |
| `/home/takuya/Workspace/bdiff/src/contexts/DiffContext.tsx` | Context provider | All |

---

## 8. Call Graph

```
HomePage.tsx (FileUploadArea)
  ├─ onChange → handleTextChange()
  │  └─ setOriginalFile/setModifiedFile()
  │     └─ useDiff effect (auto-compare) ← ISSUE HERE
  │
  ├─ onFileSelect → handleFileSelect()
  │  └─ readFile()
  │  └─ handleTextChange()
  │     └─ setOriginalFile/setModifiedFile()
  │        └─ useDiff effect (auto-compare) ✅ WANTED
  │
  └─ onDrop → handleDrop()
     ├─ File drop: readFile()
     │  └─ handleTextChange()
     │     └─ useDiff effect ✅ WANTED
     └─ Text drop: handleTextChange()
        └─ useDiff effect ❌ UNWANTED

DiffPage.tsx (CollapsibleFileSelector)
  └─ onFileSelect → setOriginalFile/setModifiedFile()
     └─ useDiff effect (auto-compare) ✅ WANTED
```

---

## 9. Current Behavior Summary

### Auto-Compare Triggers Currently

✅ File upload via file dialog
✅ File drop via drag-and-drop  
✅ File selection via CollapsibleFileSelector
❌ Text input via textarea (SHOULD REQUIRE MANUAL BUTTON PRESS)
❌ Text drop via drag-and-drop (ambiguous - may be intentional)

### Manual Comparison Available

✅ "Compare Files" button on HomePage (DiffSettingsPanel)
✅ "Compare Files" button on DiffPage (CollapsibleFileSelector)

---

## 10. Edge Cases to Consider

1. **User types text, then uploads file** - Should auto-compare when file uploaded
2. **User uploads file, then manually edits text** - Should NOT auto-compare, user must click button
3. **User drags text between textareas** - Depends on whether this is considered "text input" or file operation
4. **Comparison options changed** - Currently triggers re-calculation (effect dependency), should this happen?
5. **Clear button pressed** - Clears file but doesn't clear results, auto-compare shouldn't trigger

---

## 11. Testing Scenarios

To verify the fix works correctly, test:

1. **File Auto-Comparison**
   - [ ] Upload file to original field → auto-compare when both filled
   - [ ] Upload file to modified field → auto-compare triggers
   - [ ] Change file selection → re-calculates with new file
   
2. **Text Manual Comparison**
   - [ ] Type in original field → no auto-compare
   - [ ] Type in modified field → no auto-compare  
   - [ ] Click "Compare Files" button → manual calculation works
   - [ ] Change text in either field → no auto-compare

3. **Mixed Scenarios**
   - [ ] File in original + text in modified → no auto-compare
   - [ ] Text in original + file in modified → no auto-compare
   - [ ] File in both → auto-compare works
   - [ ] After auto-compare from file, edit one text area → no new auto-compare

4. **Edge Cases**
   - [ ] Drag text between fields → verify behavior
   - [ ] Clear one field → verify no unwanted auto-compare
   - [ ] Change comparison options → verify only recalculates existing comparison

