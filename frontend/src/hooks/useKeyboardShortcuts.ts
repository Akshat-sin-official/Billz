import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  enabled = true
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const keyMatch =
          event.key === shortcut.key ||
          event.code === shortcut.key;

        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;

        const shiftMatch = shortcut.shift
          ? event.shiftKey
          : !event.shiftKey;

        const altMatch = shortcut.alt
          ? event.altKey
          : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          // Allow all F-keys + Ctrl shortcuts even in inputs
          if (!isInputFocused || shortcut.ctrl || shortcut.key.startsWith('F')) {
            event.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}


export const POS_SHORTCUTS = {
  NEW_INVOICE: {
    key: 'n',
    ctrl: true,
    description: 'New Invoice',
  },

  PRINT_INVOICE: {
    key: 'p',
    ctrl: true,
    description: 'Print Invoice',
  },

  CANCEL: {
    key: 'Escape',
    description: 'Cancel',
  },

  SEARCH_PRODUCT: {
    key: 'F1',
    description: 'Search Product',
  },

  ADD_DISCOUNT: {
    key: 'F2',
    description: 'Add Discount',
  },

  APPLY_COUPON: {
    key: 'F3',
    description: 'Apply Coupon',
  },

  SPLIT_PAYMENT: {
    key: 'F4',
    description: 'Split Payment',
  },

  COMPLETE_PAYMENT: {
    key: 'F5',
    description: 'Complete Payment',
  },

  HOLD_INVOICE: {
    key: 'F6',
    description: 'Hold Invoice',
  },

  RECALL_HELD: {
    key: 'F7',
    description: 'Recall Held Invoice',
  },

  QUICK_CASH_PAYMENT: {
    key: 'F8',
    description: 'Quick Cash Payment',
  },

  CUSTOMER_LOOKUP: {
    key: 'F9',
    description: 'Customer Lookup',
  },

  SAVE_INVOICE: {
    key: 'F10',
    description: 'Save Invoice',
  },
} as const;
