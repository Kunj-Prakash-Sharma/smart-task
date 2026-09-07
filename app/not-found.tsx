import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Compass size={24} className="text-primary" />
      </div>
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">404</h1>
        <p className="mt-1 text-sm text-muted-foreground">This page doesn&apos;t exist.</p>
      </div>
      <Button asChild>
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
