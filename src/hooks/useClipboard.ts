import { useState, useCallback, useEffect } from 'react'
import { ClipboardService } from '../services/clipboardService'
import { DiffFormatter, type DiffFormatOptions } from '../utils/diffFormatter'
import type { DiffLine } from '../types/types'

export interface CopyOptions extends DiffFormatOptions {
  filename?: string
  originalFilename?: string
  modifiedFilename?: string
  includeHeader?: boolean
}

export interface UseClipboardOptions {
  onSuccess?: (message?: string) => void
  onError?: (error: string) => void
  timeout?: number
}

export interface UseClipboardReturn {
  isSupported: boolean
  isLoading: boolean
  error: string | null
  hasPermission: boolean | null
  copyText: (text: string) => Promise<void>
  copyDiff: (lines: DiffLine[], options?: CopyOptions) => Promise<void>
  copyAddedLines: (lines: DiffLine[], options?: CopyOptions) => Promise<void>
  copyRemovedLines: (lines: DiffLine[], options?: CopyOptions) => Promise<void>
  copyChangedLines: (lines: DiffLine[], options?: CopyOptions) => Promise<void>
  clearError: () => void
  checkPermission: () => Promise<boolean>
}

export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const {
    onSuccess,
    onError,
    timeout = 3000
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isSupported] = useState(() => ClipboardService.isClipboardSupported())

  // Check permission on mount
  useEffect(() => {
    if (isSupported) {
      checkPermission()
    }
  }, [isSupported])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      const hasPermission = await ClipboardService.hasWritePermission()
      setHasPermission(hasPermission)
      return hasPermission
    } catch (error) {
      console.debug('Permission check failed:', error)
      setHasPermission(false)
      return false
    }
  }, [])

  const handleError = useCallback((error: unknown) => {
    const errorMessage = ClipboardService.getErrorMessage(error)
    setError(errorMessage)
    onError?.(errorMessage)
    
    // Clear error after timeout
    if (timeout > 0) {
      setTimeout(() => {
        setError(null)
      }, timeout)
    }
  }, [onError, timeout])

  const handleSuccess = useCallback((message?: string) => {
    setError(null)
    onSuccess?.(message)
  }, [onSuccess])

  const copyText = useCallback(async (text: string): Promise<void> => {
    if (!isSupported) {
      throw new Error('Clipboard functionality is not supported')
    }

    setIsLoading(true)
    setError(null)

    try {
      await ClipboardService.copyText(text)
      handleSuccess('テキストをクリップボードにコピーしました')
    } catch (error) {
      handleError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, handleSuccess, handleError])

  const copyDiff = useCallback(async (
    lines: DiffLine[], 
    copyOptions: CopyOptions = {}
  ): Promise<void> => {
    if (!lines || lines.length === 0) {
      throw new Error('No diff lines to copy')
    }

    const {
      format = 'diff',
      includeHeader = true,
      filename = '差分結果',
      ...formatOptions
    } = copyOptions

    try {
      const content = includeHeader 
        ? DiffFormatter.formatWithHeader(lines, { 
            ...formatOptions, 
            format, 
            filename 
          })
        : DiffFormatter.format(lines, { ...formatOptions, format })

      await copyText(content)
      
      // Get stats for success message
      const stats = DiffFormatter.getLineStats(lines)
      const totalChanges = stats.added + stats.removed + stats.modified
      handleSuccess(`差分をコピーしました (変更: ${totalChanges}行)`)
      
    } catch (error) {
      handleError(error)
      throw error
    }
  }, [copyText, handleSuccess, handleError])

  const copyAddedLines = useCallback(async (
    lines: DiffLine[], 
    copyOptions: CopyOptions = {}
  ): Promise<void> => {
    const addedLines = DiffFormatter.getAddedLines(lines)
    
    if (addedLines.length === 0) {
      const error = new Error('コピーする追加行がありません')
      handleError(error)
      throw error
    }

    const options = {
      ...copyOptions,
      selectedTypes: ['added' as const],
      filename: copyOptions.filename ? `${copyOptions.filename} (追加行のみ)` : '追加行'
    }

    await copyDiff(addedLines, options)
    handleSuccess(`追加行をコピーしました (${addedLines.length}行)`)
  }, [copyDiff, handleSuccess, handleError])

  const copyRemovedLines = useCallback(async (
    lines: DiffLine[], 
    copyOptions: CopyOptions = {}
  ): Promise<void> => {
    const removedLines = DiffFormatter.getRemovedLines(lines)
    
    if (removedLines.length === 0) {
      const error = new Error('コピーする削除行がありません')
      handleError(error)
      throw error
    }

    const options = {
      ...copyOptions,
      selectedTypes: ['removed' as const],
      filename: copyOptions.filename ? `${copyOptions.filename} (削除行のみ)` : '削除行'
    }

    await copyDiff(removedLines, options)
    handleSuccess(`削除行をコピーしました (${removedLines.length}行)`)
  }, [copyDiff, handleSuccess, handleError])

  const copyChangedLines = useCallback(async (
    lines: DiffLine[], 
    copyOptions: CopyOptions = {}
  ): Promise<void> => {
    const changedLines = DiffFormatter.getChangedLines(lines)
    
    if (changedLines.length === 0) {
      const error = new Error('コピーする変更行がありません')
      handleError(error)
      throw error
    }

    const options = {
      ...copyOptions,
      selectedTypes: ['added' as const, 'removed' as const, 'modified' as const],
      filename: copyOptions.filename ? `${copyOptions.filename} (変更行のみ)` : '変更行'
    }

    await copyDiff(changedLines, options)
    
    const stats = DiffFormatter.getLineStats(changedLines)
    const totalChanges = stats.added + stats.removed + stats.modified
    handleSuccess(`変更行をコピーしました (${totalChanges}行)`)
  }, [copyDiff, handleSuccess, handleError])

  return {
    isSupported,
    isLoading,
    error,
    hasPermission,
    copyText,
    copyDiff,
    copyAddedLines,
    copyRemovedLines,
    copyChangedLines,
    clearError,
    checkPermission
  }
}