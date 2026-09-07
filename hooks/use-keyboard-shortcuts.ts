'use client';

import { useEffect, useRef } from 'react';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

function matchesShortcut(shortcut: string, event: KeyboardEvent): boolean {
  const isCmd = shortcut.startsWith('cmd+');
  const key = isCmd ? shortcut.slice(4) : shortcut;

  if (event.key.toLowerCase() !== key.toLowerCase()) return false;

  if (isCmd) {
    return event.metaKey || event.ctrlKey;
  }

  return !event.metaKey && !event.ctrlKey && !event.altKey;
}

export function useKeyboardShortcuts(shortcuts: Record<string, () => void>): void {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(document.activeElement)) return;

      for (const [shortcut, handler] of Object.entries(shortcutsRef.current)) {
        if (matchesShortcut(shortcut, event)) {
          event.preventDefault();
          handler();
          return;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
