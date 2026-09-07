import Link from 'next/link';
import { ChevronRight, UserRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const SETTINGS_LINKS = [
  {
    href: '/settings/profile',
    icon: UserRound,
    title: 'Profile',
    description: 'Update your name and avatar',
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>

      <div className="flex flex-col gap-3">
        {SETTINGS_LINKS.map((link) => {
          const Icon = link.icon;

          return (
            <Link key={link.href} href={link.href}>
              <Card className="transition-all hover:border-foreground/20 hover:shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon size={18} className="text-muted-foreground" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium text-foreground">{link.title}</span>
                    <span className="text-sm text-muted-foreground">{link.description}</span>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
