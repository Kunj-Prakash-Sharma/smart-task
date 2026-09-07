'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AuthCard } from '../auth-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '@/lib/actions/auth';

interface SignupFormProps {
  onSuccess: () => void;
}

function SignupForm({ onSuccess }: SignupFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await signUp({ email, password, displayName });

      if (result.ok) {
        toast.success('Account created.');
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          autoComplete="name"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Creating account...' : 'Sign up'}
      </Button>
    </form>
  );
}

export default function SignupPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <AuthCard
      title="Create an account"
      description="Start organizing your work with TaskFlow."
      footer={
        !isSubmitted ? (
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        ) : null
      }
    >
      {isSubmitted ? (
        <p className="text-sm text-muted-foreground">
          Check your email to confirm your account, then log in.
        </p>
      ) : (
        <SignupForm onSuccess={() => setIsSubmitted(true)} />
      )}
    </AuthCard>
  );
}
