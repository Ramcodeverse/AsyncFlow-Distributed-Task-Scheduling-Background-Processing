import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Ban,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileCheck2
} from 'lucide-react';
import { api } from '../lib/api';
import { Task, TaskStatus, TaskType, TaskPriority } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const Tasks: React.FC = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(12);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Confirmation modals state
  const [retryModal, setRetryModal] = useState<{ isOpen: boolean; task: Task | null }>({
    isOpen: false,
    task: null,
  });
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; task: Task | null }>({
    isOpen: false,
    task: null,
  });

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.getTasks({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        taskType: typeFilter !== 'all' ? typeFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: search.trim() ? search.trim() : undefined,
        page,
        limit,
      });
      setTasks(res.tasks);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [page, statusFilter, typeFilter, priorityFilter]);

  // Handle SSE live stream
  useEffect(() => {
    const eventSource = new EventSource('/api/v1/tasks/stream');
    eventSource.addEventListener('task_updated', (e) => {
      try {
        const updatedTask = JSON.parse(e.data);
        setTasks(prev => {
          const index = prev.findIndex(t => t.id === updatedTask.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = updatedTask;
            return next;
          }
          return prev;
        });
      } catch {
        // ignore
      }
    });

    return () => eventSource.close();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTasks();
  };

  const handleConfirmRetry = async () => {
    if (!retryModal.task) return;
    setActionLoading(true);
    try {
      await api.retryTask(retryModal.task.id);
      setRetryModal({ isOpen: false, task: null });
      loadTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.task) return;
    setActionLoading(true);
    try {
      await api.cancelTask(cancelModal.task.id);
      setCancelModal({ isOpen: false, task: null });
      loadTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Distributed Task Queue</h2>
          <p className="text-xs text-slate-400 mt-1">
            Canonical task registry in PostgreSQL with Celery worker execution tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadTasks()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/tasks/new')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Task</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by task name, task ID (e.g. 'af-tsk-8812c3'), or owner..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </form>

          {/* Status Tabs (Interactive segmented control) */}
          <div className="flex items-center overflow-x-auto gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
            {[
              { id: 'all', label: 'All' },
              { id: 'running', label: 'Running' },
              { id: 'queued', label: 'Queued' },
              { id: 'succeeded', label: 'Succeeded' },
              { id: 'failed', label: 'Failed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono">TYPE:</span>
            <select
              value={typeFilter}
              onChange={e => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="pdf_report">PDF Report</option>
              <option value="csv_report">CSV Report</option>
              <option value="data_processing">Data Processing</option>
              <option value="file_validation">File Validation</option>
              <option value="simulated_job">Simulated Workload</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono">PRIORITY:</span>
            <select
              value={priorityFilter}
              onChange={e => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="ml-auto text-slate-500 font-mono text-[11px]">
            Found {total} total task records
          </div>
        </div>
      </div>

      {/* Task Table */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 tracking-wider bg-slate-950/40">
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Task Name &amp; Queue</th>
                <th className="py-3 px-4">Status &amp; Progress</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No matching background tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-semibold text-slate-200 group-hover:text-indigo-400">
                        {task.publicId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{task.taskName}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {task.taskType} · [{task.queue}]
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <StatusBadge status={task.status} />
                        {task.status === 'running' && (
                          <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-sky-400 h-1.5 transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {task.attemptCount} / {task.maxAttempts}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {task.status === 'running' ? (
                        <span className="text-sky-400">{task.progress}%</span>
                      ) : (
                        formatDuration(task.durationMs)
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          title="View Execution Details"
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Download button for completed jobs */}
                        {task.status === 'succeeded' && task.result?.fileName && (
                          <a
                            href={api.getDownloadUrl(task.id)}
                            download
                            title="Download Generated Artifact"
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}

                        {/* Retry button for failed/cancelled jobs */}
                        {(task.status === 'failed' || task.status === 'cancelled') && (
                          <button
                            onClick={() => setRetryModal({ isOpen: true, task })}
                            title="Retry Task"
                            className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 rounded transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Cancel button for in-flight tasks */}
                        {(task.status === 'queued' || task.status === 'running' || task.status === 'pending_dispatch') && (
                          <button
                            onClick={() => setCancelModal({ isOpen: true, task })}
                            title="Request Cooperative Cancellation"
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Retry Confirmation Modal */}
      <ConfirmModal
        isOpen={retryModal.isOpen}
        title="Retry Background Task?"
        message={`This will reset the task state, increment the attempt generation, and dispatch it back into the [${retryModal.task?.queue}] Celery queue.`}
        confirmLabel="Retry Task"
        variant="primary"
        isLoading={actionLoading}
        onConfirm={handleConfirmRetry}
        onClose={() => setRetryModal({ isOpen: false, task: null })}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelModal.isOpen}
        title="Request Task Cancellation?"
        message="A cooperative cancellation interrupt signal will be sent to the assigned Celery worker. If already running, the worker will safely abort at the next milestone."
        confirmLabel="Cancel Task"
        variant="danger"
        isLoading={actionLoading}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelModal({ isOpen: false, task: null })}
      />
    </div>
  );
};
