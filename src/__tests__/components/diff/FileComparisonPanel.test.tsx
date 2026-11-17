import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FileComparisonPanel } from '../../../components/diff/FileComparisonPanel';
import type { DiffResult } from '../../../types/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const diffResult: DiffResult = {
  lines: [
    { type: 'removed', content: 'old', lineNumber: 1 },
    { type: 'added', content: 'new', lineNumber: 1 },
  ],
  stats: { added: 1, removed: 1, modified: 0, unchanged: 0, similarity: 0 },
} as DiffResult;

const renderWithOutsideInput = () =>
  render(
    <div>
      <textarea data-testid="outside" />
      <FileComparisonPanel
        diffResult={diffResult}
        viewMode="unified"
        onViewModeChange={vi.fn()}
        onCopy={vi.fn()}
        isCopying={false}
        hasNoDifferences={false}
        similarityPercentage={0}
      />
    </div>
  );

const expandButton = () => screen.getByRole('button', { name: 'diffViewer.actions.expand' });

describe('FileComparisonPanel - 拡大モード（#128）', () => {
  it('拡大するとフォーカスがパネル内に移る', () => {
    const { container } = renderWithOutsideInput();
    act(() => fireEvent.click(expandButton()));
    const panel = container.querySelector('[data-expanded="true"]');
    expect(panel).not.toBeNull();
    expect(panel!.contains(document.activeElement)).toBe(true);
  });

  it('拡大中、先頭要素で Shift+Tab してもパネルの外（背面の入力欄）へ出ない', () => {
    const { container } = renderWithOutsideInput();
    act(() => fireEvent.click(expandButton()));
    const panel = container.querySelector('[data-expanded="true"]')!;
    act(() => fireEvent.keyDown(document, { key: 'Tab', shiftKey: true }));
    expect(panel.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(screen.getByTestId('outside'));
  });

  it('Esc で戻ると拡大ボタンにフォーカスが戻る', () => {
    renderWithOutsideInput();
    const button = expandButton();
    button.focus();
    act(() => fireEvent.click(button));
    act(() => fireEvent.keyDown(document, { key: 'Escape' }));
    const restored = screen.getByRole('button', { name: 'diffViewer.actions.expand' });
    expect(document.activeElement).toBe(restored);
  });
});
