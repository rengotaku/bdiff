import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFileReader } from '../../hooks/useFileReader'
import { FileService, FileServiceError } from '../../services/fileService'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (params && Object.keys(params).length > 0) {
        return `${key}:${JSON.stringify(params)}`
      }
      return key
    },
  }),
}))

const makeFile = (name: string, size: number, type: string): File => {
  const content = 'x'.repeat(size)
  return new File([content], name, { type })
}

describe('useFileReader', () => {
  it('FileServiceError(fileSizeExceeded) は errors.fileSizeExceeded キーで翻訳される', async () => {
    vi.spyOn(FileService, 'readFile').mockRejectedValueOnce(
      new FileServiceError('fileSizeExceeded', { maxSize: '10 MB' })
    )

    const { result } = renderHook(() => useFileReader())
    const file = makeFile('big.txt', 100, 'text/plain')

    await act(async () => {
      await result.current.readFile(file)
    })

    expect(result.current.error).toBe('errors.fileSizeExceeded:{"maxSize":"10 MB"}')
  })

  it('FileServiceError(unsupportedFileType) は errors.unsupportedFileType キーで翻訳される', async () => {
    vi.spyOn(FileService, 'readFile').mockRejectedValueOnce(
      new FileServiceError('unsupportedFileType')
    )

    const { result } = renderHook(() => useFileReader())
    const file = makeFile('virus.exe', 100, 'application/octet-stream')

    await act(async () => {
      await result.current.readFile(file)
    })

    expect(result.current.error).toBe('errors.unsupportedFileType')
  })

  it('不明なエラーは errors.fileReadFailed にフォールバックする', async () => {
    vi.spyOn(FileService, 'readFile').mockRejectedValueOnce(new Error('unknown'))

    const { result } = renderHook(() => useFileReader())
    const file = makeFile('test.txt', 100, 'text/plain')

    await act(async () => {
      await result.current.readFile(file)
    })

    expect(result.current.error).toBe('errors.fileReadFailed')
  })

  it('非 Error オブジェクトは errors.fileReadFailed にフォールバックする', async () => {
    vi.spyOn(FileService, 'readFile').mockRejectedValueOnce('string error')

    const { result } = renderHook(() => useFileReader())
    const file = makeFile('test.txt', 100, 'text/plain')

    await act(async () => {
      await result.current.readFile(file)
    })

    expect(result.current.error).toBe('errors.fileReadFailed')
  })
})
