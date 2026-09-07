import { UserRound } from 'lucide-react';
import { ProfileForm } from '@/app/(dashboard)/settings/profile/profile-form';
import { PageHeader } from '@/components/shared/page-header';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/data/users';

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(user.id) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={UserRound} title="Profile" />

      <ProfileForm
        email={user!.email ?? ''}
        displayName={profile?.display_name ?? ''}
        avatarUrl={profile?.avatar_url ?? ''}
      />
    </div>
  );
}
