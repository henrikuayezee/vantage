'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/auth-api';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    await authApi.forgotPassword(values.email).catch(() => null);
    setSent(true); // Always show success to prevent email enumeration
  };

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-8 shadow-[var(--shadow-md)]">
          <div className="mb-3 flex justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
              ✓
            </span>
          </div>
          <h2 className="text-sm font-semibold text-[var(--text)]">Check your email</h2>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            If an account exists for that email, you'll receive a reset link within a few minutes.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-xs text-[var(--primary)] hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-8 shadow-[var(--shadow-md)]">
        <h1 className="mb-1 text-base font-semibold text-[var(--text)]">Forgot your password?</h1>
        <p className="mb-6 text-xs text-[var(--text-muted)]">
          Enter your email and we'll send a reset link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-[var(--error)]">{errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-xs text-[var(--primary)] hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
