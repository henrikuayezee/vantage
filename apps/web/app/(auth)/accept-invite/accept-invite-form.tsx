'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi, usersApi } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth-store';

const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/\d/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type FormValues = z.infer<typeof schema>;

export default function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    try {
      const { data } = await authApi.acceptInvite(
        token,
        values.password,
        values.firstName,
        values.lastName,
      );
      const { data: me } = await usersApi.me();
      setAuth(
        {
          id: me.id,
          email: me.email,
          firstName: me.firstName,
          lastName: me.lastName,
          role: me.role,
          organizationId: me.organizationId,
          avatarUrl: me.avatarUrl,
        },
        data.accessToken,
      );
      router.replace('/dashboard');
    } catch {
      setServerError('This invite link is invalid or has expired.');
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-sm text-center">
        <p className="text-sm text-[var(--error)]">Invalid invite link.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-8 shadow-[var(--shadow-md)]">
        <h1 className="mb-1 text-base font-semibold text-[var(--text)]">Create your account</h1>
        <p className="mb-6 text-xs text-[var(--text-muted)]">
          You've been invited to Vantage. Set up your profile to get started.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" placeholder="Jane" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-xs text-[var(--error)]">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" placeholder="Smith" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-xs text-[var(--error)]">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-[var(--error)]">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('confirm')}
            />
            {errors.confirm && (
              <p className="text-xs text-[var(--error)]">{errors.confirm.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded bg-[var(--error-soft)] px-3 py-2 text-xs text-[var(--error)]">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </div>
    </div>
  );
}
