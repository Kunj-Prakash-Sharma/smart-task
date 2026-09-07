'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { createList } from '@/lib/actions/lists';
import { DEFAULT_LIST_COLOR } from '@/lib/constants';
import { cn } from '@/lib/utils';

const COLOR_PRESETS = [
  '#6366F1',
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#22C55E',
  '#14B8A6',
  '#3B82F6',
  '#A855F7',
];

export interface ListCreateDialogProps {
  trigger?: React.ReactNode;
}

export function ListCreateDialog({ trigger }: ListCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState(DEFAULT_LIST_COLOR);
  const [isPending, setIsPending] = React.useState(false);

  function resetForm() {
    setName('');
    setColor(DEFAULT_LIST_COLOR);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsPending(true);

    const result = await createList({ name: name.trim(), color });

    setIsPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success('List created');
    setOpen(false);
    resetForm();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus size={16} />
            New list
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New list</DialogTitle>
            <DialogDescription>Give your list a name and a color.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="list-name">Name</Label>
              <Input
                id="list-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Personal"
                autoFocus
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => {
                  const style: React.CSSProperties & { '--tw-ring-color'?: string } = {
                    backgroundColor: preset,
                  };
                  if (color === preset) {
                    style['--tw-ring-color'] = preset;
                  }

                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setColor(preset)}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-105',
                        color === preset && 'ring-2 ring-offset-2 ring-offset-background',
                      )}
                      style={style}
                      aria-label={preset}
                    >
                      {color === preset && <Check size={14} className="text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Creating…' : 'Create list'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
