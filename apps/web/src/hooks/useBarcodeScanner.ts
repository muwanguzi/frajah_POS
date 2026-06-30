import { useEffect, useRef } from 'react';

export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  enabled = true
) {
  const buffer = useRef('');
  const lastKeyTime = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (now - lastKeyTime.current > 100) buffer.current = '';
      lastKeyTime.current = now;

      if (e.key === 'Enter' && buffer.current.length >= 4) {
        onScan(buffer.current);
        buffer.current = '';
      } else if (e.key.length === 1) {
        buffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan, enabled]);
}
