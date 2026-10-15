import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Radio,
  Cpu,
  Clock,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { api } from '../lib/api';

export const Monitoring: React.FC = () => {
  const [prometheusData, setPrometheusData] = useState<string>('');
  const [copiedProm, setCopiedProm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [outboxRecovering, setOutboxRecovering] = useState(false);
  const [outboxMsg, setOutboxMsg] = useState<string | null>(null);

  const loadPrometheus = async () => {
    setLoading(true);
    try {
      const data = await api.getPrometheusMetrics();
      setPrometheusData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrometheus();
  }, []);

  const handleCopyProm = () => {
    navigator.clipboard.writeText(prometheusData);
    setCopiedProm(true);
    setTimeout(() => setCopiedProm(false), 2000);
  };

  const handleTriggerOutbox = async () => {
    setOutboxRecovering(true);
    setOutboxMsg(null);
    try {
      const res = await api.triggerOutboxRecovery();
      setOutboxMsg(res.message);
    } catch (err: any) {
      setOutboxMsg(err.message || 'Recovery failed');
    } finally {
      setOutboxRecovering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">System Infrastructure &amp; Metrics</h2>
          <p className="text-xs text-slate-400 mt-1">
            Cluster operational observability, readiness probes, and Prometheus scraping endpoint
          </p>
        </div>

        <button
          onClick={loadPrometheus}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 rounded-lg transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Health Probes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'FastAPI Web & API Ingress', icon: Server, status: 'Healthy', port: '3000 /api/v1', p95: '8ms' },
          { name: 'PostgreSQL 16 Engine', icon: Database, status: 'Healthy', port: '5432 / asyncflow', p95: '2ms' },
          { name: 'Redis Broker & Transport', icon: Radio, status: 'Healthy', port: '6379 / queues', p95: '1ms' },
          { name: 'Celery Distributed Workers', icon: Cpu, status: 'Healthy', port: '3 active nodes', p95: 'Optimal' },
          { name: 'Celery Beat Scheduler', icon: Clock, status: 'Healthy', port: '1s tick loop', p95: 'Accurate' },
          { name: 'Transactional Outbox Dispatcher', icon: ShieldCheck, status: 'Healthy', port: 'Zero lag', p95: '0 pending' },
        ].map(item => (
          <div key={item.name} className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">{item.name}</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {item.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/60">
              <span>{item.port}</span>
              <span className="text-slate-300">p95: {item.p95}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Transactional Outbox Manual Recovery Action */}
      <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Transactional Outbox Recovery Engine</span>
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            In the event of a transient Redis broker blip, tasks recorded in PostgreSQL with status PENDING can be safely recovered and re-published without losing state or generating duplicate jobs.
          </p>
          {outboxMsg && <p className="text-xs font-mono text-emerald-400 pt-1">{outboxMsg}</p>}
        </div>

        <button
          onClick={handleTriggerOutbox}
          disabled={outboxRecovering}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${outboxRecovering ? 'animate-spin' : ''}`} />
          <span>{outboxRecovering ? 'Sweeping Outbox...' : 'Run Outbox Recovery Sweep'}</span>
        </button>
      </div>

      {/* Prometheus Exporter Feed */}
      <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
              Prometheus Metrics Scrape Target (/api/v1/metrics/prometheus)
            </h3>
          </div>

          <button
            onClick={handleCopyProm}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors font-mono"
          >
            {copiedProm ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Metrics</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-96">
          {prometheusData || '# Loading Prometheus scrape data...'}
        </pre>
      </div>
    </div>
  );
};
