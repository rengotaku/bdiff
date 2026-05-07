import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { FileInfo } from '../types/types'
import { FileService, FileServiceError } from '../services/fileService'

interface UseFileReaderState {
  isReading: boolean
  error: string | null
}

interface UseFileReaderActions {
  readFile: (file: File) => Promise<FileInfo | null>
  readFiles: (files: File[]) => Promise<FileInfo[] | null>
  clearError: () => void
}

export interface UseFileReaderReturn extends UseFileReaderState, UseFileReaderActions {}

export function useFileReader(): UseFileReaderReturn {
  const { t } = useTranslation()
  const [state, setState] = useState<UseFileReaderState>({
    isReading: false,
    error: null
  })

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const getErrorMessage = useCallback((error: unknown): string => {
    if (error instanceof FileServiceError) {
      return t(`errors.${error.code}`, error.params ?? {})
    }
    return t('errors.fileReadFailed')
  }, [t])

  const readFile = useCallback(async (file: File): Promise<FileInfo | null> => {
    setState(prev => ({ ...prev, isReading: true, error: null }))

    try {
      const fileInfo = await FileService.readFile(file)
      setState(prev => ({ ...prev, isReading: false }))
      return fileInfo
    } catch (error) {
      setState(prev => ({
        ...prev,
        isReading: false,
        error: getErrorMessage(error)
      }))
      return null
    }
  }, [getErrorMessage])

  const readFiles = useCallback(async (files: File[]): Promise<FileInfo[] | null> => {
    setState(prev => ({ ...prev, isReading: true, error: null }))

    try {
      const fileInfos = await FileService.readFiles(files)
      setState(prev => ({ ...prev, isReading: false }))
      return fileInfos
    } catch (error) {
      setState(prev => ({
        ...prev,
        isReading: false,
        error: getErrorMessage(error)
      }))
      return null
    }
  }, [getErrorMessage])

  return {
    ...state,
    readFile,
    readFiles,
    clearError
  }
}
