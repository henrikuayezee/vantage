'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogBody, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { tasksApi, milestonesApi } from '@/lib/tasks-api';
import { usersApi } from '@/lib/auth-api';
import { Priority, TaskStatus } from '@vantage/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(10000).optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  assigneeId: z.string().optional(),
  milestoneId: z.string().optional(),
  dueDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  projectId: string;
  parentTaskId?: string;
  defaultStatus?: TaskStatus;
  onClose: () => void;
}

export function CreateTaskModal({ projectId, parentTaskId, defaultStatus, onClose }: Props) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: defaultStatus ?? TaskStatus.TODO, priority: Priority.MEDIUM },
  });

  const { data: members } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const { data: proj } = await import('@/lib/projects-api').then(m =>
        m.projectsApi.getById(projectId)
      );
      return proj.members;
    },
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => milestonesApi.list(projectId).then(r => r.data),
  });

  const create = useMutation({
    mutationFn: (d: FormValues) =>
      tasksApi.create(projectId, {
        title: d.title,
        description: d.description || undefined,
        status: d.status,
        priority: d.priority,
        assigneeId: d.assigneeId || undefined,
        milestoneId: d.milestoneId || undefined,
        dueDate: d.dueDate || undefined,
        parentTaskId: parentTaskId || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      void qc.invalidateQueries({ queryKey: ['tasks-board', projectId] });
      void qc.invalidateQueries({ queryKey: ['project-stats', projectId] });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{parentTaskId ? 'Add subtask' : 'New task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((d) => create.mutate(d))}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="Task name…" {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-xs text-[var(--error)]">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} placeholder="Optional details…" {...form.register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(v) => form.setValue('status', v as TaskStatus)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(TaskStatus).map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.watch('priority')}
                  onValueChange={(v) => form.setValue('priority', v as Priority)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(Priority).map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Assignee</Label>
                <Select
                  value={form.watch('assigneeId') ?? ''}
                  onValueChange={(v) => form.setValue('assigneeId', v || undefined)}
                >
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    {(members ?? []).map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.user.firstName} {m.user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" {...form.register('dueDate')} />
              </div>
            </div>

            {milestones.length > 0 && (
              <div className="space-y-1.5">
                <Label>Milestone</Label>
                <Select
                  value={form.watch('milestoneId') ?? ''}
                  onValueChange={(v) => form.setValue('milestoneId', v || undefined)}
                >
                  <SelectTrigger><SelectValue placeholder="No milestone" /></SelectTrigger>
                  <SelectContent>
                    {milestones.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {create.isError && (
              <p className="text-xs text-[var(--error)]">Failed to create task.</p>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
