import React from 'react';
import { TaskStatus } from '../../types';

interface StatusBadgeProps {
  status: TaskStatus;
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showDot = true, className = '' }) => {
  const configs: Record<TaskStatus, { label: string; dotClass: string; textClass: string; bgClass: string }> = {
    succeeded: {
      label: 'Succeeded',
      dotClass: 'bg-emerald-400',
      textClass: 'text-emerald-400',
      bgClass: 'bg-emerald-950/40 border border-emerald-800/40',
    },
    running: {
      label: 'Running',
      dotClass: 'bg-sky-400 animate-pulse',
      textClass: 'text-sky-400',
      bgClass: 'bg-sky-950/40 border border-sky-800/40',
    },
    queued: {
      label: 'Queued',
      dotClass: 'bg-amber-400',
      textClass: 'text-amber-400',
      bgClass: 'bg-amber-950/40 border border-amber-800/40',
    },
    pending_dispatch: {
      label: 'Pending Dispatch',
      dotClass: 'bg-indigo-400 animate-pulse',
      textClass: 'text-indigo-400',
      bgClass: 'bg-indigo-950/40 border border-indigo-800/40',
    },
    retrying: {
      label: 'Retrying',
      dotClass: 'bg-purple-400 animate-pulse',
      textClass: 'text-purple-400',
      bgClass: 'bg-purple-950/40 border border-purple-800/40',
    },
    failed: {
      label: 'Failed',
      dotClass: 'bg-rose-400',
      textClass: 'text-rose-400',
      bgClass: 'bg-rose-950/40 border border-rose-800/40',
    },
    cancel_requested: {
      label: 'Cancel Requested',
      dotClass: 'bg-orange-400',
      textClass: 'text-orange-400',
      bgClass: 'bg-orange-950/40 border border-orange-800/40',
    },
    cancelled: {
      label: 'Cancelled',
      dotClass: 'bg-slate-400',
      textClass: 'text-slate-400',
      bgClass: 'bg-slate-900 border border-slate-700/50',
    },
  };

  const config = configs[status] || configs.cancelled;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium tracking-wide ${config.bgClass} ${config.textClass} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />}
      <span>{config.label}</span>
    </span>
  );
};
