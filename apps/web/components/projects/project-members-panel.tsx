'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { projectsApi, type Project } from '@/lib/projects-api';
import { usersApi } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@vantage/types';

const ROLE_LABELS: Record<string, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.PROJECT_MANAGER]: 'Project Manager',
  [Role.DEVELOPER]: 'Developer',
};

interface Props {
  project: Project;
}

export function ProjectMembersPanel({ project }: Props) {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const canManage =
    currentUser?.role === Role.ADMIN || currentUser?.role === Role.PROJECT_MANAGER;

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>(Role.DEVELOPER);

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(1, 200).then((r) => r.data),
    enabled: canManage,
  });

  const memberUserIds = new Set(project.members.map((m) => m.userId));
  const nonMembers = (allUsers?.data ?? []).filter((u) => !memberUserIds.has(u.id));

  const addMember = useMutation({
    mutationFn: () => projectsApi.addMember(project.id, selectedUserId, selectedRole),
    onSuccess: () => {
      setSelectedUserId('');
      void qc.invalidateQueries({ queryKey: ['project', project.id] });
    },
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(project.id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', project.id] }),
  });

  return (
    <div className="space-y-4">
      {/* Add member (Admin/PM only) */}
      {canManage && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
          <h3 className="text-xs font-semibold text-[var(--text)] mb-3">Add member</h3>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team member…" />
                </SelectTrigger>
                <SelectContent>
                  {nonMembers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </SelectItem>
                  ))}
                  {nonMembers.length === 0 && (
                    <SelectItem value="_none" disabled>
                      All team members are already added
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.DEVELOPER}>Developer</SelectItem>
                  <SelectItem value={Role.PROJECT_MANAGER}>PM</SelectItem>
                  <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              disabled={!selectedUserId || selectedUserId === '_none' || addMember.isPending}
              onClick={() => addMember.mutate()}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-muted)]">
                Member
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-muted)]">
                Role
              </th>
              {canManage && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {project.members.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 3 : 2}
                  className="px-4 py-8 text-center text-xs text-[var(--text-muted)]"
                >
                  No members yet.
                </td>
              </tr>
            ) : (
              project.members.map((m) => {
                const initials =
                  `${m.user.firstName[0] ?? ''}${m.user.lastName[0] ?? ''}`.toUpperCase();
                return (
                  <tr
                    key={m.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-6 w-6">
                          {m.user.avatarUrl && (
                            <AvatarImage src={m.user.avatarUrl} alt={initials} />
                          )}
                          <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-medium text-[var(--text)]">
                            {m.user.firstName} {m.user.lastName}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)]">{m.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">
                      {ROLE_LABELS[m.role] ?? m.role}
                    </td>
                    {canManage && (
                      <td className="px-4 py-2.5">
                        {m.userId !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Remove member"
                            disabled={removeMember.isPending}
                            onClick={() => removeMember.mutate(m.userId)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-[var(--error)]" />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
