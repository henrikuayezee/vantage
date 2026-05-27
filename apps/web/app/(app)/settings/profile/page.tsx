'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth-store';
import { usersApi } from '@/lib/auth-api';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/\d/)
      .regex(/[^A-Za-z0-9]/),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfileSettingsPage() {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.me().then((r) => r.data),
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { firstName: me?.firstName ?? '', lastName: me?.lastName ?? '' },
  });

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => usersApi.updateProfile(data).then((r) => r.data),
    onSuccess: (updated) => {
      setUser({
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role,
        organizationId: updated.organizationId,
        avatarUrl: updated.avatarUrl,
      });
      void qc.invalidateQueries({ queryKey: ['me'] });
      setProfileMsg('Profile updated.');
      setTimeout(() => setProfileMsg(''), 3000);
    },
  });

  const updatePassword = useMutation({
    mutationFn: (data: PasswordForm) =>
      usersApi.updateProfile({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    onSuccess: () => {
      passwordForm.reset();
      setPasswordMsg('Password changed.');
      setTimeout(() => setPasswordMsg(''), 3000);
    },
    onError: () => setPasswordMsg('Current password is incorrect.'),
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-base font-semibold text-[var(--text)]">Profile settings</h1>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">Manage your personal information.</p>

      <Separator className="my-6" />

      {/* Profile form */}
      <form
        onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>First name</Label>
            <Input {...profileForm.register('firstName')} />
          </div>
          <div className="space-y-1.5">
            <Label>Last name</Label>
            <Input {...profileForm.register('lastName')} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={me?.email ?? ''} disabled className="opacity-60" />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          {profileMsg && <span className="text-xs text-[var(--success)]">{profileMsg}</span>}
        </div>
      </form>

      <Separator className="my-6" />

      {/* Password form */}
      <h2 className="text-sm font-medium text-[var(--text)] mb-4">Change password</h2>
      <form
        onSubmit={passwordForm.handleSubmit((d) => updatePassword.mutate(d))}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label>Current password</Label>
          <Input type="password" {...passwordForm.register('currentPassword')} />
        </div>
        <div className="space-y-1.5">
          <Label>New password</Label>
          <Input type="password" {...passwordForm.register('newPassword')} />
          {passwordForm.formState.errors.newPassword && (
            <p className="text-xs text-[var(--error)]">
              Min 8 chars with uppercase, number, and special character.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Confirm new password</Label>
          <Input type="password" {...passwordForm.register('confirm')} />
          {passwordForm.formState.errors.confirm && (
            <p className="text-xs text-[var(--error)]">
              {passwordForm.formState.errors.confirm.message}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" variant="secondary" disabled={updatePassword.isPending}>
            {updatePassword.isPending ? 'Updating…' : 'Update password'}
          </Button>
          {passwordMsg && (
            <span
              className={`text-xs ${updatePassword.isError ? 'text-[var(--error)]' : 'text-[var(--success)]'}`}
            >
              {passwordMsg}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
