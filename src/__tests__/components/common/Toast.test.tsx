import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastComponent } from '../../../components/common/Toast';
import type { Toast } from '../../../components/common/Toast';

const baseToast: Toast = {
  id: 'test-toast-1',
  type: 'success',
  title: 'Test Toast',
  duration: 5000,
};

describe('ToastComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('✕ボタンをクリックすると300ms後に onRemove が呼ばれる', () => {
    const onRemove = vi.fn();
    render(<ToastComponent toast={baseToast} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onRemove).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledWith('test-toast-1');
  });

  it('アンマウント時にタイマーがクリーンアップされ onRemove が呼ばれない', () => {
    const onRemove = vi.fn();
    const { unmount } = render(<ToastComponent toast={baseToast} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button'));

    // タイマー発火前にアンマウント
    unmount();
    vi.advanceTimersByTime(300);

    expect(onRemove).not.toHaveBeenCalled();
  });

  it('✕ボタンを連打しても onRemove は1回しか呼ばれない', () => {
    const onRemove = vi.fn();
    render(<ToastComponent toast={baseToast} onRemove={onRemove} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    vi.advanceTimersByTime(300);

    expect(onRemove).toHaveBeenCalledOnce();
  });
});
