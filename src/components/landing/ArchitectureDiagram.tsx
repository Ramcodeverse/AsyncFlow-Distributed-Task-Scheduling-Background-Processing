import React, { useState, useEffect } from 'react';
import {
  Globe,
  Server,
  Database,
  Radio,
  Cpu,
  FileCheck2,
  Activity,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Maximize2,
  HardDrive
} from 'lucide-react';

interface ClusterNode {
  id: string;
  name: string;
  sub: string;
  role: string;
  throughput: string;
  status: 'healthy' | 'busy' | 'optimal';
  color: string;
  tech: string;
  description: string;
  details: string[];
}

export const ArchitectureDiagram: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('redis-master');
  const [activeInterval, setActiveInterval] = useState<string>('12:55');
  const [isSimulatingPacket, setIsSimulatingPacket] = useState<boolean>(false);
  const [activePacketStep, setActivePacketStep] = useState<number>(-1);

  const intervals = ['12:30', '12:35', '12:40', '12:45', '12:50', '12:55', '13:00', '13:05', '13:10', '13:15', '13:20', '13:25', '13:30'];

  const nodes: Record<string, ClusterNode> = {
    'client-ingress': {
      id: 'client-ingress',
      name: 'Client Ingress',
      sub: 'app.asyncflow.io',
      role: 'React 19 & Python SDK Ingress',
      throughput: '150 kbps ↗',
      status: 'optimal',
      color: 'border-cyan-500/50 text-cyan-400',
      tech: 'React 19 · Vite · SSE Consumer',
      description: 'Dispatches task payloads with client-generated Idempotency-Keys without blocking browser threads. Subscribes to live Server-Sent Events.',
      details: ['Sub-15ms client interaction latency', 'Automatic token refresh & Bearer signing', 'Real-time progress bar binding'],
    },
    'api-gateway': {
      id: 'api-gateway',
      name: 'FastAPI Gateway',
      sub: 'ingress-fastapi-01',
      role: 'Authentication & Validation Ingress',
      throughput: '320 req/s',
      status: 'optimal',
      color: 'border-indigo-500/50 text-indigo-400',
      tech: 'FastAPI · Pydantic · Argon2id',
      description: 'Validates task arguments against strict schemas, checks tenant quotas, and atomically commits both task and outbox records in PostgreSQL.',
      details: ['P95 response latency < 8ms', 'Never blocks on CPU-heavy operations', 'Enforces strict CORS & RBAC'],
    },
    'postgres-outbox': {
      id: 'postgres-outbox',
      name: 'PostgreSQL Outbox',
      sub: 'pg-primary-cluster',
      role: 'Transactional Outbox & State Store',
      throughput: '23 kbps',
      status: 'healthy',
      color: 'border-purple-500/50 text-purple-400',
      tech: 'PostgreSQL 16 · JSONB Payloads',
      description: 'Guarantees reliable dispatch by storing tasks and outbox events in a single atomic transaction. An outbox poller guarantees delivery to Redis.',
      details: ['Zero lost tasks during broker downtime', 'Audit history & multi-generation attempts', 'Outbox recovery sweep engine'],
    },
    'redis-master': {
      id: 'redis-master',
      name: 'Redis-Master Broker',
      sub: 'redis-broker-01:6379',
      role: 'Message Broker & Partition Queues',
      throughput: '1.4k ops/s',
      status: 'busy',
      color: 'border-blue-500/60 text-blue-400',
      tech: 'Redis 7.2 · Dedicated Queues',
      description: 'Routes workloads to dedicated queues (reports, data_processing, maintenance, default) to prevent heavy analytics from starving operational jobs.',
      details: ['Queue depth monitoring & zero backpressure', 'Sub-millisecond worker assignment', 'Celery Beat periodic tick routing'],
    },
    'worker-alpha': {
      id: 'worker-alpha',
      name: 'Celery Node Alpha',
      sub: 'celery@worker-node-alpha',
      role: 'PDF & CSV Report Generation Pool',
      throughput: '77 kbps',
      status: 'healthy',
      color: 'border-pink-500/50 text-pink-400',
      tech: 'Python 3.12 · 4 Concurrency Slots',
      description: 'Executes ReportLab PDF rendering, vector chart compilation, and streaming RFC 4180 CSV exports. Emits live progress events.',
      details: ['Bound to queue [reports]', 'Cooperative cancellation polling', 'Memory isolated process pools'],
    },
    'worker-beta': {
      id: 'worker-beta',
      name: 'Celery Node Beta',
      sub: 'celery@worker-node-beta',
      role: 'Dataset Analytics & Math Transforms',
      throughput: '37 kbps',
      status: 'healthy',
      color: 'border-amber-500/50 text-amber-400',
      tech: 'Python 3.12 · 6 Concurrency Slots',
      description: 'Processes large data batches, computes P50/P95/P99 latency quantiles, detects variance anomalies, and writes summary metrics.',
      details: ['Bound to queue [data_processing]', 'Chunked memory streaming cursor', 'Vector math calculations'],
    },
    'storage-volume': {
      id: 'storage-volume',
      name: 'Artifact Storage',
      sub: 'storage-results-volume',
      role: 'Encrypted Output Artifact Store',
      throughput: '150 kbps ↗',
      status: 'optimal',
      color: 'border-emerald-500/50 text-emerald-400',
      tech: 'POSIX Volume / S3 Adapter',
      description: 'Stores generated binary files with cryptographically generated paths. All downloads require verified token ownership.',
      details: ['30-day automated retention purge', 'Direct streaming with RFC 4180 headers', 'Zero path traversal vulnerability'],
    },
  };

  const selectedNode = nodes[selectedNodeId] || nodes['redis-master'];

  const triggerPacketSimulation = () => {
    if (isSimulatingPacket) return;
    setIsSimulatingPacket(true);
    setActivePacketStep(0);

    const steps = [
      { step: 0, node: 'client-ingress' },
      { step: 1, node: 'api-gateway' },
      { step: 2, node: 'postgres-outbox' },
      { step: 3, node: 'redis-master' },
      { step: 4, node: 'worker-alpha' },
      { step: 5, node: 'storage-volume' },
    ];

    steps.forEach((s, idx) => {
      setTimeout(() => {
        setActivePacketStep(s.step);
        setSelectedNodeId(s.node);

        if (idx === steps.length - 1) {
          setTimeout(() => {
            setIsSimulatingPacket(false);
            setActivePacketStep(-1);
          }, 1200);
        }
      }, idx * 650);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry & Timeline Control Bar */}
      <div className="p-4 rounded-xl bg-[#0D111B] border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              CLUSTER TOPOLOGY MESH
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Timeline Interval Scrub */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#080A0F] border border-slate-800 rounded-lg text-[10px] font-mono">
            {intervals.slice(4, 11).map((int) => (
              <button
                key={int}
                onClick={() => setActiveInterval(int)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeInterval === int
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {int}
              </button>
            ))}
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold border border-emerald-500/30">
              HEALTHY
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          <button
            onClick={triggerPacketSimulation}
            disabled={isSimulatingPacket}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/30 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulatingPacket ? 'animate-spin text-cyan-300' : ''}`} />
            <span>{isSimulatingPacket ? 'Transmitting Data Packet...' : 'Dispatch Live Trace'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas: Interactive Service Mesh Topology */}
      <div className="relative rounded-2xl bg-[#0D111B] p-6 sm:p-8 border border-slate-800 shadow-2xl overflow-hidden min-h-[460px] flex flex-col justify-between">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

        {/* Subtle Ambient Nebulas */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Flow Track Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Active Trace Route:</span>
            <span className="text-white font-semibold">
              Client → Gateway → Outbox → Redis → Workers → Artifacts
            </span>
          </div>
          <div className="text-[11px] text-cyan-400 font-mono hidden sm:block">
            {isSimulatingPacket ? `Packet Stage ${activePacketStep + 1} of 6 active` : 'Click any node to inspect telemetry'}
          </div>
        </div>

        {/* Topology Nodes Grid (Visual Mesh layout) */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 items-center py-4">
          {/* Column 1: Client Ingress */}
          <div className="space-y-4">
            <button
              onClick={() => setSelectedNodeId('client-ingress')}
              className={`w-full p-4 rounded-xl border text-left transition-all duration-300 relative cursor-pointer ${
                selectedNodeId === 'client-ingress' || activePacketStep === 0
                  ? 'bg-[#111725] border-cyan-400 ring-2 ring-cyan-500/40 shadow-xl shadow-cyan-500/20 scale-[1.02]'
                  : 'bg-[#111725]/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`w-2 h-2 rounded-full ${activePacketStep === 0 ? 'bg-cyan-300 scale-125' : 'bg-cyan-400'} animate-pulse`} />
                <span className="text-[10px] font-mono text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                  {nodes['client-ingress'].throughput}
                </span>
              </div>
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>{nodes['client-ingress'].name}</span>
                {activePacketStep === 0 && (
                  <span className="text-[9px] font-mono px-1 rounded bg-cyan-500 text-slate-950 font-bold">SENDING</span>
                )}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">{nodes['client-ingress'].sub}</div>
              <div className="mt-2 text-[10px] text-slate-500 font-mono">React 19 Frontend</div>
            </button>
          </div>

          {/* Column 2: API Gateway & PostgreSQL Outbox */}
          <div className="space-y-4">
            <button
              onClick={() => setSelectedNodeId('api-gateway')}
              className={`w-full p-4 rounded-xl border text-left transition-all duration-300 relative cursor-pointer ${
                selectedNodeId === 'api-gateway' || activePacketStep === 1
                  ? 'bg-[#111725] border-indigo-400 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-500/20 scale-[1.02]'
                  : 'bg-[#111725]/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`w-2 h-2 rounded-full ${activePacketStep === 1 ? 'bg-indigo-300 scale-125' : 'bg-indigo-400'} animate-pulse`} />
                <span className="text-[10px] font-mono text-indigo-400 font-semibold px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">
                  {nodes['api-gateway'].throughput}
                </span>
              </div>
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>{nodes['api-gateway'].name}</span>
                {activePacketStep === 1 && (
                  <span className="text-[9px] font-mono px-1 rounded bg-indigo-400 text-slate-950 font-bold">VALIDATING</span>
                )}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">{nodes['api-gateway'].sub}</div>
              <div className="mt-2 text-[10px] text-slate-500 font-mono">FastAPI Ingress Gateway</div>
            </button>

            <button
              onClick={() => setSelectedNodeId('postgres-outbox')}
              className={`w-full p-4 rounded-xl border text-left transition-all duration-300 relative cursor-pointer ${
                selectedNodeId === 'postgres-outbox' || activePacketStep === 2
                  ? 'bg-[#111725] border-purple-400 ring-2 ring-purple-500/40 shadow-xl shadow-purple-500/20 scale-[1.02]'
                  : 'bg-[#111725]/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`w-2 h-2 rounded-full ${activePacketStep === 2 ? 'bg-purple-300 scale-125' : 'bg-purple-400'} animate-pulse`} />
                <span className="text-[10px] font-mono text-purple-400 font-semibold px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/40">
                  {nodes['postgres-outbox'].throughput}
                </span>
              </div>
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>{nodes['postgres-outbox'].name}</span>
                {activePacketStep === 2 && (
                  <span className="text-[9px] font-mono px-1 rounded bg-purple-400 text-slate-950 font-bold">COMMITTED</span>
                )}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">{nodes['postgres-outbox'].sub}</div>
              <div className="mt-2 text-[10px] text-slate-500 font-mono">Transactional Outbox</div>
            </button>
          </div>

          {/* Column 3: Central Redis-Master Broker */}
          <div className="space-y-4">
            <button
              onClick={() => setSelectedNodeId('redis-master')}
              className={`w-full p-5 rounded-xl border text-left transition-all duration-300 relative cursor-pointer ${
                selectedNodeId === 'redis-master' || activePacketStep === 3
                  ? 'bg-[#111725] border-blue-400 ring-2 ring-blue-500/40 shadow-2xl shadow-blue-500/30 scale-[1.03]'
                  : 'bg-[#111725]/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${activePacketStep === 3 ? 'bg-blue-300 scale-125' : 'bg-blue-400'} animate-pulse`} />
                  <span className="text-[10px] font-mono uppercase text-blue-400 font-bold">CORE BROKER</span>
                </div>
                <span className="text-[10px] font-mono text-blue-400 font-semibold px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">
                  {nodes['redis-master'].throughput}
                </span>
              </div>
              <div className="text-sm font-bold text-white flex items-center justify-between">
                <span>{nodes['redis-master'].name}</span>
                {activePacketStep === 3 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-400 text-slate-950 font-bold">QUEUED</span>
                )}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">{nodes['redis-master'].sub}</div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1 text-[9px] font-mono text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-[#080A0F] border border-slate-800">[reports]</span>
                <span className="px-1.5 py-0.5 rounded bg-[#080A0F] border border-slate-800">[data_processing]</span>
                <span className="px-1.5 py-0.5 rounded bg-[#080A0F] border border-slate-800">[maintenance]</span>
              </div>
            </button>
          </div>

          {/* Column 4: Celery Workers & Output Volume */}
          <div className="space-y-3">
            <button
              onClick={() => setSelectedNodeId('worker-alpha')}
              className={`w-full p-3.5 rounded-xl border text-left transition-all duration-300 relative cursor-pointer ${
                selectedNodeId === 'worker-alpha' || activePacketStep === 4
                  ? 'bg-[#111725] border-pink-400 ring-2 ring-pink-500/40 shadow-lg shadow-pink-500/20 scale-[1.02]'
                  : 'bg-[#111725]/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{nodes['worker-alpha'].name}</span>
                <span className="text-[10px] font-mono text-pink-400 font-semibold">
                  {nodes['worker-alpha'].throughput}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">PDF/CSV Reports Worker</div>
              {activePacketStep === 4 && (
                <div className="mt-1.5 text-[9px] font-mono text-pink-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                  <span>Processing Report...</span>
                </div>
              )}
            </button>

            <button
              onClick={() => setSelectedNodeId('worker-beta')}
              className={`w-full p-3.5 rounded-xl border text-left transition-all duration-300 relative cursor-pointer ${
                selectedNodeId === 'worker-beta'
                  ? 'bg-[#111725] border-amber-400 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/20 scale-[1.02]'
                  : 'bg-[#111725]/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{nodes['worker-beta'].name}</span>
                <span className="text-[10px] font-mono text-amber-400 font-semibold">
                  {nodes['worker-beta'].throughput}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">Batch Analytics Worker</div>
            </button>

            <button
              onClick={() => setSelectedNodeId('storage-volume')}
              className={`w-full p-3.5 rounded-xl border text-left transition-all duration-300 relative cursor-pointer ${
                selectedNodeId === 'storage-volume' || activePacketStep === 5
                  ? 'bg-[#111725] border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-[#111725]/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{nodes['storage-volume'].name}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                  {nodes['storage-volume'].throughput}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">Encrypted Artifact Volume</div>
              {activePacketStep === 5 && (
                <div className="mt-1.5 text-[9px] font-mono text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Artifact Published!</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Selected Node Real-time Inspector */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="md:col-span-2 space-y-2.5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                ACTIVE TELEMETRY:
              </span>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                {selectedNode.name}
                <span className="text-xs font-mono font-normal text-slate-400 px-2 py-0.5 rounded bg-[#080A0F] border border-slate-800">
                  {selectedNode.tech}
                </span>
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.description}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedNode.details.map((d, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#080A0F] border border-slate-800 text-xs font-mono text-slate-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#080A0F] border border-slate-800 space-y-3 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase font-semibold mb-2">Live Node Bandwidth</div>
              <div className="text-xl font-bold font-mono text-cyan-400">{selectedNode.throughput}</div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">Status: Operational · Health: 100%</div>
            </div>
            <div className="w-full bg-[#111725] rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-1.5 w-3/4 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
