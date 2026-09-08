import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CommandPaletteTrigger } from '@/components/app-shell/command-palette';
import { ThemeToggle } from '@/components/app-shell/theme-toggle';

interface TopbarUser {
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
}

interface TopbarProps {
  title: string;
  user: TopbarUser;
}

export function Topbar({ title, user }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-5" />
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <CommandPaletteTrigger />
        <ThemeToggle />
        <Avatar name={user.displayName ?? user.email} src={user.avatarUrl} />
      </div>
    </header>
  );
}
