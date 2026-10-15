import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  Ban,
  Download,
  Clock,
  Layers,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Terminal,
  ShieldCheck,
  History,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../lib/api';
import { Task, TaskLogEntry, TaskEvent, TaskAttempt } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [logs, setLogs] = useState<TaskLogEntry[]>([]);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [attempts, setAttempts] = useState<TaskAttempt[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'results' | 'attempts'>('overview');
  const [logFilter, setLogFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const loadAll = async () => {
    if (!id) return;
    try {
      const [tRes, lRes, eRes, aRes] = await Promise.all([
        api.getTask(id),
        api.getTaskLogs(id),
        api.getTaskEvents(id),
        api.getTaskAttempts(id),
      ]);
      setTask(tRes.task);
      setLogs(lRes.logs);
      setEvents(eRes.events);
      setAttempts(aRes.attempts);
    } catch (err) {
      console.error('Failed to load task details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  // Real-time SSE updates
  useEffect(() => {
    const eventSource = new EventSource('/api/v1/tasks/stream');
    eventSource.addEventListener('task_updated', (e) => {
      try {
        const updatedTask: Task = JSON.parse(e.data);
        if (updatedTask.id === id) {
          setTask(updatedTask);
          // refresh logs and events
          api.getTaskLogs(id).then(r => setLogs(r.logs));
          api.getTaskEvents(id).then(r => setEvents(r.events));
          api.getTaskAttempts(id).then(r => setAttempts(r.attempts));
        }
      } catch {
        // ignore
      }
    });

    return () => eventSource.close();
  }, [id]);

  const handleCopyId = () => {
    if (!task) return;
    navigator.clipboard.writeText(task.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleRetry = async () => {
    if (!task) return;
    setActionLoading(true);
    try {
      await api.retryTask(task.id);
      setRetryModalOpen(false);
      loadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!task) return;
    setActionLoading(true);
    try {
      await api.cancelTask(task.id);
      setCancelModalOpen(false);
      loadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const filteredLogs = logs.filter(l => (logFilter === 'all' ? true : l.level === logFilter));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <span className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin mr-3" />
        Loading execution telemetry...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-slate-400 text-sm">Task not found in canonical store.</p>
        <button
          onClick={() => navigate('/tasks')}
          className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
        >
          Return to Task Queue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tasks')}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white truncate">{task.taskName}</h2>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
              <span>{task.publicId}</span>
              <span>·</span>
              <button
                onClick={handleCopyId}
                className="hover:text-slate-200 inline-flex items-center gap-1 transition-colors"
                title="Copy internal UUID"
              >
                <span>{task.id}</span>
                {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Download Artifact */}
          {task.status === 'succeeded' && task.result?.fileName && (
            <a
              href={api.getDownloadUrl(task.id)}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Output</span>
            </a>
          )}

          {/* Retry Button */}
          {(task.status === 'failed' || task.status === 'cancelled') && (
            <button
              onClick={() => setRetryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Workload</span>
            </button>
          )}

          {/* Cancel Button */}
          {(task.status === 'running' || task.status === 'queued' || task.status === 'pending_dispatch') && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Ban className="w-4 h-4" />
              <span>Cancel Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Progress Monitor Card */}
      <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400 uppercase font-semibold">Execution Progress:</span>
            <span className="font-medium text-slate-200">{task.currentStage}</span>
          </div>
          <span className="font-mono font-bold text-sky-400 text-sm">{task.progress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              task.status === 'failed'
                ? 'bg-rose-500'
                : task.status === 'cancelled'
                ? 'bg-slate-500'
                : task.status === 'succeeded'
                ? 'bg-emerald-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${task.progress}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
          <span>Worker: {task.assignedWorker || 'Pending Assignment'}</span>
          <span>Attempt: {task.attemptCount} of {task.maxAttempts}</span>
          <span>Duration: {formatDuration(task.durationMs)}</span>
          <span>Queue: [{task.queue}]</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex items-center gap-2">
        {[
          { id: 'overview', label: 'Overview & Metadata', icon: Layers },
          { id: 'logs', label: `Worker Logs (${logs.length})`, icon: Terminal },
          { id: 'results', label: 'Results & Artifacts', icon: FileText },
          { id: 'attempts', label: `Attempts History (${attempts.length})`, icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-indigo-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Metadata Grid */}
            <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-4">
              <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                Canonical Task Metadata
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">Submitted By</span>
                  <span className="text-slate-200 mt-1 block">{task.userName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Workload Type</span>
                  <span className="text-slate-200 mt-1 block">{task.taskType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Assigned Queue</span>
                  <span className="text-indigo-400 mt-1 block">[{task.queue}]</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Created At</span>
                  <span className="text-slate-200 mt-1 block">
                    {new Date(task.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Celery Task UUID</span>
                  <span className="text-slate-200 mt-1 block truncate" title={task.celeryTaskId}>
                    {task.celeryTaskId || 'pending_ack'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Idempotency Key</span>
                  <span className="text-slate-200 mt-1 block truncate" title={task.idempotencyKey}>
                    {task.idempotencyKey || 'none'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ingested Payload JSON */}
            <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-2">
              <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                Ingested Request Payload
              </h3>
              <pre className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto">
                {JSON.stringify(task.payload, null, 2)}
              </pre>
            </div>
          </div>

          {/* Execution Events Timeline */}
          <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl">
            <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-4">
              Execution Event Timeline
            </h3>
            <div className="space-y-4">
              {events.map((ev, i) => (
                <div key={ev.id || i} className="flex items-start gap-3 relative">
                  {i < events.length - 1 && (
                    <div className="absolute left-2.5 top-5 bottom-0 w-px bg-slate-800" />
                  )}
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono font-semibold text-slate-200">{ev.event}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{ev.details}</p>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Logs */}
      {activeTab === 'logs' && (
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">SEVERITY FILTER:</span>
              <div className="flex items-center gap-1">
                {['all', 'INFO', 'DEBUG', 'WARN', 'ERROR'].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setLogFilter(lvl)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                      logFilter === lvl
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500">{filteredLogs.length} entries</span>
          </div>

          <div className="font-mono text-xs bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-2 max-h-[500px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-500 text-center py-6">No logs for selected severity filter.</div>
            ) : (
              filteredLogs.map(log => {
                const colorMap: Record<string, string> = {
                  INFO: 'text-sky-400',
                  DEBUG: 'text-slate-400',
                  WARN: 'text-amber-400',
                  ERROR: 'text-rose-400 font-semibold',
                };
                return (
                  <div key={log.id} className="flex items-start gap-3 leading-relaxed hover:bg-slate-900/50 p-1 rounded">
                    <span className="text-slate-500 shrink-0 select-none">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={`w-14 uppercase font-bold shrink-0 text-[11px] ${colorMap[log.level] || 'text-slate-300'}`}>
                      [{log.level}]
                    </span>
                    <span className="text-slate-300 break-words flex-1">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Results & Artifacts */}
      {activeTab === 'results' && (
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-4">
          <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
            Output Artifacts &amp; Computation Results
          </h3>

          {task.status !== 'succeeded' ? (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-lg text-center space-y-2">
              <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-200">Task is not in a succeeded state.</p>
              <p className="text-xs text-slate-400">
                {task.status === 'running'
                  ? 'Artifacts will be published once the Celery worker finalizes processing.'
                  : task.safeErrorMessage || 'Execution terminated without generating output artifacts.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {task.result?.fileName && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{task.result.fileName}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {task.result.fileType} · {(task.result.fileSize ? (task.result.fileSize / 1024).toFixed(1) : 0)} KB
                      </div>
                    </div>
                  </div>
                  <a
                    href={api.getDownloadUrl(task.id)}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </a>
                </div>
              )}

              {task.result?.summary && (
                <div className="space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase">Execution Summary:</span>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto">
                    {JSON.stringify(task.result.summary, null, 2)}
                  </pre>
                </div>
              )}

              {task.result?.dataPreview && (
                <div className="space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase">Data Preview:</span>
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-mono">
                        <tr>
                          {Object.keys(task.result.dataPreview[0] || {}).map(k => (
                            <th key={k} className="p-2.5 uppercase border-b border-slate-800">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                        {task.result.dataPreview.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-800/40">
                            {Object.values(row).map((v: any, j) => (
                              <td key={j} className="p-2.5">{String(v)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Attempts */}
      {activeTab === 'attempts' && (
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-3">
          <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-2">
            Historical Attempt Executions
          </h3>
          <div className="space-y-2">
            {attempts.map(att => (
              <div
                key={att.attemptNumber}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-200">Attempt #{att.attemptNumber}</span>
                    <span className="text-slate-400 font-mono">· {att.workerName}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    Started: {new Date(att.startedAt).toLocaleTimeString()} · Duration: {formatDuration(att.durationMs)}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono text-xs font-semibold uppercase ${
                      att.status === 'succeeded'
                        ? 'text-emerald-400'
                        : att.status === 'failed'
                        ? 'text-rose-400'
                        : 'text-sky-400'
                    }`}
                  >
                    {att.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={retryModalOpen}
        title="Retry Task Workload?"
        message="This will re-enqueue the job with incremented attempt counter."
        confirmLabel="Retry"
        variant="primary"
        isLoading={actionLoading}
        onConfirm={handleRetry}
        onClose={() => setRetryModalOpen(false)}
      />

      <ConfirmModal
        isOpen={cancelModalOpen}
        title="Cancel In-Flight Task?"
        message="A cancellation signal will be delivered to the Celery worker process."
        confirmLabel="Cancel Task"
        variant="danger"
        isLoading={actionLoading}
        onConfirm={handleCancel}
        onClose={() => setCancelModalOpen(false)}
      />
    </div>
  );
};
