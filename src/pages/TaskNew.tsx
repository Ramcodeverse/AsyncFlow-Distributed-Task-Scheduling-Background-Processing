import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileSpreadsheet,
  Cpu,
  ShieldCheck,
  Activity,
  ArrowRight,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../lib/api';
import { TaskType, TaskPriority } from '../types';

export const TaskNew: React.FC = () => {
  const navigate = useNavigate();

  const [taskType, setTaskType] = useState<TaskType>('pdf_report');
  const [taskName, setTaskName] = useState<string>('Quarterly Performance Audit Report');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(`af-idemp-${Date.now()}`);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Type specific payload configurations
  const [pdfConfig, setPdfConfig] = useState({
    title: 'Quarterly Infrastructure & Performance Audit',
    template: 'executive',
    includeCharts: true,
    dateRange: '2026-01-01 to 2026-03-31',
  });

  const [csvConfig, setCsvConfig] = useState({
    dataset: 'audit_logs',
    delimiter: 'comma',
    includeHeaders: true,
    filterStatus: 'all',
  });

  const [dataConfig, setDataConfig] = useState({
    batchSize: 5000,
    transformation: 'quantile_aggregation',
    chunkSize: 1000,
  });

  const [valConfig, setValConfig] = useState({
    schemaMode: 'strict',
    maxViolations: 10,
    encoding: 'UTF-8',
  });

  const [simConfig, setSimConfig] = useState({
    durationSeconds: 8,
    failureInjectionPercent: 0,
    stepCount: 4,
  });

  const taskTypeCards = [
    {
      id: 'pdf_report' as TaskType,
      name: 'PDF Report Generation',
      desc: 'Compiles formatted vector PDF reports with executive summaries, metrics tables, and metadata.',
      icon: FileText,
      queue: 'reports',
    },
    {
      id: 'csv_report' as TaskType,
      name: 'CSV Streaming Export',
      desc: 'Extracts large tabular datasets into RFC 4180 escaped CSV streams without memory overhead.',
      icon: FileSpreadsheet,
      queue: 'reports',
    },
    {
      id: 'data_processing' as TaskType,
      name: 'Dataset Processing',
      desc: 'Batch aggregates metrics, computes quantiles, and produces structured analytics summaries.',
      icon: Cpu,
      queue: 'data_processing',
    },
    {
      id: 'file_validation' as TaskType,
      name: 'Schema & File Validation',
      desc: 'Inspects magic bytes, validates column bounds, and checks integrity invariants.',
      icon: ShieldCheck,
      queue: 'default',
    },
    {
      id: 'simulated_job' as TaskType,
      name: 'Simulated Background Job',
      desc: 'Configurable duration and failure injection rate to verify retries and exponential backoff.',
      icon: Activity,
      queue: 'default',
    },
  ];

  const getTargetQueue = () => {
    if (taskType === 'pdf_report' || taskType === 'csv_report') return 'reports';
    if (taskType === 'data_processing') return 'data_processing';
    return 'default';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      setError('Please provide a task name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let payload: Record<string, any> = {};
    if (taskType === 'pdf_report') payload = pdfConfig;
    else if (taskType === 'csv_report') payload = csvConfig;
    else if (taskType === 'data_processing') payload = dataConfig;
    else if (taskType === 'file_validation') payload = valConfig;
    else if (taskType === 'simulated_job') payload = simConfig;

    try {
      const res = await api.createTask({
        taskType,
        taskName,
        priority,
        payload,
        idempotencyKey,
      });

      // Navigate immediately to execution detail page
      navigate(`/tasks/${res.task.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit task');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Submit New Background Task</h2>
        <p className="text-xs text-slate-400 mt-1">
          FastAPI ingests the payload, writes a durable record to PostgreSQL, and queues dispatch via transactional outbox.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-lg text-rose-300 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Workload Type */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-3">
          <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
            1. Select Workload Class
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {taskTypeCards.map(t => {
              const Icon = t.icon;
              const isSelected = taskType === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setTaskType(t.id);
                    if (t.id === 'pdf_report') setTaskName('Quarterly Performance Audit Report');
                    else if (t.id === 'csv_report') setTaskName('Weekly Telemetry Logs Export');
                    else if (t.id === 'data_processing') setTaskName('Cluster Quantile Latency Analysis');
                    else if (t.id === 'file_validation') setTaskName('Customer Ingest File Schema Check');
                    else setTaskName('Simulated Long-Running Batch Workload');
                  }}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{t.name}</div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{t.desc}</p>
                      <span className="inline-block mt-2 font-mono text-[10px] text-indigo-400">
                        Target queue: [{t.queue}]
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Task Details & Routing */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-4">
          <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
            2. Task Parameters &amp; Queue Priority
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-slate-300">Task Title / Description</label>
              <input
                type="text"
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Queue Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
              >
                <option value="critical">Critical (Worker Fast-Path)</option>
                <option value="high">High</option>
                <option value="normal">Normal (Standard)</option>
                <option value="low">Low (Background Idle)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Idempotency Key</label>
              <input
                type="text"
                value={idempotencyKey}
                onChange={e => setIdempotencyKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 focus:outline-none"
                placeholder="Prevents duplicate submissions"
              />
            </div>
          </div>

          {/* Dynamic Payload Form */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="text-xs font-medium text-slate-300 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Specific Payload Configuration</span>
            </div>

            {taskType === 'pdf_report' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Report Template</label>
                  <select
                    value={pdfConfig.template}
                    onChange={e => setPdfConfig({ ...pdfConfig, template: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded p-1.5 text-slate-200"
                  >
                    <option value="executive">Executive Summary</option>
                    <option value="audit">Infrastructure Audit</option>
                    <option value="performance">Throughput &amp; Latency</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Date Range</label>
                  <input
                    type="text"
                    value={pdfConfig.dateRange}
                    onChange={e => setPdfConfig({ ...pdfConfig, dateRange: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded p-1.5 text-slate-200"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdfConfig.includeCharts}
                      onChange={e => setPdfConfig({ ...pdfConfig, includeCharts: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Include Vector Metrics</span>
                  </label>
                </div>
              </div>
            )}

            {taskType === 'csv_report' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Source Dataset</label>
                  <select
                    value={csvConfig.dataset}
                    onChange={e => setCsvConfig({ ...csvConfig, dataset: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded p-1.5 text-slate-200"
                  >
                    <option value="audit_logs">Audit Events Log</option>
                    <option value="telemetry">Cluster Worker Telemetry</option>
                    <option value="tasks_archive">Task Execution History</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Field Delimiter</label>
                  <select
                    value={csvConfig.delimiter}
                    onChange={e => setCsvConfig({ ...csvConfig, delimiter: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded p-1.5 text-slate-200"
                  >
                    <option value="comma">Comma (,)</option>
                    <option value="tab">Tab (\t)</option>
                    <option value="pipe">Pipe (|)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Status Filter</label>
                  <select
                    value={csvConfig.filterStatus}
                    onChange={e => setCsvConfig({ ...csvConfig, filterStatus: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded p-1.5 text-slate-200"
                  >
                    <option value="all">All Records</option>
                    <option value="success_only">Success Records Only</option>
                    <option value="failures_only">Failures Only</option>
                  </select>
                </div>
              </div>
            )}

            {taskType === 'data_processing' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Batch Size (records)</label>
                  <input
                    type="number"
                    value={dataConfig.batchSize}
                    onChange={e => setDataConfig({ ...dataConfig, batchSize: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded p-1.5 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Algorithm</label>
                  <select
                    value={dataConfig.transformation}
                    onChange={e => setDataConfig({ ...dataConfig, transformation: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded p-1.5 text-slate-200"
                  >
                    <option value="quantile_aggregation">P50 / P95 / P99 Quantiles</option>
                    <option value="anomaly_detection">Variance &amp; Outliers</option>
                    <option value="normalization">Min-Max Normalization</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Chunk Size</label>
                  <input
                    type="number"
                    value={dataConfig.chunkSize}
                    onChange={e => setDataConfig({ ...dataConfig, chunkSize: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded p-1.5 text-slate-200"
                  />
                </div>
              </div>
            )}

            {taskType === 'simulated_job' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Duration (seconds): {simConfig.durationSeconds}s</label>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={simConfig.durationSeconds}
                    onChange={e => setSimConfig({ ...simConfig, durationSeconds: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">
                    Simulated Failure Rate: {simConfig.failureInjectionPercent}% (Tests Retries)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="25"
                    value={simConfig.failureInjectionPercent}
                    onChange={e => setSimConfig({ ...simConfig, failureInjectionPercent: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dispatch Architecture Banner */}
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Target Queue: <strong className="text-slate-200 font-mono">[{getTargetQueue()}]</strong> · Handled by Celery Worker Pool with automatic retry policy
            </span>
          </div>
          <span className="font-mono text-[11px] text-emerald-400">Transactional Outbox Ready</span>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Enqueuing Task...</span>
              </>
            ) : (
              <>
                <span>Enqueue Task</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
