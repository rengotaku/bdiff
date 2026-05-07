import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeyboardShortcutsHelp } from '../../../components/ui/KeyboardShortcutsHelp';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'keyboard.title': 'キーボードショートカット',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('KeyboardShortcutsHelp', () => {
  describe('metaKey (Cmd) の表示', () => {
    it('metaKey=true のショートカットに Cmd が表示される', () => {
      const shortcuts = [{ key: 'Enter', metaKey: true, description: '比較' }];
      render(<KeyboardShortcutsHelp shortcuts={shortcuts} />);
      expect(screen.getByText('Cmd + ENTER')).toBeInTheDocument();
    });

    it('ctrlKey=true のショートカットに Ctrl が表示される', () => {
      const shortcuts = [{ key: 'c', ctrlKey: true, description: 'コピー' }];
      render(<KeyboardShortcutsHelp shortcuts={shortcuts} />);
      expect(screen.getByText('Ctrl + C')).toBeInTheDocument();
    });

    it('metaKey なしのショートカットに Cmd は含まれない', () => {
      const shortcuts = [{ key: 'c', ctrlKey: true, description: 'コピー' }];
      render(<KeyboardShortcutsHelp shortcuts={shortcuts} />);
      expect(screen.queryByText(/Cmd/)).not.toBeInTheDocument();
    });
  });

  describe('タイトルの i18n 対応', () => {
    it('タイトルが keyboard.title の翻訳値で表示される', () => {
      const shortcuts = [{ key: 'Enter', description: '比較' }];
      render(<KeyboardShortcutsHelp shortcuts={shortcuts} />);
      expect(screen.getByText('キーボードショートカット')).toBeInTheDocument();
    });

    it('ハードコードの英語 Keyboard Shortcuts は表示されない', () => {
      const shortcuts = [{ key: 'Enter', description: '比較' }];
      render(<KeyboardShortcutsHelp shortcuts={shortcuts} />);
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });
  });

  describe('shortcuts が空の場合', () => {
    it('何も表示しない', () => {
      const { container } = render(<KeyboardShortcutsHelp shortcuts={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
