import { ProfileForm } from '@/app/(dashboard)/settings/profile/profile-form';
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
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile</h1>

      <ProfileForm
        email={user!.email ?? ''}
        displayName={profile?.display_name ?? ''}
        avatarUrl={profile?.avatar_url ?? ''}
      />
    </div>
  );
}
