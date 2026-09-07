import Link from 'next/link';
import { ChevronRight, Settings, UserRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';

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
      <PageHeader icon={Settings} title="Settings" />

      <div className="flex flex-col gap-3">
        {SETTINGS_LINKS.map((link) => {
          const Icon = link.icon;

          return (
            <Link key={link.href} href={link.href} className="group">
              <Card className="transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium text-foreground">{link.title}</span>
                    <span className="text-sm text-muted-foreground">{link.description}</span>
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                  />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
