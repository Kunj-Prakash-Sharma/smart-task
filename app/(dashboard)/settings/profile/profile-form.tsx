'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from '@/lib/actions/users';

export interface ProfileFormProps {
  email: string;
  displayName: string;
  avatarUrl: string;
}

export function ProfileForm({ email, displayName, avatarUrl }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [avatar, setAvatar] = useState(avatarUrl);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsPending(true);
    const result = await updateProfile({ displayName: name.trim(), avatarUrl: avatar.trim() });
    setIsPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success('Profile updated');
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={name || email} src={avatar || undefined} size="lg" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="profile-avatar-url">Avatar URL</Label>
              <Input
                id="profile-avatar-url"
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-display-name">Display name</Label>
            <Input
              id="profile-display-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={email} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              Managed by your account provider and cannot be changed here.
            </p>
          </div>

          <div>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
