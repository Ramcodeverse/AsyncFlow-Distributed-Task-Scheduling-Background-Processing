import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  ArrowRight,
  RotateCcw,
  Play,
  Pause,
  Server,
  Globe,
  Database,
  FileCheck2,
  XCircle
} from 'lucide-react';

export const RequestFlowComparison: React.FC = () => {
  const [syncStep, setSyncStep] = useState<number>(0);
  const [asyncStep, setAsyncStep] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  // Auto-play cycling for request flow animations
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setSyncStep((prev) => (prev + 1) % 4);
      setAsyncStep((prev) => (prev + 1) % 5);
    }, 2400);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Synchronous Stages
  const syncStages = [
    {
      title: '1. Inbound HTTP Request',
      detail: 'Client initiates heavy 100MB dataset export / PDF compilation.',
      status: 'waiting',
      serverStatus: 'Active HTTP connection open',
      clientState: 'Thread blocked · Cursor spinning',
    },
    {
      title: '2. Server Thread Trapped',
      detail: 'FastAPI/Web thread blocked in synchronous loop for 25+ seconds.',
      status: 'blocked',
      serverStatus: 'Worker socket exhausted · Zero capacity for other users',
      clientState: 'No response yet · Timeout counter ticking',
    },
    {
      title: '3. Thread Contention & Starvation',
      detail: 'Subsequent incoming user requests queue up and get dropped.',
      status: 'warning',
      serverStatus: 'Thread pool 100% saturated · Backlog overflow',
      clientState: 'Connection keeps waiting indefinitely',
    },
    {
      title: '4. 504 Gateway Timeout Failure',
      detail: 'Load balancer terminates connection. Work is lost or duplicated.',
      status: 'failed',
      serverStatus: 'Wasted CPU cycles on abandoned request',
      clientState: 'HTTP 504 Gateway Timeout · Failed export',
    },
  ];

  // Asynchronous Stages
  const asyncStages = [
    {
      title: '1. Non-Blocking Ingress',
      detail: 'Client posts payload with Idempotency-Key. FastAPI responds in 6.4ms.',
      status: 'dispatched',
      badge: '201 Created',
      taskState: 'Task Enqueued (af-tsk-8812c3)',
    },
    {
      title: '2. PostgreSQL Outbox Commit',
      detail: 'Transactional outbox record committed atomically with audit log.',
      status: 'stored',
      badge: 'Zero Task Loss',
      taskState: 'State: pending · Outbox verified',
    },
    {
      title: '3. Redis Partition Routing',
      detail: 'Broker routes task to dedicated [reports] queue without starvation.',
      status: 'queued',
      badge: 'Sub-ms Routing',
      taskState: 'State: queued · Priority high',
    },
    {
      title: '4. Worker Stream Execution',
      detail: 'Celery worker pools compute in background & stream live SSE events.',
      status: 'running',
      badge: '60% Progress',
      taskState: 'State: running · Compiling vectors',
    },
    {
      title: '5. Artifact Ready for Download',
      detail: 'Binary output stored with SHA-256 hash. Client receives instant link.',
      status: 'completed',
      badge: '100% SLA Delivered',
      taskState: 'State: succeeded · Artifact stored',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Interactive Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0D111B] border border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Side-by-Side Flow Simulation
          </span>
          <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
            Observe connection lifecycle & worker handoff
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#111725] hover:bg-[#171E2D] border border-slate-800 text-xs font-mono text-slate-300 transition-colors"
          >
            {isAutoPlaying ? (
              <>
                <Pause className="w-3 h-3 text-cyan-400" />
                <span>Pause Cycle</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-cyan-400" />
                <span>Resume Cycle</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              setSyncStep(0);
              setAsyncStep(0);
            }}
            className="p-1 rounded bg-[#111725] hover:bg-[#171E2D] border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Restart simulation"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SYNCHRONOUS FLOW CARD */}
        <div className="rounded-2xl bg-[#0D111B] border border-rose-900/40 p-6 space-y-5 relative overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-rose-900/30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <h3 className="text-xs font-mono font-bold text-rose-300 uppercase tracking-wider">
                Synchronous Execution (Anti-Pattern)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/80 border border-rose-800/60 text-rose-400">
              Thread Locked
            </span>
          </div>

          {/* Animated SVG Diagram of Synchronous Breakdown */}
          <div className="p-4 rounded-xl bg-[#080A0F] border border-slate-800 relative">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-3">
              <span className="flex items-center gap-1 text-slate-300">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> Browser Client
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <Server className="w-3.5 h-3.5 text-rose-400" /> Web Thread
              </span>
            </div>

            {/* Connecting animated beam */}
            <div className="relative h-16 flex items-center justify-between px-6">
              {/* Client Node */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                    syncStep === 3
                      ? 'bg-rose-950/80 border-rose-500 text-rose-400 shadow-lg shadow-rose-900/40'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1">Client</span>
              </div>

              {/* Data Flow Line / Blocked State */}
              <div className="flex-1 mx-4 relative flex items-center justify-center">
                <div className="w-full h-0.5 bg-slate-800 relative overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      syncStep === 3
                        ? 'bg-rose-500 w-full'
                        : syncStep >= 1
                        ? 'bg-amber-400 w-2/3 animate-pulse'
                        : 'bg-indigo-500 w-1/3'
                    }`}
                  />
                </div>

                {/* Animated status token floating */}
                <div
                  className={`absolute px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all duration-300 ${
                    syncStep === 3
                      ? 'bg-rose-950 border border-rose-800 text-rose-400'
                      : syncStep >= 1
                      ? 'bg-amber-950 border border-amber-800 text-amber-300 animate-pulse'
                      : 'bg-indigo-950 border border-indigo-800 text-indigo-300'
                  }`}
                >
                  {syncStep === 0 && 'POST /report'}
                  {syncStep === 1 && 'Thread Locked ⏳'}
                  {syncStep === 2 && 'Socket Starvation ⚠️'}
                  {syncStep === 3 && '504 Timeout ✕'}
                </div>
              </div>

              {/* Server Node */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                    syncStep === 3
                      ? 'bg-rose-950/90 border-rose-500 text-rose-400 shadow-lg shadow-rose-900/40'
                      : syncStep >= 1
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  {syncStep === 3 ? (
                    <XCircle className="w-5 h-5" />
                  ) : syncStep >= 1 ? (
                    <Clock className="w-5 h-5 animate-spin" />
                  ) : (
                    <Server className="w-5 h-5" />
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1">API Thread</span>
              </div>
            </div>

            {/* Current Stage Highlight Box */}
            <div className="mt-4 p-3 rounded-lg bg-[#0D111B] border border-rose-900/40 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-rose-300">
                <span>{syncStages[syncStep].title}</span>
                <span className="text-[10px] text-slate-500">Step {syncStep + 1} of 4</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {syncStages[syncStep].detail}
              </p>
              <div className="pt-1 flex items-center gap-2 text-[10px] font-mono text-rose-400">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{syncStages[syncStep].serverStatus}</span>
              </div>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-mono text-slate-500">Execution Phase:</span>
            <div className="flex items-center gap-1.5">
              {syncStages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSyncStep(i);
                    setIsAutoPlaying(false);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    syncStep === i
                      ? 'w-6 bg-rose-400'
                      : 'w-2 bg-slate-800 hover:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ASYNCHRONOUS FLOW CARD */}
        <div className="rounded-2xl bg-[#0D111B] border border-indigo-900/50 p-6 space-y-5 relative overflow-hidden transition-all duration-300 glow-indigo">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-900/30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                AsyncFlow Pipeline (Production Architecture)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              Non-Blocking
            </span>
          </div>

          {/* Animated SVG Diagram of Asynchronous Handoff */}
          <div className="p-4 rounded-xl bg-[#080A0F] border border-slate-800 relative">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-3">
              <span className="flex items-center gap-1 text-slate-300">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> Client (Free)
              </span>
              <span className="flex items-center gap-1 text-cyan-300">
                <Server className="w-3.5 h-3.5" /> FastAPI (6ms)
              </span>
              <span className="flex items-center gap-1 text-indigo-300">
                <Cpu className="w-3.5 h-3.5" /> Celery Pool
              </span>
            </div>

            {/* Connecting animated beam */}
            <div className="relative h-16 flex items-center justify-between px-3 sm:px-6">
              {/* Client Node */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1">Client</span>
              </div>

              {/* Fast Ack Line */}
              <div className="flex-1 mx-2 relative flex items-center justify-center">
                <div className="w-full h-0.5 bg-slate-800 relative overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-500"
                    style={{ width: asyncStep >= 1 ? '100%' : '50%' }}
                  />
                </div>
                <div className="absolute px-1.5 py-0.5 rounded text-[8px] font-mono bg-cyan-950 border border-cyan-800 text-cyan-300">
                  {asyncStep === 0 ? 'POST' : '201 Ack (6ms)'}
                </div>
              </div>

              {/* FastAPI Node */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-indigo-600/50 text-indigo-400 flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Server className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1">FastAPI</span>
              </div>

              {/* Queue to Worker Line */}
              <div className="flex-1 mx-2 relative flex items-center justify-center">
                <div className="w-full h-0.5 bg-slate-800 relative overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      asyncStep >= 4 ? 'bg-emerald-400 w-full' : asyncStep >= 2 ? 'bg-indigo-400 w-full' : 'w-0'
                    }`}
                  />
                </div>
                <div className="absolute px-1.5 py-0.5 rounded text-[8px] font-mono bg-indigo-950 border border-indigo-800 text-indigo-300">
                  {asyncStep < 2 ? 'Outbox' : asyncStep === 2 ? 'Redis' : asyncStep === 3 ? 'Executing' : 'Artifact'}
                </div>
              </div>

              {/* Celery Worker Node */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                    asyncStep === 4
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/30'
                      : asyncStep >= 3
                      ? 'bg-sky-950 border-sky-500 text-sky-400 animate-pulse'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {asyncStep === 4 ? (
                    <FileCheck2 className="w-4 h-4" />
                  ) : (
                    <Cpu className="w-4 h-4" />
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1">Celery</span>
              </div>
            </div>

            {/* Current Stage Highlight Box */}
            <div className="mt-4 p-3 rounded-lg bg-[#0D111B] border border-indigo-900/40 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {asyncStages[asyncStep].title}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                  {asyncStages[asyncStep].badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {asyncStages[asyncStep].detail}
              </p>
              <div className="pt-1 flex items-center gap-2 text-[10px] font-mono text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{asyncStages[asyncStep].taskState}</span>
              </div>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-mono text-slate-500">Pipeline Stage:</span>
            <div className="flex items-center gap-1.5">
              {asyncStages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAsyncStep(i);
                    setIsAutoPlaying(false);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    asyncStep === i
                      ? 'w-6 bg-cyan-400'
                      : 'w-2 bg-slate-800 hover:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
