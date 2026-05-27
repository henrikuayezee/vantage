'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, MoreHorizontal, Trash2, UserCheck, UserX } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/auth-store';
import { usersApi } from '@/lib/auth-api';
import { Role } from '@vantage/types';
import { cn } from '@/lib/utils';

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.nativeEnum(Role).default(Role.DEVELOPER),
});
type InviteForm = z.infer<typeof inviteSchema>;

const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.PROJECT_MANAGER]: 'Project Manager',
  [Role.DEVELOPER]: 'Developer',
};

const ROLE_COLORS: Record<Role, string> = {
  [Role.ADMIN]: 'var(--p-critical)',
  [Role.PROJECT_MANAGER]: 'var(--primary)',
  [Role.DEVELOPER]: 'var(--text-muted)',
};

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [showInvite, setShowInvite] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => usersApi.list(page, LIMIT).then((r) => r.data),
  });

  const inviteForm = useForm<InviteForm>({ resolver: zodResolver(inviteSchema) });

  const invite = useMutation({
    mutationFn: (d: InviteForm) => usersApi.invite(d.email, d.role),
    onSuccess: () => {
      setShowInvite(false);
      inviteForm.reset();
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, ...data }: { id: string; role?: string; isActive?: boolean }) =>
      usersApi.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      setDeleteTarget(null);
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-[var(--text)]">Users</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {data?.total ?? 0} members in your organization
          </p>
        </div>
        <Button size="sm" onClick={() => setShowInvite((v) => !v)}>
          <UserPlus className="h-3.5 w-3.5" />
          Invite user
        </Button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 shadow-[var(--shadow-sm)]">
          <h2 className="text-sm font-medium text-[var(--text)] mb-3">Invite a team member</h2>
          <form
            onSubmit={inviteForm.handleSubmit((d) => invite.mutate(d))}
            className="flex gap-3 items-end"
          >
            <div className="flex-1 space-y-1.5">
              <Label>Email address</Label>
              <Input placeholder="colleague@company.com" {...inviteForm.register('email')} />
              {inviteForm.formState.errors.email && (
                <p className="text-xs text-[var(--error)]">
                  {inviteForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="w-40 space-y-1.5">
              <Label>Role</Label>
              <select
                {...inviteForm.register('role')}
                className="h-8 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value={Role.DEVELOPER}>Developer</option>
                <option value={Role.PROJECT_MANAGER}>Project Manager</option>
                <option value={Role.ADMIN}>Admin</option>
              </select>
            </div>
            <Button type="submit" size="sm" disabled={invite.isPending}>
              {invite.isPending ? 'Sending…' : 'Send invite'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowInvite(false)}>
              Cancel
            </Button>
          </form>
          {invite.isError && (
            <p className="mt-2 text-xs text-[var(--error)]">
              Failed to send invite. User may already exist.
            </p>
          )}
        </div>
      )}

      {/* User table */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-muted)]">User</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-muted)]">Role</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-muted)]">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-muted)]">Joined</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">
                  Loading…
                </td>
              </tr>
            ) : (
              data?.data.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const initials = `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
                return (
                  <tr
                    key={u.id}
                    className={cn(
                      'border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors',
                      !u.isActive && 'opacity-50',
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-[var(--text)]">
                            {u.firstName} {u.lastName}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] text-[var(--text-muted)]">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Inline role select */}
                    <td className="px-4 py-2.5">
                      {isSelf ? (
                        <span
                          className="text-xs font-medium"
                          style={{ color: ROLE_COLORS[u.role as Role] ?? 'var(--text-muted)' }}
                        >
                          {ROLE_LABELS[u.role as Role] ?? u.role}
                        </span>
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={(v) => updateUser.mutate({ id: u.id, role: v })}
                        >
                          <SelectTrigger
                            className="h-7 w-36 text-xs border-transparent hover:border-[var(--border)] focus:border-[var(--border)]"
                            style={{ color: ROLE_COLORS[u.role as Role] ?? 'var(--text-muted)' }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={Role.DEVELOPER} className="text-xs">Developer</SelectItem>
                            <SelectItem value={Role.PROJECT_MANAGER} className="text-xs">Project Manager</SelectItem>
                            <SelectItem value={Role.ADMIN} className="text-xs">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>

                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                          u.isActive
                            ? 'bg-[var(--success-soft)] text-[var(--success)]'
                            : 'bg-[var(--surface-2)] text-[var(--text-muted)]',
                        )}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-2.5">
                      {!isSelf && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => updateUser.mutate({ id: u.id, isActive: !u.isActive })}
                              className="text-xs gap-2"
                            >
                              {u.isActive ? (
                                <><UserX className="h-3.5 w-3.5" /> Deactivate</>
                              ) : (
                                <><UserCheck className="h-3.5 w-3.5" /> Reactivate</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setDeleteTarget({ id: u.id, name: `${u.firstName} ${u.lastName}` })
                              }
                              className="text-xs gap-2 text-[var(--error)] focus:text-[var(--error)]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete user
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2.5">
            <p className="text-xs text-[var(--text-muted)]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <Dialog open onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete user</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <p className="text-sm text-[var(--text-muted)]">
                Are you sure you want to permanently delete{' '}
                <span className="font-medium text-[var(--text)]">{deleteTarget.name}</span>?
                This cannot be undone. Their tasks will be unassigned but not deleted.
              </p>
              {deleteUser.isError && (
                <p className="mt-2 text-xs text-[var(--error)]">Failed to delete user.</p>
              )}
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteUser.isPending}
                onClick={() => deleteUser.mutate(deleteTarget.id)}
              >
                {deleteUser.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
