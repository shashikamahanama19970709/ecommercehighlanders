'use client';

import { X } from 'lucide-react';

export type Notice =
  | {
      type: 'success' | 'error' | 'info';
      message: string;
    }
  | null;

export function NoticeBanner({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  if (!notice || !notice.message.trim()) return null;

  const styles =
    notice.type === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : notice.type === 'error'
        ? 'border-red-200 bg-red-50 text-red-800'
        : 'border-border bg-muted text-foreground';

  return (
    <div
      className={`mb-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}
      role={notice.type === 'error' ? 'alert' : 'status'}
    >
      <div className="min-w-0">
        <p className="break-words">{notice.message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer rounded-md p-1 hover:bg-black/5"
        aria-label="Dismiss message"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
