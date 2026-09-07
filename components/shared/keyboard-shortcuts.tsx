'use client';

import { useEffect } from 'react';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

export function KeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(document.activeElement)) return;

      if (event.key === 'n') {
        const trigger = document.querySelector<HTMLElement>('[data-new-task-trigger]');
        trigger?.click();
      } else if (event.key === '/') {
        const searchInput = document.querySelector<HTMLElement>('[data-search-input]');
        if (searchInput) {
          event.preventDefault();
          searchInput.focus();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}
