'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ErrorStateProps {
  message: string;
  retry?: () => void;
}

export function ErrorState({ message, retry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle size={20} className="text-destructive" />
      </div>
      <h3 className="text-sm font-medium text-foreground">Something went wrong</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {retry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={retry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
