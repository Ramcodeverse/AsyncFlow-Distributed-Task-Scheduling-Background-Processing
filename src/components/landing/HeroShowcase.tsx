import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Clock,
  CheckCircle2,
  Cpu,
  FileText,
  Download,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Radio,
  Check,
  Zap,
  Database,
  Terminal,
  Play,
  Pause,
  LayoutDashboard,
  ShieldAlert,
  Server,
  Activity,
  ChevronRight,
  Sliders
} from 'lucide-react';

export const HeroShowcase: React.FC = () => {
  const navigate = useNavigate();

  // Coordinated State Machine (0 to 5)
  // Step 0: Task Inbound & Validated
  // Step 1: Outbox Committed & Queued in Redis
  // Step 2: Worker Acknowledged & In-Flight (25%)
  // Step 3: Processing Data Streams (65%)
  // Step 4: Vector Graphics & PDF Rendering (85%)
  // Step 5: Succeeded & Artifact Available for Download (100%)
  const [step, setStep] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 6);
    }, 2800);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Derived coordinated state from single source of truth
  const getDemoState = () => {
    switch (step) {
      case 0:
        return {
          stepName: '1. Inbound Ingress',
          queuedCount: 3,
          activeWorkers: 2,
          completedCount: 142,
          failedCount: 1,
          taskStatus: 'pending' as const,
          taskProgress: 10,
          currentStage: 'Payload schema validated · Idempotency key verified',
          timeline: [
            { time: '12:44:02', event: 'Task Ingested', details: 'FastAPI acknowledged with 201 Created' },
          ],
          hasResult: false,
          activeWorkerNode: 'celery@worker-node-alpha (Standby)',
        };
      case 1:
        return {
          stepName: '2. Outbox & Redis Queue',
          queuedCount: 4,
          activeWorkers: 2,
          completedCount: 142,
          failedCount: 1,
          taskStatus: 'queued' as const,
          taskProgress: 25,
          currentStage: 'Dispatched to Redis partition [reports] via transactional outbox',
          timeline: [
            { time: '12:44:03', event: 'Outbox Committed', details: 'Atomically logged to PostgreSQL cluster' },
            { time: '12:44:02', event: 'Task Ingested', details: 'FastAPI acknowledged with 201 Created' },
          ],
          hasResult: false,
          activeWorkerNode: 'celery@worker-node-alpha (Assigned)',
        };
      case 2:
        return {
          stepName: '3. Worker Lock Acquired',
          queuedCount: 3,
          activeWorkers: 3,
          completedCount: 142,
          failedCount: 1,
          taskStatus: 'running' as const,
          taskProgress: 45,
          currentStage: 'celery@worker-node-alpha streaming records & compiling dataset',
          timeline: [
            { time: '12:44:05', event: 'Worker Acknowledged', details: 'celery@worker-node-alpha acquired concurrency lock' },
            { time: '12:44:03', event: 'Outbox Committed', details: 'Atomically logged to PostgreSQL cluster' },
            { time: '12:44:02', event: 'Task Ingested', details: 'FastAPI acknowledged with 201 Created' },
          ],
          hasResult: false,
          activeWorkerNode: 'celery@worker-node-alpha (Active · 45%)',
        };
      case 3:
        return {
          stepName: '4. Stream Aggregation',
          queuedCount: 3,
          activeWorkers: 3,
          completedCount: 142,
          failedCount: 1,
          taskStatus: 'running' as const,
          taskProgress: 75,
          currentStage: 'Processing dataset metrics & quantile calculations',
          timeline: [
            { time: '12:44:07', event: 'Batch Streamed', details: 'Parsed 14,200 telemetry points into aggregate structure' },
            { time: '12:44:05', event: 'Worker Acknowledged', details: 'celery@worker-node-alpha acquired lock' },
            { time: '12:44:03', event: 'Outbox Committed', details: 'Atomically logged to PostgreSQL cluster' },
          ],
          hasResult: false,
          activeWorkerNode: 'celery@worker-node-alpha (Active · 75%)',
        };
      case 4:
        return {
          stepName: '5. Vector Document Render',
          queuedCount: 3,
          activeWorkers: 3,
          completedCount: 142,
          failedCount: 1,
          taskStatus: 'running' as const,
          taskProgress: 92,
          currentStage: 'ReportLab rendering vector charts & layout tables',
          timeline: [
            { time: '12:44:08', event: 'Vector Rendering', details: 'Compiled executive PDF charts and tables' },
            { time: '12:44:07', event: 'Batch Streamed', details: 'Parsed 14,200 telemetry points into aggregate structure' },
            { time: '12:44:05', event: 'Worker Acknowledged', details: 'celery@worker-node-alpha acquired lock' },
          ],
          hasResult: false,
          activeWorkerNode: 'celery@worker-node-alpha (Active · 92%)',
        };
      case 5:
      default:
        return {
          stepName: '6. Artifact Ready',
          queuedCount: 3,
          activeWorkers: 2,
          completedCount: 143,
          failedCount: 1,
          taskStatus: 'succeeded' as const,
          taskProgress: 100,
          currentStage: 'Completed in 1.84s · Output artifact verified and ready',
          timeline: [
            { time: '12:44:09', event: 'Artifact Stored', details: 'Q1_Executive_Report.pdf (45.2 KB) SHA-256 written' },
            { time: '12:44:08', event: 'Vector Rendering', details: 'Compiled executive PDF charts and tables' },
            { time: '12:44:07', event: 'Batch Streamed', details: 'Parsed 14,200 telemetry points into aggregate structure' },
          ],
          hasResult: true,
          activeWorkerNode: 'celery@worker-node-alpha (Idle)',
        };
    }
  };

  const state = getDemoState();

  const handleManualReplay = () => {
    setStep(0);
    setDownloaded(false);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloaded(true);

    // Create a real mock download file so the button genuinely works
    const element = document.createElement('a');
    const file = new Blob(
      [
        `AsyncFlow Executive Report
Generated: ${new Date().toISOString()}
Task ID: af-tsk-9941a7
Status: Succeeded
Execution Time: 1.84s
Worker: celery@worker-node-alpha
SHA-256: 9e8a7c1b52f841d9c4b7e8d123456789abcdef0123456789abcdef0123456789

=== Summary Telemetry ===
Throughput: 1,842 ops/sec
Latency P95: 142ms
Outbox Loss: 0 records
`,
      ],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = 'Q1_Executive_Report_AsyncFlow.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="relative max-w-5xl mx-auto my-4">
      {/* Linear-Style Vertical Ambient Light Pillar */}
      <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-4/5 h-80 linear-beam pointer-events-none z-0 animate-beam-pulse" />
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-64 linear-light-pillar pointer-events-none z-0" />

      {/* Centerpiece Dashboard Application Window */}
      <div className="relative z-10 rounded-2xl bg-[#0D111B] p-0 shadow-2xl border border-slate-800/80 glow-top-highlight overflow-hidden text-left transition-all duration-300">
        {/* macOS Titlebar Chrome */}
        <div className="h-10 px-4 bg-[#080A0F] border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="h-3.5 w-px bg-slate-800 ml-1" />
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-white font-medium">AsyncFlow Cluster Console</span>
              <span className="text-slate-600">/</span>
              <span className="text-cyan-400 font-semibold">{state.stepName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Step Controls */}
            <div className="hidden sm:flex items-center gap-1 mr-2 bg-[#111725] px-1.5 py-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
              {[0, 1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStep(s);
                    setIsPaused(true);
                  }}
                  className={`w-4 h-4 rounded flex items-center justify-center font-bold transition-colors cursor-pointer ${
                    step === s
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Jump to step ${s + 1}`}
                >
                  {s + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 rounded bg-[#111725] hover:bg-[#171E2D] text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title={isPaused ? 'Resume auto cycle' : 'Pause sequence'}
            >
              {isPaused ? <Play className="w-3 h-3 text-cyan-400" /> : <Pause className="w-3 h-3 text-cyan-400" />}
            </button>

            <button
              onClick={handleManualReplay}
              className="p-1 rounded bg-[#111725] hover:bg-[#171E2D] text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Restart trace sequence"
            >
              <RotateCcw className="w-3 h-3 text-indigo-400" />
            </button>
          </div>
        </div>

        {/* Dashboard Window Body: Mini Sidebar + Main App Grid */}
        <div className="flex flex-col md:flex-row min-h-[480px]">
          {/* Mini Sidebar */}
          <div className="hidden md:flex flex-col w-48 bg-[#0A0D15] border-r border-slate-800/80 p-3 space-y-4 shrink-0 text-xs">
            <div className="flex items-center gap-2 px-2 py-1 text-slate-300 font-bold tracking-tight">
              <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>AsyncFlow</span>
            </div>

            <div className="space-y-1">
              {[
                { label: 'Overview', icon: LayoutDashboard, active: true },
                { label: 'Task Queue', icon: Layers, active: false },
                { label: 'Schedules', icon: Clock, active: false },
                { label: 'Worker Pool', icon: Cpu, active: false },
                { label: 'Activity', icon: Activity, active: false },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    onClick={() => navigate('/dashboard')}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      item.active
                        ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto p-2.5 rounded-lg bg-[#111725] border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
              <div className="flex items-center justify-between">
                <span>Cluster Node</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-slate-300 font-semibold truncate">{state.activeWorkerNode}</div>
            </div>
          </div>

          {/* Main Dashboard Content Area */}
          <div className="flex-1 p-5 sm:p-6 space-y-5 bg-[#0D111B] overflow-hidden">
            {/* 4 Metric Cards (Coordinated with State Machine) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#111725] border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-amber-400 text-[11px] font-mono">
                  <span>QUEUED TASKS</span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-bold font-mono text-amber-400">{state.queuedCount}</div>
                <div className="text-[10px] text-slate-500 font-mono">Partition: [reports]</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111725] border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-indigo-400 text-[11px] font-mono">
                  <span>ACTIVE WORKERS</span>
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-bold font-mono text-white">{state.activeWorkers} / 4</div>
                <div className="text-[10px] text-slate-500 font-mono">Concurrency Optimal</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111725] border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-emerald-400 text-[11px] font-mono">
                  <span>COMPLETED</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400">{state.completedCount}</div>
                <div className="text-[10px] text-slate-500 font-mono">100% SLA Delivered</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111725] border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-rose-400 text-[11px] font-mono">
                  <span>FAILED (RETRIED)</span>
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-bold font-mono text-rose-400">{state.failedCount}</div>
                <div className="text-[10px] text-slate-500 font-mono">Auto-recovered with jitter</div>
              </div>
            </div>

            {/* Active Running Task Bar & Live Progress Monitor */}
            <div className="p-4 rounded-xl bg-[#111725] border border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-200">af-tsk-9941a7</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs font-semibold text-white">Q1 Platform Performance PDF</span>
                  <span className="text-[10px] font-mono text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">
                    [reports]
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase transition-colors duration-300 ${
                    state.taskStatus === 'succeeded'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                      : state.taskStatus === 'running'
                      ? 'bg-sky-950/60 text-sky-400 border border-sky-800/50 animate-pulse'
                      : 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      state.taskStatus === 'succeeded' ? 'bg-emerald-400' : 'bg-sky-400 animate-ping'
                    }`}
                  />
                  {state.taskStatus}
                </span>
              </div>

              {/* Synchronized Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    {state.currentStage}
                  </span>
                  <span className="font-mono font-bold text-sky-400">{state.taskProgress}%</span>
                </div>
                <div className="w-full bg-[#080A0F] rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      state.taskProgress === 100
                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                        : 'bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-sm shadow-indigo-500/50'
                    }`}
                    style={{ width: `${state.taskProgress}%` }}
                  />
                </div>
              </div>

              {/* Ready Result Download Pill */}
              {state.hasResult && (
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between text-xs animate-in fade-in duration-300">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-200">Q1_Executive_Report.pdf</span>
                      <span className="text-[10px] font-mono text-emerald-400 block">45.2 KB · SHA-256 Verified</span>
                    </div>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-all hover:scale-105 cursor-pointer"
                  >
                    {downloaded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Downloaded</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Result</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Split Bottom Area: Recent Tasks Table & Live Activity Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
              {/* Recent Tasks Mini Table (2 cols) */}
              <div className="lg:col-span-2 p-3.5 rounded-xl bg-[#111725] border border-slate-800/80 space-y-2">
                <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center justify-between">
                  <span>RECENT EXECUTION QUEUE</span>
                  <span className="text-slate-500 font-normal">Live Worker Stream</span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="p-2 rounded bg-[#080A0F] border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">af-tsk-9941a7</span>
                    <span className="text-slate-400 truncate max-w-[120px]">Q1 Performance</span>
                    <span className="text-cyan-400 font-bold">{state.taskStatus}</span>
                  </div>
                  <div className="p-2 rounded bg-[#080A0F]/60 border border-slate-800/60 flex items-center justify-between text-slate-400">
                    <span>af-tsk-8820c1</span>
                    <span className="truncate max-w-[120px]">Weekly Audit CSV</span>
                    <span className="text-emerald-400">succeeded</span>
                  </div>
                  <div className="p-2 rounded bg-[#080A0F]/60 border border-slate-800/60 flex items-center justify-between text-slate-400">
                    <span>af-tsk-7719b4</span>
                    <span className="truncate max-w-[120px]">Telemetry Aggregation</span>
                    <span className="text-emerald-400">succeeded</span>
                  </div>
                </div>
              </div>

              {/* Synchronized Event Timeline (1 col) */}
              <div className="p-3.5 rounded-xl bg-[#111725] border border-slate-800/80 space-y-2">
                <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center justify-between">
                  <span>EVENT TIMELINE</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <div className="space-y-2">
                  {state.timeline.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[10px] font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-slate-200 font-semibold">{item.event}</div>
                        <div className="text-slate-500 truncate">{item.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sub-Bar */}
        <div className="px-5 py-2.5 bg-[#080A0F] border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>FastAPI: <strong className="text-slate-300">6.4ms Ingress</strong></span>
            <span>Broker: <strong className="text-slate-300">Redis 7.2 (Healthy)</strong></span>
            <span>Workers: <strong className="text-slate-300">3 Nodes Registered</strong></span>
          </div>
          <div className="text-slate-400 flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              <span>Open Full Console</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
