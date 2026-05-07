import { useEffect } from 'react';

export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const count = Number(document.body.dataset.scrollLockCount ?? 0);
    if (count === 0) {
      document.body.dataset.scrollLockOriginalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    document.body.dataset.scrollLockCount = String(count + 1);

    return () => {
      const currentCount = Number(document.body.dataset.scrollLockCount ?? 0);
      const nextCount = Math.max(0, currentCount - 1);
      if (nextCount === 0) {
        document.body.style.overflow = document.body.dataset.scrollLockOriginalOverflow ?? '';
        delete document.body.dataset.scrollLockCount;
        delete document.body.dataset.scrollLockOriginalOverflow;
      } else {
        document.body.dataset.scrollLockCount = String(nextCount);
      }
    };
  }, [active]);
}
