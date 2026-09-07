import { Avatar } from '@/components/ui/avatar';
import { MobileNav } from '@/components/app-shell/mobile-nav';
import type { ListRow } from '@/types/database';

interface TopbarUser {
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
}

interface TopbarProps {
  title: string;
  user: TopbarUser;
  lists: ListRow[];
}

export function Topbar({ title, user, lists }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav lists={lists} />
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <Avatar name={user.displayName ?? user.email} src={user.avatarUrl} />
    </header>
  );
}
