import { useState, useEffect } from 'react';

// Hook to detect if the screen is mobile size
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
