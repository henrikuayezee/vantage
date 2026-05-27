'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { commentsApi } from '@/lib/comments-api';
import { projectsApi } from '@/lib/projects-api';
import { useAuthStore } from '@/stores/auth-store';

interface TaskCommentsProps {
  taskId: string;
  projectId: string;
}

// Highlight @Name mentions in rendered comment text
function CommentBody({ body }: { body: string }) {
  const parts = body.split(/(@\w[\w\s]*)/g);
  return (
    <p className="text-xs text-[var(--text)] mt-0.5 whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="font-medium text-[var(--primary)]">{part}</span>
        ) : (
          part
        ),
      )}
    </p>
  );
}

export function TaskComments({ taskId, projectId }: TaskCommentsProps) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [body, setBody] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention picker state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsApi.list(taskId).then((r) => r.data),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectsApi.getById(projectId).then((r) => r.data.members),
  });

  const addComment = useMutation({
    mutationFn: () => commentsApi.create(taskId, body, mentionedUserIds),
    onSuccess: () => {
      setBody('');
      setMentionedUserIds([]);
      void qc.invalidateQueries({ queryKey: ['comments', taskId] });
      void qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setBody(value);

    const cursor = e.target.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const between = textBeforeCursor.slice(atIndex + 1);
      if (!between.includes(' ') && !between.includes('\n')) {
        setMentionQuery(between);
        setMentionStart(atIndex);
        return;
      }
    }
    setMentionQuery(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && e.key === 'Escape') {
      setMentionQuery(null);
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (body.trim()) addComment.mutate();
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMentionQuery(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function insertMention(userId: string, displayName: string) {
    const cursor = textareaRef.current?.selectionStart ?? body.length;
    const insertion = `@${displayName}`;
    const newBody = body.slice(0, mentionStart) + insertion + ' ' + body.slice(cursor);
    setBody(newBody);
    setMentionedUserIds((prev) => prev.includes(userId) ? prev : [...prev, userId]);
    setMentionQuery(null);
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = mentionStart + insertion.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  }

  const filteredMembers = mentionQuery !== null
    ? members.filter((m) => {
        const full = `${m.user.firstName} ${m.user.lastName}`.toLowerCase();
        return full.includes(mentionQuery.toLowerCase()) && m.userId !== user?.id;
      })
    : [];

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-[var(--text)]">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="h-6 w-6 rounded-full bg-[var(--surface-2)] shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 rounded bg-[var(--surface-2)]" />
                <div className="h-8 w-full rounded bg-[var(--surface-2)]" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((c) => {
            const ini = `${c.author.firstName[0]}${c.author.lastName[0]}`.toUpperCase();
            return (
              <div key={c.id} className="flex gap-2">
                <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                  {c.author.avatarUrl && <AvatarImage src={c.author.avatarUrl} />}
                  <AvatarFallback className="text-[9px]">{ini}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-[var(--text)]">
                      {c.author.firstName} {c.author.lastName}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <CommentBody body={c.body} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">No comments yet.</p>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-1">
        <Avatar className="h-6 w-6 shrink-0 mt-1">
          {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
          <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1.5 relative">
          <Textarea
            ref={textareaRef}
            value={body}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment… type @ to mention (⌘↵ to submit)"
            rows={2}
            className="text-xs resize-none"
          />

          {/* Mention dropdown */}
          {mentionQuery !== null && filteredMembers.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute bottom-full mb-1 left-0 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg z-50 overflow-hidden"
            >
              {filteredMembers.map((m) => {
                const displayName = `${m.user.firstName} ${m.user.lastName}`;
                const ini = `${m.user.firstName[0]}${m.user.lastName[0]}`.toUpperCase();
                return (
                  <button
                    key={m.userId}
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--surface-2)] transition-colors text-left"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(m.userId, displayName);
                    }}
                  >
                    <Avatar className="h-5 w-5 shrink-0">
                      {m.user.avatarUrl && <AvatarImage src={m.user.avatarUrl} />}
                      <AvatarFallback className="text-[8px]">{ini}</AvatarFallback>
                    </Avatar>
                    <span className="text-[var(--text)]">{displayName}</span>
                  </button>
                );
              })}
            </div>
          )}

          <Button
            size="sm"
            disabled={!body.trim() || addComment.isPending}
            onClick={() => addComment.mutate()}
            className="h-7 gap-1.5"
          >
            <Send className="h-3 w-3" />
            {addComment.isPending ? 'Sending…' : 'Comment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
