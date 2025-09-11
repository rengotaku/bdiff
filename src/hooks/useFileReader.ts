import { useState, useCallback } from 'react'
import type { FileInfo } from '../types/types'
import { FileService } from '../services/fileService'

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
  const [state, setState] = useState<UseFileReaderState>({
    isReading: false,
    error: null
  })

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const readFile = useCallback(async (file: File): Promise<FileInfo | null> => {
    setState(prev => ({ ...prev, isReading: true, error: null }))

    try {
      const fileInfo = await FileService.readFile(file)
      setState(prev => ({ ...prev, isReading: false }))
      return fileInfo
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました'
      setState(prev => ({ 
        ...prev, 
        isReading: false, 
        error: errorMessage 
      }))
      return null
    }
  }, [])

  const readFiles = useCallback(async (files: File[]): Promise<FileInfo[] | null> => {
    setState(prev => ({ ...prev, isReading: true, error: null }))

    try {
      const fileInfos = await FileService.readFiles(files)
      setState(prev => ({ ...prev, isReading: false }))
      return fileInfos
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました'
      setState(prev => ({ 
        ...prev, 
        isReading: false, 
        error: errorMessage 
      }))
      return null
    }
  }, [])

  return {
    ...state,
    readFile,
    readFiles,
    clearError
  }
}