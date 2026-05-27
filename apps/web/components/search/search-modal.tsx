'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, FolderKanban, CheckSquare, X } from 'lucide-react';
import { searchApi } from '@/lib/search-api';
import { PRIORITY_DOT } from '@/components/tasks/task-priority-badge';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

type ResultItem =
  | { kind: 'project'; id: string; name: string; status: string }
  | { kind: 'task'; id: string; title: string; status: string; priority: string; projectId: string; projectName: string };

export function SearchModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQ = useDebounce(q, 250);

  // Listen for Cmd+K / Ctrl+K from anywhere, and the custom topbar event
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    function handleOpen() { setOpen(true); }
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('open-search', handleOpen);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('open-search', handleOpen);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQ('');
      setActiveIdx(0);
    }
  }, [open]);

  const { data, isFetching } = useQuery({
    queryKey: ['search', debouncedQ],
    queryFn: () => searchApi.search(debouncedQ).then((r) => r.data),
    enabled: debouncedQ.length >= 2,
    staleTime: 10_000,
  });

  const items: ResultItem[] = [];
  if (data) {
    for (const p of data.projects) {
      items.push({ kind: 'project', id: p.id, name: p.name, status: p.status });
    }
    for (const t of data.tasks) {
      items.push({
        kind: 'task',
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectId: t.projectId,
        projectName: t.project.name,
      });
    }
  }

  const navigate = useCallback((item: ResultItem) => {
    if (item.kind === 'project') {
      router.push(`/projects/${item.id}`);
    } else {
      router.push(`/projects/${item.projectId}`);
    }
    setOpen(false);
  }, [router]);

  function handleKeyNav(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && items[activeIdx]) {
      navigate(items[activeIdx]);
    }
  }

  if (!open) return null;

  const hasResults = items.length > 0;
  const projects = items.filter((i) => i.kind === 'project');
  const tasks = items.filter((i) => i.kind === 'task');
  let projectOffset = 0;
  const taskOffset = projects.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow-lg)] overflow-hidden">
        {/* Input row */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActiveIdx(0); }}
            onKeyDown={handleKeyNav}
            placeholder="Search projects and tasks…"
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
          />
          {q && (
            <button onClick={() => setQ('')}>
              <X className="h-3.5 w-3.5 text-[var(--text-muted)] hover:text-[var(--text)]" />
            </button>
          )}
          <kbd className="text-[10px] text-[var(--text-muted)] font-mono border border-[var(--border)] rounded px-1 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
          {debouncedQ.length < 2 ? (
            <div className="py-10 text-center text-xs text-[var(--text-muted)]">
              Type at least 2 characters to search…
            </div>
          ) : isFetching ? (
            <div className="py-10 text-center text-xs text-[var(--text-muted)]">
              Searching…
            </div>
          ) : !hasResults ? (
            <div className="py-10 text-center text-xs text-[var(--text-muted)]">
              No results for <strong>"{debouncedQ}"</strong>
            </div>
          ) : (
            <>
              {projects.length > 0 && (
                <section>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Projects
                    </span>
                  </div>
                  {projects.map((item, i) => {
                    if (item.kind !== 'project') return null;
                    const idx = i;
                    return (
                      <button
                        key={item.id}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          activeIdx === idx
                            ? 'bg-[var(--primary-softer)]'
                            : 'hover:bg-[var(--surface-2)]',
                        )}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => navigate(item)}
                      >
                        <FolderKanban className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                        <span className="flex-1 text-sm text-[var(--text)] truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                        </span>
                      </button>
                    );
                  })}
                </section>
              )}

              {tasks.length > 0 && (
                <section>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Tasks
                    </span>
                  </div>
                  {tasks.map((item, i) => {
                    if (item.kind !== 'task') return null;
                    const idx = taskOffset + i;
                    return (
                      <button
                        key={item.id}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          activeIdx === idx
                            ? 'bg-[var(--primary-softer)]'
                            : 'hover:bg-[var(--surface-2)]',
                        )}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => navigate(item)}
                      >
                        <span
                          className={cn(
                            'h-2 w-2 shrink-0 rounded-full',
                            PRIORITY_DOT[item.priority],
                          )}
                        />
                        <CheckSquare className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text)] truncate">{item.title}</p>
                          <p className="text-[10px] text-[var(--text-muted)] truncate">
                            {item.projectName}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </section>
              )}
              <div className="h-2" />
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-[var(--border)] bg-[var(--surface-2)]">
          <span className="text-[10px] text-[var(--text-muted)]">
            <kbd className="font-mono border border-[var(--border)] rounded px-0.5">↑↓</kbd> navigate
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            <kbd className="font-mono border border-[var(--border)] rounded px-0.5">↵</kbd> open
          </span>
        </div>
      </div>
    </div>
  );
}
