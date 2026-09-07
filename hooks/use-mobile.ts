'use client';

import { useEffect, useState } from 'react';

export function useIsMobile(breakpointPx = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);

    function handleChange(event: MediaQueryListEvent | MediaQueryList) {
      setIsMobile(event.matches);
    }

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [breakpointPx]);

  return isMobile;
}
