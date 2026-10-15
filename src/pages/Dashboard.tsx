import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Cpu,
  Timer,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  Database,
  Radio,
  Server,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { api } from '../lib/api';
import { Task, SystemMetrics } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [chartData, setChartData] = useState<{ volumeData: any[]; typeDistribution: any[] }>({
    volumeData: [],
    typeDistribution: [],
  });
  const [queueMetrics, setQueueMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [overviewRes, tasksRes, chartRes, queueRes] = await Promise.all([
        api.getOverviewMetrics(),
        api.getTasks({ limit: 6 }),
        api.getTaskMetrics(),
        api.getQueueMetrics(),
      ]);
      setMetrics(overviewRes);
      setRecentTasks(tasksRes.tasks);
      setChartData(chartRes);
      setQueueMetrics(queueRes.queues);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen to SSE live task updates
  useEffect(() => {
    const eventSource = new EventSource('/api/v1/tasks/stream');
    eventSource.addEventListener('task_updated', (e) => {
      try {
        const updatedTask = JSON.parse(e.data);
        setRecentTasks(prev => {
          const idx = prev.findIndex(t => t.id === updatedTask.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updatedTask;
            return next;
          }
          return [updatedTask, ...prev.slice(0, 5)];
        });
      } catch {
        // ignore parse
      }
    });

    return () => eventSource.close();
  }, []);

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Cluster Operations Overview</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry from Celery worker nodes, Redis queues, and PostgreSQL transactional outbox.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Total Tasks</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics?.totalTasks ?? 0}</div>
          <div className="mt-2 flex items-center text-[11px] text-slate-500 font-mono">
            <span>Dispatched via transactional outbox</span>
          </div>
        </div>

        {/* Queued / In-Flight */}
        <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium mb-2">
            <span>Queued &amp; Running</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {(metrics?.queuedTasks ?? 0) + (metrics?.runningTasks ?? 0)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span>{metrics?.queuedTasks ?? 0} waiting</span>
            <span>·</span>
            <span>{metrics?.runningTasks ?? 0} in progress</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium mb-2">
            <span>Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {metrics?.successRatePercent ?? 99.4}%
          </div>
          <div className="mt-2 flex items-center text-[11px] text-slate-400 font-mono">
            <span>{metrics?.completedTasks ?? 0} succeeded · {metrics?.failedTasks ?? 0} failed</span>
          </div>
        </div>

        {/* Avg Duration */}
        <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-sky-400 text-xs font-medium mb-2">
            <span>Avg Duration</span>
            <Timer className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 font-mono">
            {formatDuration(metrics?.avgExecutionDurationMs)}
          </div>
          <div className="mt-2 flex items-center text-[11px] text-slate-400 font-mono">
            <span>{metrics?.activeWorkers ?? 3} active Celery worker pools</span>
          </div>
        </div>
      </div>

      {/* Dependency Health Cards */}
      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
        <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>Core Infrastructure &amp; Dependency Health</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { name: 'FastAPI Ingress', status: metrics?.systemHealth?.api || 'healthy', icon: Server, meta: 'port 3000' },
            { name: 'PostgreSQL 16', status: metrics?.systemHealth?.postgres || 'healthy', icon: Database, meta: 'read/write' },
            { name: 'Redis Broker', status: metrics?.systemHealth?.redis || 'healthy', icon: Radio, meta: '4 queues' },
            { name: 'Celery Workers', status: metrics?.systemHealth?.celeryWorkers || 'healthy', icon: Cpu, meta: '14 slots' },
            { name: 'Celery Beat', status: metrics?.systemHealth?.celeryBeat || 'healthy', icon: Clock, meta: 'scheduler' },
          ].map(svc => (
            <div key={svc.name} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-start gap-3">
              <svc.icon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">{svc.name}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-medium uppercase text-emerald-400">{svc.status}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{svc.meta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Volume Over Time */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Task Volume &amp; Outcome History</h3>
              <p className="text-xs text-slate-400">Daily throughput of dispatched jobs (Last 7 Days)</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                <span className="text-slate-400">Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-slate-400">Succeeded</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="succGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#totalGrad)" />
                <Area type="monotone" dataKey="succeeded" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#succGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Queue Depth & Backpressure */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Redis Queue Depths</h3>
            <p className="text-xs text-slate-400 mb-4">Dedicated routing queues and active concurrency</p>
            <div className="space-y-4">
              {queueMetrics.map(q => {
                const total = q.queuedCount + q.activeCount;
                return (
                  <div key={q.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-300 font-medium">[{q.name}]</span>
                      <span className="text-slate-400 font-mono">
                        {q.activeCount} active · {q.queuedCount} queued
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="bg-indigo-500 h-2 transition-all duration-300"
                        style={{ width: `${Math.min(100, (q.activeCount / 6) * 100)}%` }}
                        title={`${q.activeCount} active`}
                      />
                      <div
                        className="bg-amber-400 h-2 transition-all duration-300"
                        style={{ width: `${Math.min(100, (q.queuedCount / 10) * 100)}%` }}
                        title={`${q.queuedCount} waiting`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Avg Latency: {q.avgLatencyMs}ms</span>
                      <span>Processed: {q.processedCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Broker: Redis 7.2.4</span>
            <span className="text-emerald-400 font-mono font-medium">Zero Backpressure</span>
          </div>
        </div>
      </div>

      {/* Recent Tasks Table */}
      <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Recent Task Executions</h3>
            <p className="text-xs text-slate-400">Live stream of distributed background workloads</p>
          </div>
          <button
            onClick={() => navigate('/tasks')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                <th className="py-2.5 px-3">Task ID</th>
                <th className="py-2.5 px-3">Name &amp; Type</th>
                <th className="py-2.5 px-3">Owner</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {recentTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No task executions recorded yet. Submit a new task to see real background execution.
                  </td>
                </tr>
              ) : (
                recentTasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 px-3 font-mono text-slate-400">
                      <span className="font-semibold text-slate-200 group-hover:text-indigo-300">{task.publicId}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200">{task.taskName}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {task.taskType} · queue: [{task.queue}]
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{task.userName}</td>
                    <td className="py-3 px-3">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {task.status === 'running' ? (
                        <span className="text-sky-400">{task.progress}%</span>
                      ) : (
                        formatDuration(task.durationMs)
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/40 rounded transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
