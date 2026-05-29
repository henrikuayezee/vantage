'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[0-9]/, 'Password must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordForm) =>
      authApi.resetPassword({ token: token!, password: data.password }),
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setServerError(axiosError.response?.data?.message ?? 'Something went wrong. Please try again.');
    },
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <p className="text-[var(--text-secondary)]">Invalid or missing reset token.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Logo />
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          {isSuccess ? (
            <div className="text-center">
              <h1 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">
                Password reset
              </h1>
              <p className="mb-6 text-sm text-[var(--text-secondary)]">
                Your password has been updated. You can now sign in.
              </p>
              <Link href="/login">
                <Button className="w-full">Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-xl font-semibold text-[var(--text-primary)]">
                Reset password
              </h1>
              <p className="mb-6 text-sm text-[var(--text-secondary)]">
                Choose a new password for your account.
              </p>

              {serverError && (
                <div className="mb-4 rounded-lg bg-[var(--error-soft)] px-4 py-3 text-sm text-[var(--error)]">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-sm text-[var(--error)]">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-[var(--error)]">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Resetting...' : 'Reset password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
