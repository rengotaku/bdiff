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
      handleSuccess()
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
      filename = 'Diff Result',
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
      // handleSuccess() is already called inside copyText()

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
      const error = new Error('No added lines to copy')
      handleError(error)
      throw error
    }

    const options = {
      ...copyOptions,
      selectedTypes: ['added' as const],
      filename: copyOptions.filename ? `${copyOptions.filename} (Added Only)` : 'Added Lines'
    }

    await copyDiff(addedLines, options)
    // handleSuccess() is already called inside copyDiff() -> copyText()
  }, [copyDiff, handleSuccess, handleError])

  const copyRemovedLines = useCallback(async (
    lines: DiffLine[],
    copyOptions: CopyOptions = {}
  ): Promise<void> => {
    const removedLines = DiffFormatter.getRemovedLines(lines)

    if (removedLines.length === 0) {
      const error = new Error('No removed lines to copy')
      handleError(error)
      throw error
    }

    const options = {
      ...copyOptions,
      selectedTypes: ['removed' as const],
      filename: copyOptions.filename ? `${copyOptions.filename} (Removed Only)` : 'Removed Lines'
    }

    await copyDiff(removedLines, options)
    // handleSuccess() is already called inside copyDiff() -> copyText()
  }, [copyDiff, handleSuccess, handleError])

  const copyChangedLines = useCallback(async (
    lines: DiffLine[],
    copyOptions: CopyOptions = {}
  ): Promise<void> => {
    const changedLines = DiffFormatter.getChangedLines(lines)

    if (changedLines.length === 0) {
      const error = new Error('No changed lines to copy')
      handleError(error)
      throw error
    }

    const options = {
      ...copyOptions,
      selectedTypes: ['added' as const, 'removed' as const, 'modified' as const],
      filename: copyOptions.filename ? `${copyOptions.filename} (Changed Only)` : 'Changed Lines'
    }

    await copyDiff(changedLines, options)
    // handleSuccess() is already called inside copyDiff() -> copyText()
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