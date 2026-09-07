import { createClient } from '@/lib/supabase/server';
import { getLists } from '@/lib/data/lists';
import { getProfile } from '@/lib/data/users';
import { getTasksDueToday } from '@/lib/data/tasks';
import { Sidebar } from '@/components/app-shell/sidebar';
import { Topbar } from '@/components/app-shell/topbar';
import { KeyboardShortcuts } from '@/components/shared/keyboard-shortcuts';
import { LiveTaskProvider } from '@/hooks/use-live-task';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, lists, todayTasks] = await Promise.all([
    user ? getProfile(user.id) : Promise.resolve(null),
    getLists(),
    getTasksDueToday(),
  ]);

  return (
    <LiveTaskProvider todayTasks={todayTasks}>
      <div className="flex h-screen overflow-hidden bg-background">
        <KeyboardShortcuts />
        <div className="hidden md:flex">
          <Sidebar lists={lists} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            title="TaskFlow"
            user={{
              displayName: profile?.display_name ?? null,
              email: user?.email ?? null,
              avatarUrl: profile?.avatar_url ?? null,
            }}
            lists={lists}
          />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </LiveTaskProvider>
  );
}
