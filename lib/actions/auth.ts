'use server';

import { signIn } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { RegisterSchema, LoginSchema } from '@/lib/validations/auth';

export type AuthState =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | undefined;

export async function register(_prevState: AuthState, formData: FormData) {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      error: 'Please fix the errors below.',
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { email, password, name } = parsed.data;

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return { error: 'An error occurred while creating your account.' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({ email, password: hashedPassword, name });

  redirect('/login');
}

export async function login(_prevState: AuthState, formData: FormData) {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      error: 'Please fix the errors below.',
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { email, password } = parsed.data;

  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Invalid email or password' };
    }
    throw error;
  }
}
