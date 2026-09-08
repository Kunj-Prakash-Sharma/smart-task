import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getLists } from '@/lib/data/lists';
import { getProfile } from '@/lib/data/users';
import { getTasksDueToday } from '@/lib/data/tasks';
import { Sidebar } from '@/components/app-shell/sidebar';
import { Topbar } from '@/components/app-shell/topbar';
import { CommandPaletteProvider } from '@/components/app-shell/command-palette';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
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

  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  const defaultListId = lists.find((list) => list.owner_id === user?.id)?.id ?? null;

  return (
    <LiveTaskProvider todayTasks={todayTasks} defaultListId={defaultListId}>
      <CommandPaletteProvider lists={lists}>
        <SidebarProvider defaultOpen={sidebarOpen}>
          <KeyboardShortcuts />
          <Sidebar lists={lists} />
          <SidebarInset>
            <Topbar
              title="TaskFlow"
              user={{
                displayName: profile?.display_name ?? null,
                email: user?.email ?? null,
                avatarUrl: profile?.avatar_url ?? null,
              }}
            />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </CommandPaletteProvider>
    </LiveTaskProvider>
  );
}
