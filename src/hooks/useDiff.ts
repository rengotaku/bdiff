import { useState, useCallback, useMemo, useEffect } from 'react'
import type { FileInfo, DiffResult, ViewMode, InputType } from '../types/types'
import { DiffService } from '../services/diffService'
import { SyntaxHighlightService } from '../services/syntaxHighlightService'

interface UseDiffState {
  originalFile: FileInfo | null
  modifiedFile: FileInfo | null
  diffResult: DiffResult | null
  isProcessing: boolean
  error: string | null
  viewMode: ViewMode
  inputType: InputType
  syntaxHighlight: boolean
  detectedLanguage: string | null
}

interface UseDiffActions {
  setOriginalFile: (file: FileInfo | null) => void
  setModifiedFile: (file: FileInfo | null) => void
  setViewMode: (mode: ViewMode) => void
  setInputType: (type: InputType) => void
  setSyntaxHighlight: (enabled: boolean) => void
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
    syntaxHighlight: false,
    detectedLanguage: null
  })

  const setOriginalFile = useCallback((file: FileInfo | null) => {
    setState(prev => {
      const detectedLanguage = file ? SyntaxHighlightService.detectLanguage(file.name) : null
      return { 
        ...prev, 
        originalFile: file, 
        error: null,
        detectedLanguage,
        syntaxHighlight: !!detectedLanguage
      }
    })
  }, [])

  const setModifiedFile = useCallback((file: FileInfo | null) => {
    setState(prev => {
      const detectedLanguage = file ? SyntaxHighlightService.detectLanguage(file.name) : prev.detectedLanguage
      return { 
        ...prev, 
        modifiedFile: file, 
        error: null,
        detectedLanguage,
        syntaxHighlight: !!detectedLanguage
      }
    })
  }, [])

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }))
  }, [])

  const setInputType = useCallback((type: InputType) => {
    setState(prev => ({ ...prev, inputType: type }))
  }, [])

  const setSyntaxHighlight = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, syntaxHighlight: enabled }))
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
        state.modifiedFile.content
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
  }, [state.originalFile, state.modifiedFile])

  const clearAll = useCallback(() => {
    setState({
      originalFile: null,
      modifiedFile: null,
      diffResult: null,
      isProcessing: false,
      error: null,
      viewMode: 'side-by-side',
      inputType: 'file',
      syntaxHighlight: false,
      detectedLanguage: null
    })
  }, [])

  // Auto-compare when both files are uploaded
  useEffect(() => {
    if (state.originalFile && state.modifiedFile && !state.isProcessing && !state.diffResult) {
      calculateDiff()
    }
  }, [state.originalFile, state.modifiedFile, state.isProcessing, state.diffResult, calculateDiff])

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
    setSyntaxHighlight,
    calculateDiff,
    clearAll,
    clearError,
    canCalculateDiff,
    formattedDiff
  }
}