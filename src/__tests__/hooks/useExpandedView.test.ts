import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExpandedView } from '../../hooks/useExpandedView';

const pressEscape = () => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
};

afterEach(() => {
  document.body.style.overflow = '';
});

describe('useExpandedView', () => {
  it('初期状態は通常表示', () => {
    const { result } = renderHook(() => useExpandedView());
    expect(result.current.isExpanded).toBe(false);
  });

  it('toggle で拡大・通常表示を切り替える', () => {
    const { result } = renderHook(() => useExpandedView());
    act(() => result.current.toggle());
    expect(result.current.isExpanded).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isExpanded).toBe(false);
  });

  it('拡大中は Escape で通常表示に戻る', () => {
    const { result } = renderHook(() => useExpandedView());
    act(() => result.current.toggle());
    act(() => pressEscape());
    expect(result.current.isExpanded).toBe(false);
  });

  it('拡大中はページのスクロールを止め、戻すと元に戻す', () => {
    document.body.style.overflow = 'auto';
    const { result } = renderHook(() => useExpandedView());
    act(() => result.current.toggle());
    expect(document.body.style.overflow).toBe('hidden');
    act(() => result.current.toggle());
    expect(document.body.style.overflow).toBe('auto');
  });

  it('アンマウントでスクロールロックを解除する', () => {
    const { result, unmount } = renderHook(() => useExpandedView());
    act(() => result.current.toggle());
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
