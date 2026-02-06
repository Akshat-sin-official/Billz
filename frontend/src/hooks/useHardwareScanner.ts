import { useEffect, useRef, useCallback } from 'react';

interface UseHardwareScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  scanTimeout?: number; // Time in ms to consider input as scanner vs keyboard
  minLength?: number; // Minimum barcode length
}

/**
 * Hook to detect hardware barcode scanner input
 * Hardware scanners typically input characters very quickly followed by Enter
 */
export function useHardwareScanner({
  onScan,
  enabled = true,
  scanTimeout = 50, // Scanner inputs characters within ~50ms
  minLength = 3,
}: UseHardwareScannerOptions) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processBuffer = useCallback(() => {
    const barcode = bufferRef.current.trim();
    if (barcode.length >= minLength) {
      onScan(barcode);
    }
    bufferRef.current = '';
  }, [minLength, onScan]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Skip if user is typing in an input field (except for Enter to finalize scan)
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.isContentEditable;

    const now = Date.now();
    const timeSinceLastKey = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If too much time has passed, reset buffer
    if (timeSinceLastKey > 100) {
      bufferRef.current = '';
    }

    // Handle Enter key - process buffer if it looks like a scan
    if (event.key === 'Enter') {
      if (bufferRef.current.length >= minLength) {
        event.preventDefault();
        event.stopPropagation();
        processBuffer();
        return;
      }
      bufferRef.current = '';
      return;
    }

    // Only capture printable characters
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // If user is in input field and typing slowly, ignore
      if (isInputField && timeSinceLastKey > scanTimeout) {
        bufferRef.current = '';
        return;
      }

      bufferRef.current += event.key;

      // Set timeout to process buffer if no more input
      timeoutRef.current = setTimeout(() => {
        // Only process if we got rapid input (scanner behavior)
        if (bufferRef.current.length >= minLength) {
          processBuffer();
        } else {
          bufferRef.current = '';
        }
      }, 100);
    }
  }, [enabled, minLength, processBuffer, scanTimeout]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown, true);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, handleKeyDown]);

  return {
    clearBuffer: () => {
      bufferRef.current = '';
    },
  };
}

export default useHardwareScanner;
