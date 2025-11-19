import { useState, useCallback, useMemo, useEffect } from 'react'
import type { FileInfo, DiffResult, ViewMode, InputType, ComparisonOptions } from '../types/types'
import { DiffService } from '../services/diffService'
import { TextPreprocessor } from '../utils/textPreprocessor'

interface UseDiffState {
  originalFile: FileInfo | null
  modifiedFile: FileInfo | null
  diffResult: DiffResult | null
  isProcessing: boolean
  error: string | null
  viewMode: ViewMode
  inputType: InputType
  comparisonOptions: ComparisonOptions
  originalIsFromFile: boolean
  modifiedIsFromFile: boolean
}

interface UseDiffActions {
  setOriginalFile: (file: FileInfo | null, isFromFile?: boolean) => void
  setModifiedFile: (file: FileInfo | null, isFromFile?: boolean) => void
  setViewMode: (mode: ViewMode) => void
  setInputType: (type: InputType) => void
  setComparisonOptions: (options: ComparisonOptions) => void
  calculateDiff: () => Promise<void>
  clearAll: () => void
  clearError: () => void
}

export interface UseDiffReturn extends UseDiffState, UseDiffActions {
  canCalculateDiff: boolean
  formattedDiff: { original: any[]; modified: any[] } | null
}

export function useDiff(): UseDiffReturn {
  const [state, setState] = useState<UseDiffState>({
    originalFile: null,
    modifiedFile: null,
    diffResult: null,
    isProcessing: false,
    error: null,
    viewMode: 'side-by-side',
    inputType: 'file',
    comparisonOptions: TextPreprocessor.getDefaultOptions(),
    originalIsFromFile: false,
    modifiedIsFromFile: false
  })

  const setOriginalFile = useCallback((file: FileInfo | null, isFromFile: boolean = false) => {
    setState(prev => ({
      ...prev,
      originalFile: file,
      error: null,
      originalIsFromFile: isFromFile,
      // Clear diff result when text is manually edited (not from file upload)
      diffResult: isFromFile ? prev.diffResult : null
    }))
  }, [])

  const setModifiedFile = useCallback((file: FileInfo | null, isFromFile: boolean = false) => {
    setState(prev => ({
      ...prev,
      modifiedFile: file,
      error: null,
      modifiedIsFromFile: isFromFile,
      // Clear diff result when text is manually edited (not from file upload)
      diffResult: isFromFile ? prev.diffResult : null
    }))
  }, [])

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }))
  }, [])

  const setInputType = useCallback((type: InputType) => {
    setState(prev => ({ ...prev, inputType: type }))
  }, [])

  const setComparisonOptions = useCallback((options: ComparisonOptions) => {
    setState(prev => ({ ...prev, comparisonOptions: options }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const calculateDiff = useCallback(async () => {
    if (!state.originalFile || !state.modifiedFile) {
      setState(prev => ({ 
        ...prev, 
        error: '比較するファイルまたはテキストを両方選択してください' 
      }))
      return
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      // 少し遅延を入れて処理中の状態を見せる
      await new Promise(resolve => setTimeout(resolve, 100))

      const result = DiffService.calculateDiff(
        state.originalFile.content,
        state.modifiedFile.content,
        state.comparisonOptions
      )

      setState(prev => ({ 
        ...prev, 
        diffResult: result, 
        isProcessing: false 
      }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '差分の計算に失敗しました',
        isProcessing: false 
      }))
    }
  }, [state.originalFile, state.modifiedFile, state.comparisonOptions])

  const clearAll = useCallback(() => {
    setState({
      originalFile: null,
      modifiedFile: null,
      diffResult: null,
      isProcessing: false,
      error: null,
      viewMode: 'side-by-side',
      inputType: 'file',
      comparisonOptions: TextPreprocessor.getDefaultOptions(),
      originalIsFromFile: false,
      modifiedIsFromFile: false
    })
  }, [])

  // Auto-compare only when both files are from file uploads (not text input)
  useEffect(() => {
    if (state.originalFile && state.modifiedFile && !state.isProcessing && !state.diffResult &&
        state.originalIsFromFile && state.modifiedIsFromFile) {
      calculateDiff()
    }
  }, [state.originalFile, state.modifiedFile, state.isProcessing, state.diffResult, state.originalIsFromFile, state.modifiedIsFromFile, calculateDiff])

  const canCalculateDiff = useMemo(() => {
    return !!(state.originalFile && state.modifiedFile) && !state.isProcessing
  }, [state.originalFile, state.modifiedFile, state.isProcessing])

  const formattedDiff = useMemo(() => {
    if (!state.diffResult) return null
    
    try {
      return DiffService.formatDiffForDisplay(state.diffResult.lines)
    } catch (error) {
      console.error('Failed to format diff:', error)
      return null
    }
  }, [state.diffResult])

  return {
    ...state,
    setOriginalFile,
    setModifiedFile,
    setViewMode,
    setInputType,
    setComparisonOptions,
    calculateDiff,
    clearAll,
    clearError,
    canCalculateDiff,
    formattedDiff
  }
}