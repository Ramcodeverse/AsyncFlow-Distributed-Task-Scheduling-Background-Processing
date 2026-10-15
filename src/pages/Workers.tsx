import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Radio, HardDrive, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { api } from '../lib/api';
import { WorkerInfo } from '../types';

export const Workers: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkers = async () => {
    try {
      const res = await api.getWorkers();
      setWorkers(res.workers);
    } catch (err) {
      console.error('Failed to load workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
    const interval = setInterval(loadWorkers, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (sec: number) => {
    const days = Math.floor(sec / 86400);
    const hrs = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (days > 0) return `${days}d ${hrs}h ${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Celery Worker Pool</h2>
          <p className="text-xs text-slate-400 mt-1">
            Active process concurrency, queue bindings, heartbeat telemetry, and observed resource metrics
          </p>
        </div>

        <button
          onClick={() => loadWorkers()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 rounded-lg transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Workers</span>
        </button>
      </div>

      {/* Worker Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workers.map(w => {
          const isBusy = w.activeTasks > 0;
          return (
            <div
              key={w.name}
              className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                      <h3 className="text-xs font-mono font-semibold text-slate-200 truncate" title={w.name}>
                        {w.name}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">
                      Uptime: {formatUptime(w.uptimeSeconds)}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      w.status === 'healthy'
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                        : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        w.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                      }`}
                    />
                    <span className="uppercase">{isBusy ? 'BUSY' : w.status}</span>
                  </span>
                </div>

                {/* Queues served */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">BOUND QUEUES:</span>
                  <div className="flex flex-wrap gap-1">
                    {w.queues.map(q => (
                      <span
                        key={q}
                        className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-300"
                      >
                        [{q}]
                      </span>
                    ))}
                  </div>
                </div>

                {/* Concurrency and Task Slots */}
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">CONCURRENCY</span>
                    <span className="text-slate-200 font-semibold text-sm mt-0.5 block">{w.concurrency} slots</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">ACTIVE TASKS</span>
                    <span className={`font-semibold text-sm mt-0.5 block ${isBusy ? 'text-sky-400' : 'text-slate-400'}`}>
                      {w.activeTasks} running
                    </span>
                  </div>
                </div>

                {/* Resource Stats */}
                <div className="mt-4 space-y-2 pt-3 border-t border-slate-800/80 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">CPU Usage:</span>
                    <span className="text-slate-200">{w.cpuPercent || 15}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 transition-all duration-300"
                      style={{ width: `${w.cpuPercent || 15}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">Memory RSS:</span>
                    <span className="text-slate-200">{w.memoryMb || 380} MB</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Completed: {w.totalCompleted}</span>
                <span>Failed: {w.totalFailed}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
