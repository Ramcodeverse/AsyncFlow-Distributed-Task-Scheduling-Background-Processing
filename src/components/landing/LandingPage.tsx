import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  Clock,
  Terminal,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Copy,
  Check,
  ChevronRight,
  Database,
  ExternalLink,
  Sparkles,
  Server,
  Lock,
  Workflow,
  BarChart3,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { BackgroundParticles } from './BackgroundParticles';
import { HeroShowcase } from './HeroShowcase';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { RequestFlowComparison } from './RequestFlowComparison';
import { InteractiveSandbox } from './InteractiveSandbox';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState<boolean>(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'python' | 'curl' | 'typescript'>('python');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Scroll detection for slim floating navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const codeSnippets = {
    python: `import httpx
import asyncio

async def submit_job():
    async with httpx.AsyncClient(base_url="https://api.asyncflow.io") as client:
        # Non-blocking enqueue with Idempotency protection
        response = await client.post(
            "/api/v1/tasks",
            headers={
                "Authorization": "Bearer af_live_948f2190c1e8470a82bcf921",
                "Idempotency-Key": "req_unique_882014"
            },
            json={
                "task_type": "pdf_report",
                "task_name": "Q1 Performance Audit",
                "priority": "high",
                "payload": {
                    "template": "executive",
                    "date_range": "2026-Q1",
                    "include_charts": True
                }
            }
        )
        task = response.json()
        print(f"Task Enqueued: {task['task']['id']} (Status: {task['task']['status']})")

asyncio.run(submit_job())`,

    curl: `curl -X POST https://api.asyncflow.io/api/v1/tasks \\
  -H "Authorization: Bearer af_live_948f2190c1e8470a82bcf921" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: req_idem_882104" \\
  -d '{
    "task_type": "csv_report",
    "task_name": "Weekly Audit Export",
    "priority": "normal",
    "payload": {
      "dataset": "audit_logs",
      "format": "csv"
    }
  }'`,

    typescript: `import { AsyncFlowClient } from '@asyncflow/sdk';

const client = new AsyncFlowClient({
  apiKey: process.env.ASYNCFLOW_API_KEY
});

// Non-blocking task dispatch with idempotency protection
const task = await client.tasks.create({
  taskType: 'data_processing',
  taskName: 'Telemetry Quantile Rollup',
  priority: 'normal',
  payload: {
    batchSize: 50000,
    transformation: 'quantile_p99'
  }
});

console.log(\`Task dispatched to Celery: \${task.publicId}\`);`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F5F7FB] font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Particles & Linear Lighting Layer */}
      <BackgroundParticles className="h-full" />
      <div className="fixed inset-0 bg-radial-gradient pointer-events-none z-0" />
      <div className="fixed inset-0 bg-grid-pattern opacity-15 pointer-events-none z-0" />

      {/* 3.A SLIM, ELEGANT NAVIGATION BAR */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#0D111B]/90 backdrop-blur-xl border-b border-slate-800/80 py-3 shadow-2xl' : 'bg-transparent py-5'
        }`}
      >
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Left: Brand symbol & wordmark */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white group-hover:text-indigo-300 transition-colors">
              AsyncFlow
            </span>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center gap-7 text-xs font-medium text-[#929DB1]">
            <a href="#product" className="hover:text-white transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Comparison</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#sandbox" className="hover:text-white transition-colors">Sandbox</a>
            <a href="#developers" className="hover:text-white transition-colors">Developers</a>
          </div>

          {/* Right: Sign in and Primary CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-medium text-[#929DB1] hover:text-white px-2.5 py-1.5 transition-colors cursor-pointer"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-950 rounded-full text-xs font-bold shadow-md shadow-white/10 transition-all hover:scale-105 cursor-pointer"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3 h-3 text-slate-950" />
            </button>
          </div>
        </nav>
      </header>

      {/* 3.B HERO SECTION — VERCEL & LINEAR INSPIRED */}
      <section id="product" className="relative z-10 pt-32 sm:pt-40 pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center space-y-7">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111725] border border-slate-800 text-[11px] font-mono tracking-wider uppercase text-[#A5B4FC] shadow-sm animate-float-slow">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>DISTRIBUTED TASK ORCHESTRATION</span>
        </div>

        {/* Headline */}
        <div className="space-y-3 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Heavy work.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-cyan-300 to-indigo-200">
              Handled in the background.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-[#929DB1] max-w-xl mx-auto leading-relaxed pt-1">
            Submit, schedule, and monitor background jobs through one reliable platform. Keep your APIs responsive while distributed workers do the heavy lifting.
          </p>
        </div>

        {/* Primary & Secondary CTAs (Linear/Vercel Pill style) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-950 rounded-full text-xs font-bold shadow-xl shadow-white/10 transition-all hover:scale-105 cursor-pointer"
          >
            <span>Explore the Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
          </button>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#111725] hover:bg-[#171E2D] text-slate-200 hover:text-white text-xs font-semibold border border-slate-800 transition-all"
          >
            <span>See How It Works</span>
          </a>
        </div>

        {/* Technical Stack Note */}
        <div className="text-[11px] font-mono text-slate-500 pt-1">
          FastAPI · Redis · Celery · PostgreSQL
        </div>

        {/* 3.C PRODUCT PREVIEW — THE CENTERPIECE */}
        <div className="pt-6">
          <HeroShowcase />
        </div>
      </section>

      {/* 3.D PRODUCT CREDIBILITY STRIP */}
      <section className="relative z-10 py-10 border-y border-slate-800/80 bg-[#0A0D15]/60">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-medium text-[#929DB1]">
            <span className="text-slate-200">Background Jobs</span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-200">Scheduled Tasks</span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-200">Worker Monitoring</span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-200">Retries &amp; Recovery</span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-200">Execution History</span>
          </div>
        </div>
      </section>

      {/* 3.E PROBLEM-TO-SOLUTION SECTION (SYNCHRONOUS VS ASYNCFLOW) */}
      <section id="how-it-works" className="relative z-10 py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <span className="text-xs font-mono font-semibold text-[#A5B4FC] uppercase tracking-wider">
            SYNCHRONOUS VS. ASYNCHRONOUS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Eliminate thread starvation and connection timeouts
          </h2>
          <p className="text-xs sm:text-sm text-[#929DB1]">
            Heavy file exports, PDF compilers, and telemetry aggregators should never execute inside active HTTP web requests.
          </p>
        </div>

        {/* Interactive Side-by-Side Diagram Component */}
        <RequestFlowComparison />
      </section>

      {/* 3.F INTERACTIVE ARCHITECTURE SECTION */}
      <section id="architecture" className="relative z-10 py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <span className="text-xs font-mono font-semibold text-[#A5B4FC] uppercase tracking-wider">
            DISTRIBUTED PIPELINE
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Client → FastAPI → Redis → Celery → PostgreSQL
          </h2>
          <p className="text-xs sm:text-sm text-[#929DB1]">
            Explore the live cluster topology below. Click any component tier or trigger a live trace packet to inspect telemetry and execution flow.
          </p>
        </div>

        <ArchitectureDiagram />
      </section>

      {/* 3.G FEATURE SECTIONS */}
      <section id="features" className="relative z-10 py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <span className="text-xs font-mono font-semibold text-[#A5B4FC] uppercase tracking-wider">
            PLATFORM CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Engineered for high-volume execution
          </h2>
          <p className="text-xs sm:text-sm text-[#929DB1]">
            Every feature is purpose-built to deliver observable, resilient, and non-blocking background processing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Background Processing',
              desc: 'Tasks advance seamlessly from queued to running to completed without locking HTTP threads.',
              icon: Layers,
            },
            {
              title: 'Smart Scheduling',
              desc: 'Database-backed recurring jobs with 5-field cron expressions, timezone support, and overlap skip rules.',
              icon: Clock,
            },
            {
              title: 'Retry and Recovery',
              desc: 'Failed tasks enter exponential backoff with jitter and retry cleanly on subsequent attempts.',
              icon: RotateCcw,
            },
            {
              title: 'Live Progress Streaming',
              desc: 'Execution milestones and percent progress stream directly over Server-Sent Events without polling.',
              icon: Activity,
            },
            {
              title: 'Worker Monitoring',
              desc: 'Track registered worker nodes, active concurrency slots, bound queues, and heartbeats in real time.',
              icon: Cpu,
            },
            {
              title: 'Execution Analytics',
              desc: 'Inspect cluster throughput, P95 latency percentiles, queue depths, and failure trends.',
              icon: BarChart3,
            },
            {
              title: 'Secure Result Delivery',
              desc: 'Generated PDF and CSV artifacts are stored with cryptographic keys and authorized download endpoints.',
              icon: FileText,
            },
            {
              title: 'Developer Experience',
              desc: 'Clean REST endpoints, Pydantic schemas, and typed SDKs for effortless integration.',
              icon: Terminal,
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[#111725] border border-slate-800/80 space-y-2.5 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#171E2D] border border-slate-800 flex items-center justify-center text-[#A5B4FC]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">{f.title}</h3>
                  <p className="text-[11px] text-[#929DB1] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3.H INTERACTIVE PLAYGROUND / SANDBOX SECTION */}
      <section id="sandbox" className="relative z-10 py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <span className="text-xs font-mono font-semibold text-[#67E8F9] uppercase tracking-wider">
            HANDS-ON SIMULATION
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Dispatch a task right from this page
          </h2>
          <p className="text-xs sm:text-sm text-[#929DB1]">
            Experience how AsyncFlow ingests, queues, executes, and delivers results in real time with zero thread blocking.
          </p>
        </div>

        <InteractiveSandbox />
      </section>

      {/* 3.I DEVELOPER EXPERIENCE & CODE BLOCK */}
      <section id="developers" className="relative z-10 py-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <span className="text-xs font-mono font-semibold text-[#A5B4FC] uppercase tracking-wider">
            API FIRST
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Simple, expressive API integration
          </h2>
          <p className="text-xs sm:text-sm text-[#929DB1]">
            Submit, query, cancel, or stream background tasks with clean REST endpoints.
          </p>
        </div>

        <div className="max-w-3xl mx-auto rounded-2xl bg-[#0D111B] overflow-hidden border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 bg-[#080A0F] border-b border-slate-800">
            <div className="flex items-center gap-2">
              {(['python', 'curl', 'typescript'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCodeTab(tab)}
                  className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors capitalize cursor-pointer ${
                    activeCodeTab === tab
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-white bg-[#111725] border border-slate-800 rounded transition-colors cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-5 font-mono text-xs text-[#A5B4FC] bg-[#06080F] overflow-x-auto leading-relaxed">
            {codeSnippets[activeCodeTab]}
          </pre>
        </div>
      </section>

      {/* 3.J FINAL CTA */}
      <section className="relative z-10 py-24 px-4 text-center">
        <div className="max-w-4xl mx-auto p-10 sm:p-14 rounded-3xl bg-[#0D111B] border border-slate-800 glow-indigo space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient opacity-40 pointer-events-none" />

          <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Your API stays responsive.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-cyan-300 to-indigo-200">
                Your jobs keep moving.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[#929DB1] max-w-md mx-auto leading-relaxed">
              Bring task execution, scheduling, and operational visibility into one streamlined workflow.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-950 rounded-full text-xs font-bold shadow-xl shadow-white/10 transition-all hover:scale-105 cursor-pointer"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </button>
            <a
              href="#developers"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#111725] hover:bg-[#171E2D] text-slate-200 hover:text-white text-xs font-semibold border border-slate-800 transition-colors"
            >
              Read Documentation
            </a>
          </div>
        </div>
      </section>

      {/* 3.K FOOTER */}
      <footer id="documentation" className="relative z-10 border-t border-slate-800/80 bg-[#06080F] py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white">
                <Radio className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-sm text-white">AsyncFlow</span>
            </div>
            <p className="text-xs text-[#929DB1] max-w-sm leading-relaxed">
              Distributed task scheduling, queue monitoring, and resilient background processing platform.
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-1">
              © {new Date().getFullYear()} AsyncFlow. Open-source distributed architecture.
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono font-semibold text-slate-200 uppercase">Product</div>
            <ul className="text-xs text-[#929DB1] space-y-1.5 font-medium">
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors cursor-pointer">Cluster Console</button></li>
              <li><button onClick={() => navigate('/tasks')} className="hover:text-white transition-colors cursor-pointer">Task Queue</button></li>
              <li><button onClick={() => navigate('/schedules')} className="hover:text-white transition-colors cursor-pointer">Schedules</button></li>
              <li><button onClick={() => navigate('/workers')} className="hover:text-white transition-colors cursor-pointer">Worker Pool</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono font-semibold text-slate-200 uppercase">Architecture</div>
            <ul className="text-xs text-[#929DB1] space-y-1.5 font-medium">
              <li><a href="#architecture" className="hover:text-white transition-colors">Transactional Outbox</a></li>
              <li><a href="#architecture" className="hover:text-white transition-colors">Redis Routing</a></li>
              <li><button onClick={() => navigate('/monitoring')} className="hover:text-white transition-colors cursor-pointer">Prometheus Metrics</button></li>
              <li><button onClick={() => navigate('/activity')} className="hover:text-white transition-colors cursor-pointer">Audit Trail</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono font-semibold text-slate-200 uppercase">Developers</div>
            <ul className="text-xs text-[#929DB1] space-y-1.5 font-medium">
              <li><a href="#developers" className="hover:text-white transition-colors">Python SDK</a></li>
              <li><a href="#developers" className="hover:text-white transition-colors">REST API Spec</a></li>
              <li><button onClick={() => navigate('/settings')} className="hover:text-white transition-colors cursor-pointer">API Credentials</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors cursor-pointer">Sign In</button></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};
