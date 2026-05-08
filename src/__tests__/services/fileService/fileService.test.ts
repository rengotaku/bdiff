import { describe, it, expect } from 'vitest'
import { FileService, FileServiceError } from '../../../services/fileService'

const makeFile = (name: string, size: number, type: string): File => {
  const content = 'x'.repeat(size)
  return new File([content], name, { type })
}

describe('FileService.validateFile', () => {
  it('有効なテキストファイルは isValid: true を返す', () => {
    const file = makeFile('test.txt', 100, 'text/plain')
    const result = FileService.validateFile(file)
    expect(result.isValid).toBe(true)
    expect(result.errorCode).toBeUndefined()
  })

  it('10MB超のファイルは fileSizeExceeded エラーコードを返す', () => {
    const file = makeFile('big.txt', 10 * 1024 * 1024 + 1, 'text/plain')
    const result = FileService.validateFile(file)
    expect(result.isValid).toBe(false)
    expect(result.errorCode).toBe('fileSizeExceeded')
    expect(result.errorParams).toHaveProperty('maxSize')
  })

  it('サポート外ファイルは unsupportedFileType エラーコードを返す', () => {
    const file = makeFile('virus.exe', 100, 'application/octet-stream')
    const result = FileService.validateFile(file)
    expect(result.isValid).toBe(false)
    expect(result.errorCode).toBe('unsupportedFileType')
  })
})

describe('FileService.readFile', () => {
  it('バリデーション失敗時は FileServiceError をスローする', async () => {
    const file = makeFile('virus.exe', 100, 'application/octet-stream')
    await expect(FileService.readFile(file)).rejects.toBeInstanceOf(FileServiceError)
  })

  it('バリデーション失敗の FileServiceError は errorCode を持つ', async () => {
    const file = makeFile('virus.exe', 100, 'application/octet-stream')
    try {
      await FileService.readFile(file)
    } catch (e) {
      expect(e).toBeInstanceOf(FileServiceError)
      expect((e as FileServiceError).code).toBe('unsupportedFileType')
    }
  })

  it('fileSizeExceeded の FileServiceError は errorParams.maxSize を持つ', async () => {
    const file = makeFile('big.txt', 10 * 1024 * 1024 + 1, 'text/plain')
    try {
      await FileService.readFile(file)
    } catch (e) {
      expect(e).toBeInstanceOf(FileServiceError)
      expect((e as FileServiceError).code).toBe('fileSizeExceeded')
      expect((e as FileServiceError).params).toHaveProperty('maxSize')
    }
  })
})
