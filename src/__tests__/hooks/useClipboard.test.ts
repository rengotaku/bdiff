import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useClipboard } from '../../hooks/useClipboard'
import { ClipboardService } from '../../services/clipboardService'

vi.mock('../../services/clipboardService', () => ({
  ClipboardService: {
    isClipboardSupported: vi.fn(() => true),
    isModernClipboardSupported: vi.fn(() => true),
    isLegacyClipboardSupported: vi.fn(() => false),
    hasWritePermission: vi.fn(async () => true),
    copyText: vi.fn(async () => {}),
    getErrorMessage: vi.fn((error: unknown) => String(error)),
  }
}))

describe('useClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ClipboardService.isClipboardSupported).mockReturnValue(true)
    vi.mocked(ClipboardService.hasWritePermission).mockResolvedValue(true)
    vi.mocked(ClipboardService.copyText).mockResolvedValue(undefined)
  })

  describe('マウント時の権限チェック (useEffect deps 修正の検証)', () => {
    it('isSupported が true のとき、マウント時に checkPermission が呼ばれる', async () => {
      const { result } = renderHook(() => useClipboard())

      await act(async () => {})

      expect(ClipboardService.hasWritePermission).toHaveBeenCalledTimes(1)
      expect(result.current.hasPermission).toBe(true)
    })

    it('isSupported が false のとき、マウント時に checkPermission は呼ばれない', async () => {
      vi.mocked(ClipboardService.isClipboardSupported).mockReturnValue(false)

      renderHook(() => useClipboard())

      await act(async () => {})

      expect(ClipboardService.hasWritePermission).not.toHaveBeenCalled()
    })

    it('checkPermission が失敗したとき hasPermission が false になる', async () => {
      vi.mocked(ClipboardService.hasWritePermission).mockRejectedValue(new Error('Permission error'))

      const { result } = renderHook(() => useClipboard())

      await act(async () => {})

      expect(result.current.hasPermission).toBe(false)
    })

    it('手動 checkPermission 呼び出しが hasPermission を更新する', async () => {
      vi.mocked(ClipboardService.hasWritePermission).mockResolvedValueOnce(false)

      const { result } = renderHook(() => useClipboard())
      await act(async () => {})
      expect(result.current.hasPermission).toBe(false)

      vi.mocked(ClipboardService.hasWritePermission).mockResolvedValue(true)
      await act(async () => {
        await result.current.checkPermission()
      })
      expect(result.current.hasPermission).toBe(true)
    })
  })

  describe('copyText の振る舞い', () => {
    it('コピー成功時に onSuccess コールバックが呼ばれる', async () => {
      const onSuccess = vi.fn()
      const { result } = renderHook(() => useClipboard({ onSuccess }))

      await act(async () => {
        await result.current.copyText('hello')
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('コピー失敗時に onError コールバックが呼ばれる', async () => {
      const onError = vi.fn()
      vi.mocked(ClipboardService.copyText).mockRejectedValue(new Error('Copy failed'))
      vi.mocked(ClipboardService.getErrorMessage).mockReturnValue('Copy failed')

      const { result } = renderHook(() => useClipboard({ onError }))

      await act(async () => {
        try {
          await result.current.copyText('hello')
        } catch {
          // expected
        }
      })

      expect(onError).toHaveBeenCalledWith('Copy failed')
    })

    it('isSupported が false のとき copyText は例外を投げる', async () => {
      vi.mocked(ClipboardService.isClipboardSupported).mockReturnValue(false)

      const { result } = renderHook(() => useClipboard())

      await expect(
        act(async () => { await result.current.copyText('test') })
      ).rejects.toThrow()
    })
  })

  describe('copyDiff / copyAddedLines / copyRemovedLines / copyChangedLines の振る舞い (handleSuccess 不要 deps 除去の回帰検証)', () => {
    // handleSuccess を deps から除去しても onSuccess は copyText 経由で正しく呼ばれることを確認する

    it('copyDiff 成功後に onSuccess が呼ばれる', async () => {
      const onSuccess = vi.fn()
      const { result } = renderHook(() => useClipboard({ onSuccess }))

      const lines = [{ type: 'added' as const, content: 'new line', lineNumber: 1 }]

      await act(async () => {
        await result.current.copyDiff(lines)
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('copyDiff は lines が空のとき handleError を呼んで例外を投げる', async () => {
      const onError = vi.fn()
      vi.mocked(ClipboardService.getErrorMessage).mockReturnValue('No diff lines to copy')

      const { result } = renderHook(() => useClipboard({ onError }))

      await act(async () => {
        try {
          await result.current.copyDiff([])
        } catch {
          // expected
        }
      })

      expect(ClipboardService.copyText).not.toHaveBeenCalled()
    })

    it('onSuccess の参照が変わった後も copyDiff は正しく動作し onSuccess を呼ぶ', async () => {
      const onSuccess1 = vi.fn()
      const { result, rerender } = renderHook(
        ({ onSuccess }: { onSuccess: () => void }) => useClipboard({ onSuccess }),
        { initialProps: { onSuccess: onSuccess1 } }
      )

      const onSuccess2 = vi.fn()
      rerender({ onSuccess: onSuccess2 })

      const lines = [{ type: 'added' as const, content: 'new line', lineNumber: 1 }]

      await act(async () => {
        await result.current.copyDiff(lines)
      })

      // 最新の onSuccess が呼ばれること（古い参照の onSuccess1 ではなく onSuccess2）
      expect(onSuccess2).toHaveBeenCalledTimes(1)
      expect(onSuccess1).not.toHaveBeenCalled()
    })
  })
})
