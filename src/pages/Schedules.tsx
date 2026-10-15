import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  PlusCircle,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { api } from '../lib/api';
import { Schedule } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const Schedules: React.FC = () => {
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; schedule: Schedule | null }>({
    isOpen: false,
    schedule: null,
  });

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.getSchedules();
      setSchedules(res.schedules);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handlePauseResume = async (sch: Schedule) => {
    try {
      if (sch.status === 'active') {
        await api.pauseSchedule(sch.id);
      } else {
        await api.resumeSchedule(sch.id);
      }
      loadSchedules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerNow = async (sch: Schedule) => {
    setTriggeringId(sch.id);
    try {
      const res = await api.triggerSchedule(sch.id);
      loadSchedules();
      // Show link to triggered task
      navigate(`/tasks/${res.taskId}`);
    } catch (err) {
      console.error(err);
      setTriggeringId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.schedule) return;
    try {
      await api.deleteSchedule(deleteModal.schedule.id);
      setDeleteModal({ isOpen: false, schedule: null });
      loadSchedules();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Periodic Schedules (Celery Beat)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Database-backed schedule definitions dispatched by Celery Beat scheduler with timezone handling
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadSchedules()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/schedules/new')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      {/* Schedules Cards / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map(sch => (
          <div
            key={sch.id}
            className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{sch.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sch.description || 'No description'}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium ${
                    sch.status === 'active'
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${sch.status === 'active' ? 'bg-emerald-400' : 'bg-slate-400'}`}
                  />
                  <span className="capitalize">{sch.status}</span>
                </span>
              </div>

              {/* Schedule Info Pills */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">CRON EXPRESSION</span>
                  <span className="text-indigo-400 mt-0.5 block">{sch.cronExpression}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">TIMEZONE</span>
                  <span className="text-slate-300 mt-0.5 block">{sch.timezone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">NEXT DISPATCH</span>
                  <span className="text-amber-400 mt-0.5 block">
                    {new Date(sch.nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">TOTAL EXECUTIONS</span>
                  <span className="text-slate-300 mt-0.5 block">{sch.totalRuns} runs</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
              <span className="font-mono text-slate-500 text-[11px]">Queue: [{sch.queue}]</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerNow(sch)}
                  disabled={triggeringId === sch.id}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 rounded transition-colors"
                  title="Execute schedule immediately"
                >
                  <Zap className={`w-3.5 h-3.5 ${triggeringId === sch.id ? 'animate-spin' : ''}`} />
                  <span>Run Now</span>
                </button>

                <button
                  onClick={() => handlePauseResume(sch)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                >
                  {sch.status === 'active' ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Resume</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setDeleteModal({ isOpen: true, schedule: sch })}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                  title="Delete Schedule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Schedule?"
        message={`Are you sure you want to delete "${deleteModal.schedule?.name}"? Celery Beat will cease automated dispatches.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModal({ isOpen: false, schedule: null })}
      />
    </div>
  );
};
