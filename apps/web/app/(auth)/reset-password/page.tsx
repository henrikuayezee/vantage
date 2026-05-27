'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/auth-api';

const schema = z
  .object({
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    try {
      await authApi.resetPassword(token, values.password);
      setDone(true);
      setTimeout(() => router.replace('/login'), 2000);
    } catch {
      setServerError('This reset link is invalid or has expired.');
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-sm text-center">
        <p className="text-sm text-[var(--error)]">Invalid reset link.</p>
        <Link href="/forgot-password" className="mt-3 text-xs text-[var(--primary)] hover:underline block">
          Request a new one
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-8 shadow-[var(--shadow-md)]">
          <p className="text-sm font-medium text-[var(--success)]">Password updated! Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-8 shadow-[var(--shadow-md)]">
        <h1 className="mb-1 text-base font-semibold text-[var(--text)]">Set new password</h1>
        <p className="mb-6 text-xs text-[var(--text-muted)]">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
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
            {isSubmitting ? 'Saving…' : 'Set password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
