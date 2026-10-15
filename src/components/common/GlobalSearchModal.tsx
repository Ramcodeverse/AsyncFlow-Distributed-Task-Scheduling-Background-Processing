import React, { useState, useEffect } from 'react';
import { Search, X, Layers, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Task, Schedule } from '../../types';
import { StatusBadge } from './StatusBadge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setTasks([]);
      setSchedules([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [taskRes, schRes] = await Promise.all([
          api.getTasks({ search: query, limit: 6 }),
          api.getSchedules(),
        ]);
        setTasks(taskRes.tasks);
        setSchedules(
          schRes.schedules.filter(
            s =>
              s.name.toLowerCase().includes(query.toLowerCase()) ||
              s.taskType.toLowerCase().includes(query.toLowerCase())
          )
        );
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-900/90">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks by ID or name, schedules, queues (e.g. 'pdf', 'task-101')..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8 text-sm text-slate-500">
              <span className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin mr-2" />
              Searching indexed tasks and schedules...
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-8 text-sm text-slate-500">
              Type to search any background task ID, public reference, or periodic schedule definition.
            </div>
          )}

          {!loading && query && tasks.length === 0 && schedules.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-500">
              No matching tasks or schedules found for &ldquo;{query}&rdquo;
            </div>
          )}

          {tasks.length > 0 && (
            <div>
              <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Tasks ({tasks.length})
              </div>
              <div className="space-y-1.5">
                {tasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => {
                      onClose();
                      navigate(`/tasks/${task.id}`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-left transition-colors group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-300">{task.publicId}</span>
                        <StatusBadge status={task.status} />
                      </div>
                      <div className="text-sm font-medium text-slate-200 truncate mt-1">{task.taskName}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {schedules.length > 0 && (
            <div>
              <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Schedules ({schedules.length})
              </div>
              <div className="space-y-1.5">
                {schedules.map(sch => (
                  <button
                    key={sch.id}
                    onClick={() => {
                      onClose();
                      navigate('/schedules');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-left transition-colors group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-sm font-medium text-slate-200">{sch.name}</div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">{sch.cronDescription}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Navigate with mouse or keyboard</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
};
