import { useCallback, useEffect, useState } from 'react';
import { useScrollLock } from './useScrollLock';

export interface UseExpandedViewReturn {
  isExpanded: boolean;
  toggle: () => void;
}

/**
 * Expanded (full-viewport) view state for a panel.
 * While expanded: Escape collapses it and page scrolling is locked.
 */
export function useExpandedView(): UseExpandedViewReturn {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggle = useCallback(() => setIsExpanded(prev => !prev), []);

  useScrollLock(isExpanded);

  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  return { isExpanded, toggle };
}
