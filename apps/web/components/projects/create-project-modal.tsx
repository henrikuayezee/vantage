'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { projectsApi } from '@/lib/projects-api';

function deriveKey(name: string): string {
  // Only consider words that contain at least one letter
  const letterWords = name
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, ''))
    .filter(Boolean);

  if (letterWords.length === 0) return '';
  if (letterWords.length === 1) return letterWords[0].slice(0, 4).toUpperCase();

  // Multiple meaningful words → initials (up to 5)
  const initials = letterWords.map((w) => w[0]).join('').slice(0, 5);
  // If initials collapse to 1 char (e.g. only one word had letters), use first word
  return (initials.length >= 2 ? initials : letterWords[0].slice(0, 4)).toUpperCase();
}

const schema = z
  .object({
    name: z.string().min(1, 'Name is required').max(120),
    key: z.string().regex(/^[A-Z]{2,5}$/, '2–5 uppercase letters'),
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
  onClose: () => void;
}

export function CreateProjectModal({ onClose }: Props) {
  const qc = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { key: '' },
  });

  const watchedName = form.watch('name');

  useEffect(() => {
    if (!form.getFieldState('key').isDirty) {
      form.setValue('key', deriveKey(watchedName ?? ''));
    }
  }, [watchedName]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = useMutation({
    mutationFn: (d: FormValues) =>
      projectsApi.create({
        name: d.name,
        key: d.key,
        description: d.description || undefined,
        startDate: d.startDate || undefined,
        endDate: d.endDate || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Create a new project for your team.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit((d) => create.mutate(d))}>
          <DialogBody className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label>Project name *</Label>
                <Input placeholder="e.g. Website Redesign" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-xs text-[var(--error)]">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="w-24 space-y-1.5">
                <Label>Key</Label>
                <Input
                  placeholder="WEB"
                  className="font-mono uppercase"
                  {...form.register('key', {
                    onChange: (e) => {
                      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
                      form.setValue('key', e.target.value, { shouldDirty: true });
                    },
                  })}
                />
                {form.formState.errors.key && (
                  <p className="text-xs text-[var(--error)]">{form.formState.errors.key.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="What is this project about?"
                rows={3}
                {...form.register('description')}
              />
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

            {create.isError && (
              <p className="text-xs text-[var(--error)]">
                Failed to create project. Please try again.
              </p>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
