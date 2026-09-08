import type { ReactNode } from 'react';
import { ListTodo } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/app-shell/theme-toggle';

export interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary/10 via-transparent to-transparent"
        aria-hidden
      />

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ListTodo size={18} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">TaskFlow</span>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer ? <CardFooter className="flex-col gap-2">{footer}</CardFooter> : null}
        </Card>
      </div>
    </div>
  );
}
