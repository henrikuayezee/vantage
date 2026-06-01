'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isPast } from 'date-fns';
import { Plus, Pencil, Trash2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { milestonesApi, type Milestone } from '@/lib/tasks-api';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@vantage/types';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#0D7A75',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#10b981',
];

interface MsForm {
  title: string;
  dueDate: string;
  color: string;
}

const DEFAULT_FORM: MsForm = { title: '', dueDate: '', color: PRESET_COLORS[0] };

interface Props {
  projectId: string;
}

export function MilestonesPanel({ projectId }: Props) {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const canManage =
    currentUser?.role === Role.ADMIN || currentUser?.role === Role.PROJECT_MANAGER;

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MsForm>(DEFAULT_FORM);

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => milestonesApi.list(projectId).then((r) => r.data),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['milestones', projectId] });
    void qc.invalidateQueries({ queryKey: ['gantt', projectId] });
  };

  const create = useMutation({
    mutationFn: () => milestonesApi.create(projectId, form),
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
      setForm(DEFAULT_FORM);
    },
  });

  const update = useMutation({
    mutationFn: () => milestonesApi.update(projectId, editingId!, form),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      setForm(DEFAULT_FORM);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => milestonesApi.delete(projectId, id),
    onSuccess: invalidate,
  });

  const startEdit = (ms: Milestone) => {
    setShowCreate(false);
    setEditingId(ms.id);
    setForm({
      title: ms.title,
      dueDate: ms.dueDate.slice(0, 10),
      color: ms.color ?? PRESET_COLORS[0],
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowCreate(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[var(--surface-2)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text)]">
          Milestones{' '}
          <span className="text-[var(--text-muted)] font-normal">({milestones.length})</span>
        </h2>
        {canManage && !showCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            New milestone
          </Button>
        )}
      </div>

      {showCreate && canManage && (
        <MilestoneForm
          form={form}
          onChange={setForm}
          onSubmit={() => create.mutate()}
          onCancel={() => { setShowCreate(false); setForm(DEFAULT_FORM); }}
          pending={create.isPending}
          submitLabel="Create milestone"
        />
      )}

      {milestones.length === 0 && !showCreate ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-[var(--border)] text-center">
          <Flag className="h-8 w-8 text-[var(--text-muted)] mb-3" />
          <p className="text-sm font-medium text-[var(--text)]">No milestones yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
            Milestones mark key deadlines and let you group related tasks toward a goal.
          </p>
          {canManage && (
            <Button size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              New milestone
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {milestones.map((ms) =>
            editingId === ms.id ? (
              <MilestoneForm
                key={ms.id}
                form={form}
                onChange={setForm}
                onSubmit={() => update.mutate()}
                onCancel={() => { setEditingId(null); setForm(DEFAULT_FORM); }}
                pending={update.isPending}
                submitLabel="Save"
              />
            ) : (
              <MilestoneRow
                key={ms.id}
                milestone={ms}
                canManage={canManage}
                onEdit={() => startEdit(ms)}
                onDelete={() => remove.mutate(ms.id)}
                deleting={remove.isPending}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function MilestoneRow({
  milestone: ms,
  canManage,
  onEdit,
  onDelete,
  deleting,
}: {
  milestone: Milestone;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const total = ms.totalTasks ?? 0;
  const done = ms.doneTasks ?? 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const color = ms.color ?? PRESET_COLORS[0];
  const overdue = isPast(new Date(ms.dueDate)) && done < total;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors group">
      <span className="text-base leading-none shrink-0" style={{ color }}>◆</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-sm font-medium text-[var(--text)] truncate" title={ms.title}>{ms.title}</span>
          <span
            className={cn(
              'text-[10px] font-medium shrink-0',
              overdue ? 'text-[var(--error)]' : 'text-[var(--text-muted)]',
            )}
          >
            {format(new Date(ms.dueDate), 'MMM d, yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-[10px] text-[var(--text-muted)] shrink-0 tabular-nums">
            {done}/{total}
          </span>
        </div>
      </div>

      {canManage && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={onEdit} title="Edit milestone">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            disabled={deleting}
            title="Delete milestone"
          >
            <Trash2 className="h-3.5 w-3.5 text-[var(--error)]" />
          </Button>
        </div>
      )}
    </div>
  );
}

function MilestoneForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  pending,
  submitLabel,
}: {
  form: MsForm;
  onChange: (f: MsForm) => void;
  onSubmit: () => void;
  onCancel: () => void;
  pending: boolean;
  submitLabel: string;
}) {
  const isValid = form.title.trim().length > 0 && form.dueDate.length > 0;

  return (
    <div className="p-3 rounded-xl border border-[var(--primary-soft)] bg-[var(--surface)] space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Title *</Label>
          <Input
            placeholder="Milestone name"
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Due date *</Label>
          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) => onChange({ ...form, dueDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Color</Label>
        <div className="flex gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              className="h-6 w-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1"
              style={{
                background: c,
                outline: form.color === c ? `2px solid ${c}` : undefined,
                outlineOffset: form.color === c ? '2px' : undefined,
              }}
              onClick={() => onChange({ ...form, color: c })}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!isValid || pending} onClick={onSubmit}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
