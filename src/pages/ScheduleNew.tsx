import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { TaskType, TaskPriority, QueueName } from '../types';

export const ScheduleNew: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('Hourly Cluster Memory Reclaim');
  const [description, setDescription] = useState('Triggers background garbage collection and buffer cleanup');
  const [taskType, setTaskType] = useState<TaskType>('simulated_job');
  const [queue, setQueue] = useState<QueueName>('maintenance');
  const [priority, setPriority] = useState<TaskPriority>('low');
  const [cronExpression, setCronExpression] = useState('0 * * * *');
  const [timezone, setTimezone] = useState('UTC');
  const [overlapPolicy, setOverlapPolicy] = useState<'skip_if_running' | 'allow'>('skip_if_running');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cronPresets = [
    { label: 'Every 5 Minutes', expr: '*/5 * * * *' },
    { label: 'Hourly (Minute 0)', expr: '0 * * * *' },
    { label: 'Daily at 02:00 AM', expr: '0 2 * * *' },
    { label: 'Weekly (Sundays)', expr: '0 0 * * 0' },
    { label: 'Monthly (1st Day)', expr: '0 0 1 * *' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.createSchedule({
        name,
        description,
        taskType,
        queue,
        priority,
        cronExpression,
        timezone,
        overlapPolicy,
        payload: { automatedSchedule: true },
      });
      navigate('/schedules');
    } catch (err: any) {
      setError(err.message || 'Failed to create schedule');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/schedules')}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Create Periodic Schedule</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Celery Beat evaluates active schedules in UTC and dispatches jobs to Redis broker
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-lg text-rose-300 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Schedule Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Task Type</label>
            <select
              value={taskType}
              onChange={e => {
                const t = e.target.value as TaskType;
                setTaskType(t);
                if (t === 'pdf_report' || t === 'csv_report') setQueue('reports');
                else if (t === 'data_processing') setQueue('data_processing');
                else setQueue('maintenance');
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
            >
              <option value="simulated_job">Simulated Maintenance Job</option>
              <option value="data_processing">Dataset Processing</option>
              <option value="pdf_report">PDF Report Generation</option>
              <option value="csv_report">CSV Export</option>
              <option value="file_validation">File Schema Validation</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Target Queue</label>
            <select
              value={queue}
              onChange={e => setQueue(e.target.value as QueueName)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
            >
              <option value="maintenance">maintenance</option>
              <option value="reports">reports</option>
              <option value="data_processing">data_processing</option>
              <option value="default">default</option>
            </select>
          </div>
        </div>

        {/* Cron Configuration */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Cron Schedule Expression</label>
            <span className="text-[11px] font-mono text-indigo-400">Standard 5-Field Cron</span>
          </div>

          <input
            type="text"
            value={cronExpression}
            onChange={e => setCronExpression(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-emerald-400 focus:outline-none"
          />

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500 mr-1">Presets:</span>
            {cronPresets.map(p => (
              <button
                key={p.expr}
                type="button"
                onClick={() => setCronExpression(p.expr)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  cronExpression === p.expr
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Timezone</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
            >
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Overlap Policy</label>
            <select
              value={overlapPolicy}
              onChange={e => setOverlapPolicy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
            >
              <option value="skip_if_running">Skip If Running (Prevents Clumping)</option>
              <option value="allow">Allow Concurrent Executions</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => navigate('/schedules')}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Registering...' : 'Save Schedule'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
