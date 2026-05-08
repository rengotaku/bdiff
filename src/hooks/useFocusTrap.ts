import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean
): void {
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!isActive) return;

    previousFocusRef.current = document.activeElement;

    const container = containerRef.current;
    if (container) {
      const focusable = getFocusableElements(container);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const currentContainer = containerRef.current;
      if (!currentContainer) return;

      const focusable = getFocusableElements(currentContainer);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const prev = previousFocusRef.current;
      if (prev instanceof HTMLElement) {
        prev.focus();
      }
    };
  }, [isActive, containerRef]);
}
