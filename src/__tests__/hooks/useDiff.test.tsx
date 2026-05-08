import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import React from 'react'
import { useDiff } from '../../hooks/useDiff'
import i18n from '../../i18n/config'

function createWrapper(_language: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  }
}

describe('useDiff - error message i18n', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ja')
  })

  it('calculateDiff with no files sets Japanese error message in Japanese mode', async () => {
    await i18n.changeLanguage('ja')
    const { result } = renderHook(() => useDiff(), { wrapper: createWrapper('ja') })

    await act(async () => {
      await result.current.calculateDiff()
    })

    expect(result.current.error).toBe('比較するファイルまたはテキストを両方選択してください')
    expect(result.current.error).not.toBe('errors.noFilesSelected')
  })

  it('calculateDiff with no files sets English error message in English mode', async () => {
    await i18n.changeLanguage('en')
    const { result } = renderHook(() => useDiff(), { wrapper: createWrapper('en') })

    await act(async () => {
      await result.current.calculateDiff()
    })

    // After fix: should be English, not hardcoded Japanese
    expect(result.current.error).not.toMatch(/比較するファイル/)
    expect(result.current.error).not.toBe('errors.noFilesSelected')
    expect(result.current.error).toBeTruthy()
  })

  it('calculateDiff with no files sets Korean error message in Korean mode', async () => {
    await i18n.changeLanguage('ko')
    const { result } = renderHook(() => useDiff(), { wrapper: createWrapper('ko') })

    await act(async () => {
      await result.current.calculateDiff()
    })

    expect(result.current.error).not.toMatch(/比較するファイル/)
    expect(result.current.error).not.toBe('errors.noFilesSelected')
    expect(result.current.error).toBeTruthy()
  })
})
