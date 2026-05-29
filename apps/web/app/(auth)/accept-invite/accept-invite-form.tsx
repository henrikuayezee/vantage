'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';

const acceptInviteSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
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

type AcceptInviteForm = z.infer<typeof acceptInviteSchema>;

export default function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteForm>({
    resolver: zodResolver(acceptInviteSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: AcceptInviteForm) =>
      authApi.acceptInvite({ token: token!, name: data.name, password: data.password }),
    onSuccess: (response) => {
      useAuthStore.getState().setAuth(response.user, response.accessToken);
      router.push('/dashboard');
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
          <p className="text-[var(--text-secondary)]">Invalid or missing invite token.</p>
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
          <h1 className="mb-1 text-xl font-semibold text-[var(--text-primary)]">
            Accept your invitation
          </h1>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            Set up your account to get started.
          </p>

          {serverError && (
            <div className="mb-4 rounded-lg bg-[var(--error-soft)] px-4 py-3 text-sm text-[var(--error)]">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" type="text" placeholder="Jane Doe" {...register('name')} />
              {errors.name && <p className="text-sm text-[var(--error)]">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
              <Label htmlFor="confirmPassword">Confirm password</Label>
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
              {mutation.isPending ? 'Setting up...' : 'Accept invitation'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
