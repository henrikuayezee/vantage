'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { projectsApi, type Project } from '@/lib/projects-api';

const schema = z
  .object({
    name: z.string().min(1, 'Name is required').max(120),
    description: z.string().max(2000).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.startDate && d.endDate) return new Date(d.endDate) >= new Date(d.startDate);
      return true;
    },
    { message: 'End date must be after start date', path: ['endDate'] },
  );

type FormValues = z.infer<typeof schema>;

interface Props {
  project: Project;
  onClose: () => void;
}

export function EditProjectModal({ project, onClose }: Props) {
  const qc = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project.name,
      description: project.description ?? '',
      startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
      endDate: project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : '',
    },
  });

  const update = useMutation({
    mutationFn: (d: FormValues) =>
      projectsApi.update(project.id, {
        name: d.name,
        description: d.description || undefined,
        startDate: d.startDate || null,
        endDate: d.endDate || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] });
      void qc.invalidateQueries({ queryKey: ['project', project.id] });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit((d) => update.mutate(d))}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Project name *</Label>
              <Input {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-[var(--error)]">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} {...form.register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input type="date" {...form.register('startDate')} />
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input type="date" {...form.register('endDate')} />
                {form.formState.errors.endDate && (
                  <p className="text-xs text-[var(--error)]">
                    {form.formState.errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            {update.isError && (
              <p className="text-xs text-[var(--error)]">Failed to save changes. Please try again.</p>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
