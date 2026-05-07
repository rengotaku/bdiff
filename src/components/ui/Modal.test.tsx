import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal - body overflow management', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  it('sets overflow to hidden when opened', () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}}>content</Modal>
    );

    rerender(<Modal isOpen={true} onClose={() => {}}>content</Modal>);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores previous overflow value when closed (not hardcoded unset)', () => {
    document.body.style.overflow = 'auto';

    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}}>content</Modal>
    );

    rerender(<Modal isOpen={false} onClose={() => {}}>content</Modal>);

    expect(document.body.style.overflow).toBe('auto');
  });

  it('restores empty string when no prior overflow was set', () => {
    document.body.style.overflow = '';

    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}}>content</Modal>
    );

    rerender(<Modal isOpen={false} onClose={() => {}}>content</Modal>);

    expect(document.body.style.overflow).toBe('');
  });

  it('restores overflow when unmounted while open', () => {
    document.body.style.overflow = 'scroll';

    const { unmount } = render(
      <Modal isOpen={true} onClose={() => {}}>content</Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('scroll');
  });

  it('does not release overflow lock when inner modal closes while outer modal is still open', () => {
    // Outer modal opens: saves '' → sets hidden
    const { rerender: rerenderInner } = render(
      <Modal isOpen={true} onClose={() => {}}>outer</Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    // Inner modal opens: saves 'hidden' → sets hidden (no change)
    const { rerender: rerenderInner2 } = render(
      <Modal isOpen={true} onClose={() => {}}>inner</Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    // Inner modal closes: restores 'hidden' (the value it saved), so outer lock remains
    rerenderInner2(<Modal isOpen={false} onClose={() => {}}>inner</Modal>);

    expect(document.body.style.overflow).toBe('hidden');

    // Outer modal closes: restores '' (the value it saved)
    rerenderInner(<Modal isOpen={false} onClose={() => {}}>outer</Modal>);

    expect(document.body.style.overflow).toBe('');
  });
});
