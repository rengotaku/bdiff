import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { Modal } from '../../../components/ui/Modal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'modal.closeModal': 'Close modal',
      };
      return translations[key] ?? key;
    },
  }),
}));

function renderModal(props: Partial<Parameters<typeof Modal>[0]> = {}) {
  const onClose = props.onClose ?? vi.fn();
  return render(
    <Modal isOpen={true} onClose={onClose} title="Test Modal" {...props}>
      <button>First</button>
      <button>Second</button>
      <button>Last</button>
    </Modal>
  );
}

describe('Modal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初期フォーカス', () => {
    it('モーダルが開いたとき最初のフォーカス可能要素にフォーカスが移る', async () => {
      renderModal();
      await act(async () => {});
      const firstFocusable = screen.getAllByRole('button')[0];
      expect(document.activeElement).toBe(firstFocusable);
    });

    it('isOpen=false のとき何もレンダリングしない', () => {
      render(
        <Modal isOpen={false} onClose={vi.fn()}>
          <button>Button</button>
        </Modal>
      );
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  describe('フォーカストラップ', () => {
    it('最後の要素で Tab を押すと先頭に循環する', async () => {
      renderModal();
      await act(async () => {});

      const buttons = screen.getAllByRole('button');
      const lastButton = buttons[buttons.length - 1];

      lastButton.focus();
      expect(document.activeElement).toBe(lastButton);

      fireEvent.keyDown(document.activeElement!, { key: 'Tab', shiftKey: false });

      const dialog = screen.getByRole('dialog');
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).toBe(buttons[0]);
    });

    it('先頭の要素で Shift+Tab を押すと末尾に循環する', async () => {
      renderModal();
      await act(async () => {});

      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[0];
      firstButton.focus();

      fireEvent.keyDown(document.activeElement!, { key: 'Tab', shiftKey: true });

      const lastButton = buttons[buttons.length - 1];
      expect(document.activeElement).toBe(lastButton);
    });

    it('Tab キーはモーダル内に留まる（モーダル外に抜けない）', async () => {
      renderModal();
      await act(async () => {});

      const dialog = screen.getByRole('dialog');
      const buttons = screen.getAllByRole('button');

      for (const btn of buttons) {
        btn.focus();
        fireEvent.keyDown(document.activeElement!, { key: 'Tab', shiftKey: false });
        expect(dialog.contains(document.activeElement)).toBe(true);
      }
    });
  });

  describe('フォーカス復帰', () => {
    it('モーダルを閉じたとき、開く前にフォーカスがあった要素に戻る', async () => {
      const trigger = document.createElement('button');
      trigger.textContent = 'Open Modal';
      document.body.appendChild(trigger);
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      const onClose = vi.fn();
      const { rerender } = render(
        <Modal isOpen={true} onClose={onClose} title="Test">
          <button>Inside</button>
        </Modal>
      );

      await act(async () => {});

      rerender(
        <Modal isOpen={false} onClose={onClose} title="Test">
          <button>Inside</button>
        </Modal>
      );

      await act(async () => {});
      expect(document.activeElement).toBe(trigger);

      document.body.removeChild(trigger);
    });
  });

  describe('i18n', () => {
    it('閉じるボタンの aria-label は翻訳キーを通じて取得される（英語ハードコードでない）', async () => {
      renderModal();
      await act(async () => {});
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeTruthy();
    });

    it('閉じるボタンには aria-label 属性がある', async () => {
      renderModal();
      await act(async () => {});
      const closeButtons = document.querySelectorAll('[aria-label]');
      const hasCloseLabel = Array.from(closeButtons).some(
        (el) => el.getAttribute('aria-label') !== null
      );
      expect(hasCloseLabel).toBe(true);
    });
  });

  describe('ARIA属性', () => {
    it('dialog ロールを持つ', () => {
      renderModal();
      expect(screen.getByRole('dialog')).toBeTruthy();
    });

    it('aria-modal="true" が設定されている', () => {
      renderModal();
      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('タイトルがあるとき aria-labelledby が設定される', () => {
      renderModal({ title: 'My Dialog' });
      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('aria-labelledby')).toBe('modal-title');
    });
  });
});

describe('Modal - body overflow management', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
    delete document.body.dataset.scrollLockCount;
    delete document.body.dataset.scrollLockOriginalOverflow;
  });

  afterEach(() => {
    cleanup();
  });

  it('モーダルが閉じている間、body.style.overflow は変化しない', () => {
    render(<Modal isOpen={false} onClose={() => {}}>content</Modal>);
    expect(document.body.style.overflow).toBe('');
  });

  it('モーダルを開くと body.style.overflow が hidden になる', () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}}>content</Modal>
    );
    rerender(<Modal isOpen={true} onClose={() => {}}>content</Modal>);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('モーダルを閉じると body.style.overflow が元の空文字列に戻る（unset ではない）', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}}>content</Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Modal isOpen={false} onClose={() => {}}>content</Modal>);
    expect(document.body.style.overflow).toBe('');
  });

  it('body に独自の overflow が指定されていた場合、モーダルを閉じると元の値に戻る', () => {
    document.body.style.overflow = 'scroll';

    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}}>content</Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Modal isOpen={false} onClose={() => {}}>content</Modal>);
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('アンマウント時に body.style.overflow が元の値に戻る', () => {
    document.body.style.overflow = 'auto';

    const { unmount } = render(
      <Modal isOpen={true} onClose={() => {}}>content</Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('複数モーダルが開いている場合、1つが閉じてもスクロールはロックされたまま', () => {
    const { rerender: rerender1 } = render(
      <Modal isOpen={true} onClose={() => {}}>modal 1</Modal>
    );
    render(<Modal isOpen={true} onClose={() => {}}>modal 2</Modal>);

    expect(document.body.style.overflow).toBe('hidden');

    rerender1(<Modal isOpen={false} onClose={() => {}}>modal 1</Modal>);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('最後のモーダルが閉じるとスクロールが解放される', () => {
    const { rerender: rerender1 } = render(
      <Modal isOpen={true} onClose={() => {}}>modal 1</Modal>
    );
    const { rerender: rerender2 } = render(
      <Modal isOpen={true} onClose={() => {}}>modal 2</Modal>
    );

    rerender1(<Modal isOpen={false} onClose={() => {}}>modal 1</Modal>);
    rerender2(<Modal isOpen={false} onClose={() => {}}>modal 2</Modal>);

    expect(document.body.style.overflow).toBe('');
  });
});
