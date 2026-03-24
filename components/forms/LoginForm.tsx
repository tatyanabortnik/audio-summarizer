'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login } from '@/lib/actions/auth';
import { LoginSchema } from '@/lib/validations/auth';
import { useFormValidation } from '@/hooks/useFormValidation';
import { Button } from '@/components/ui/button';

export const LoginForm = () => {
  const [state, action, pending] = useActionState(login, undefined);
  const { validate, fieldError } = useFormValidation(LoginSchema);

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    if (!validate(e)) e.preventDefault();
  }

  const err = (field: string) => fieldError(field, state?.fieldErrors);

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-4">
      {state?.error && !state.fieldErrors && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
          aria-invalid={!!err('email')}
        />
        {err('email') && (
          <p className="text-xs text-destructive">{err('email')}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
          aria-invalid={!!err('password')}
        />
        {err('password') && (
          <p className="text-xs text-destructive">{err('password')}</p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-foreground underline underline-offset-4 hover:no-underline"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
