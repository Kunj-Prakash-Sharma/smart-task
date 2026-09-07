'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { NAV_ITEMS } from '@/components/app-shell/nav-items';
import type { ListRow } from '@/types/database';

const CommandPaletteContext = createContext<(() => void) | null>(null);

interface CommandPaletteProviderProps {
  lists: ListRow[];
  children: ReactNode;
}

export function CommandPaletteProvider({ lists, children }: CommandPaletteProviderProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useKeyboardShortcuts({
    'cmd+k': () => setOpen((value) => !value),
  });

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandPaletteContext.Provider value={() => setOpen(true)}>
      {children}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Jump to a page, list, or action…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigate">
            {NAV_ITEMS.map((item) => (
              <CommandItem key={item.href} value={item.label} onSelect={() => go(item.href)}>
                <item.icon />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {lists.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Lists">
                {lists.map((list) => (
                  <CommandItem
                    key={list.id}
                    value={list.name}
                    onSelect={() => go(`/lists/${list.id}`)}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: list.color }}
                    />
                    <span>{list.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}

          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              value="New task"
              onSelect={() => {
                setOpen(false);
                document.querySelector<HTMLElement>('[data-new-task-trigger]')?.click();
              }}
            >
              <Plus />
              <span>New task</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}

export function CommandPaletteTrigger() {
  const open = useContext(CommandPaletteContext);
  if (!open) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={open}
      className="h-8 gap-2 text-muted-foreground"
    >
      <Search size={14} />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline">
        ⌘K
      </kbd>
    </Button>
  );
}
