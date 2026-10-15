import React from 'react';
import { TaskPriority } from '../../types';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const configs: Record<TaskPriority, { label: string; textClass: string; bgClass: string }> = {
    critical: {
      label: 'CRITICAL',
      textClass: 'text-rose-400',
      bgClass: 'bg-rose-950/60 border border-rose-800/50',
    },
    high: {
      label: 'HIGH',
      textClass: 'text-amber-400',
      bgClass: 'bg-amber-950/50 border border-amber-800/40',
    },
    normal: {
      label: 'NORMAL',
      textClass: 'text-slate-300',
      bgClass: 'bg-slate-800/70 border border-slate-700/50',
    },
    low: {
      label: 'LOW',
      textClass: 'text-slate-400',
      bgClass: 'bg-slate-900/60 border border-slate-800/50',
    },
  };

  const config = configs[priority] || configs.normal;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${config.bgClass} ${config.textClass} ${className}`}
    >
      {config.label}
    </span>
  );
};
