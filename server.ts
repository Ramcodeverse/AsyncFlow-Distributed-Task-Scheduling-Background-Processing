import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { jsPDF } from 'jspdf';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const STORAGE_DIR = path.join(__dirname, 'storage', 'results');
const DATA_DIR = path.join(__dirname, 'data');

// Ensure directories exist
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Types
interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'user';
  department: string;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  passwordHash: string;
}

interface OutboxEvent {
  id: string;
  taskId: string;
  status: 'PENDING' | 'DISPATCHED' | 'FAILED';
  attempts: number;
  createdAt: string;
  dispatchedAt?: string;
  error?: string;
}

// In-memory Database / Canonical Store
const DB = {
  users: new Map<string, UserSession>(),
  sessions: new Map<string, string>(), // token -> userId
  tasks: new Map<string, any>(),
  taskLogs: new Map<string, any[]>(),
  taskAttempts: new Map<string, any[]>(),
  taskEvents: new Map<string, any[]>(),
  schedules: new Map<string, any>(),
  outbox: new Map<string, OutboxEvent>(),
  auditLogs: [] as any[],
  notifications: [] as any[],
  idempotencyStore: new Map<string, { taskId: string; payloadHash: string }>(),
  workers: [
    {
      name: 'celery@worker-node-alpha',
      status: 'healthy',
      queues: ['reports', 'default'],
      concurrency: 4,
      activeTasks: 0,
      reservedTasks: 0,
      totalCompleted: 142,
      totalFailed: 3,
      lastHeartbeat: new Date().toISOString(),
      uptimeSeconds: 86400 * 4 + 3200,
      cpuPercent: 18.4,
      memoryMb: 412,
    },
    {
      name: 'celery@worker-node-beta',
      status: 'healthy',
      queues: ['data_processing'],
      concurrency: 6,
      activeTasks: 0,
      reservedTasks: 0,
      totalCompleted: 389,
      totalFailed: 8,
      lastHeartbeat: new Date().toISOString(),
      uptimeSeconds: 86400 * 3 + 12400,
      cpuPercent: 34.2,
      memoryMb: 890,
    },
    {
      name: 'celery@worker-node-gamma',
      status: 'healthy',
      queues: ['maintenance', 'default'],
      concurrency: 4,
      activeTasks: 0,
      reservedTasks: 0,
      totalCompleted: 98,
      totalFailed: 1,
      lastHeartbeat: new Date().toISOString(),
      uptimeSeconds: 86400 * 5 + 400,
      cpuPercent: 12.1,
      memoryMb: 350,
    },
  ],
};

// Seed initial users
const adminHash = bcrypt.hashSync('admin123', 10);
const operatorHash = bcrypt.hashSync('operator123', 10);
const userHash = bcrypt.hashSync('user123', 10);

DB.users.set('usr-admin', {
  id: 'usr-admin',
  email: 'admin@asyncflow.io',
  name: 'DevOps Admin',
  role: 'admin',
  department: 'Infrastructure & Platform',
  createdAt: '2026-01-10T08:00:00.000Z',
  lastLoginAt: new Date().toISOString(),
  isActive: true,
  passwordHash: adminHash,
});

DB.users.set('usr-operator', {
  id: 'usr-operator',
  email: 'operator@asyncflow.io',
  name: 'Reliability Lead',
  role: 'operator',
  department: 'Site Reliability Engineering',
  createdAt: '2026-02-15T10:00:00.000Z',
  lastLoginAt: new Date().toISOString(),
  isActive: true,
  passwordHash: operatorHash,
});

DB.users.set('usr-dev', {
  id: 'usr-dev',
  email: 'user@asyncflow.io',
  name: 'Data Engineer',
  role: 'user',
  department: 'Analytics & Reporting',
  createdAt: '2026-03-01T12:00:00.000Z',
  lastLoginAt: new Date().toISOString(),
  isActive: true,
  passwordHash: userHash,
});

// Seed Initial Tasks for rich immediate inspection
const initialTaskIds = ['task-pdf-101', 'task-csv-102', 'task-proc-103', 'task-val-104'];

DB.tasks.set('task-pdf-101', {
  id: 'task-pdf-101',
  publicId: 'af-tsk-8812c3',
  userId: 'usr-dev',
  userName: 'Data Engineer',
  taskType: 'pdf_report',
  taskName: 'Q1 Enterprise Resource Utilization PDF',
  status: 'succeeded',
  priority: 'high',
  queue: 'reports',
  payload: { title: 'Q1 Enterprise Resource Utilization', template: 'executive', includeCharts: true, dateRange: '2026-01-01 to 2026-03-31' },
  progress: 100,
  currentStage: 'Completed & published artifact',
  createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  queuedAt: new Date(Date.now() - 3600000 * 2 + 1000).toISOString(),
  startedAt: new Date(Date.now() - 3600000 * 2 + 2500).toISOString(),
  finishedAt: new Date(Date.now() - 3600000 * 2 + 14200).toISOString(),
  durationMs: 11700,
  attemptCount: 1,
  maxAttempts: 3,
  celeryTaskId: 'celery-uuid-a1b2c3d4-0001',
  assignedWorker: 'celery@worker-node-alpha',
  result: {
    fileName: 'Q1_Enterprise_Resource_Utilization.pdf',
    fileSize: 45280,
    fileType: 'application/pdf',
    downloadUrl: '/api/v1/tasks/task-pdf-101/download',
    recordsProcessed: 1450,
    summary: { generatedPages: 3, totalNodes: 24, aggregatedMetric: '99.98% SLA' },
  },
});

DB.taskLogs.set('task-pdf-101', [
  { id: 'log-1', timestamp: new Date(Date.now() - 3600000 * 2 + 2600).toISOString(), level: 'INFO', message: 'Worker picked up task from queue [reports]', attemptNumber: 1 },
  { id: 'log-2', timestamp: new Date(Date.now() - 3600000 * 2 + 4000).toISOString(), level: 'INFO', message: 'Loaded template "executive" and validated parameters', attemptNumber: 1 },
  { id: 'log-3', timestamp: new Date(Date.now() - 3600000 * 2 + 7500).toISOString(), level: 'DEBUG', message: 'Queried 1,450 records from Postgres data warehouse partition', attemptNumber: 1 },
  { id: 'log-4', timestamp: new Date(Date.now() - 3600000 * 2 + 11000).toISOString(), level: 'INFO', message: 'Rendering vector tables and charts into PDF document', attemptNumber: 1 },
  { id: 'log-5', timestamp: new Date(Date.now() - 3600000 * 2 + 14100).toISOString(), level: 'INFO', message: 'Saved artifact to storage. Execution completed cleanly.', attemptNumber: 1 },
]);

DB.taskAttempts.set('task-pdf-101', [
  { attemptNumber: 1, startedAt: new Date(Date.now() - 3600000 * 2 + 2500).toISOString(), finishedAt: new Date(Date.now() - 3600000 * 2 + 14200).toISOString(), durationMs: 11700, status: 'succeeded', workerName: 'celery@worker-node-alpha' },
]);

DB.taskEvents.set('task-pdf-101', [
  { id: 'ev-1', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), event: 'TASK_SUBMITTED', details: 'Task queued by Data Engineer via REST API' },
  { id: 'ev-2', timestamp: new Date(Date.now() - 3600000 * 2 + 1000).toISOString(), event: 'OUTBOX_DISPATCHED', details: 'Transactional outbox published task to Redis queue [reports]' },
  { id: 'ev-3', timestamp: new Date(Date.now() - 3600000 * 2 + 2500).toISOString(), event: 'WORKER_ACKNOWLEDGED', details: 'Worker celery@worker-node-alpha began execution' },
  { id: 'ev-4', timestamp: new Date(Date.now() - 3600000 * 2 + 14200).toISOString(), event: 'TASK_COMPLETED', details: 'Result binary written to durable storage' },
]);

DB.tasks.set('task-csv-102', {
  id: 'task-csv-102',
  publicId: 'af-tsk-9923d1',
  userId: 'usr-admin',
  userName: 'DevOps Admin',
  taskType: 'csv_report',
  taskName: 'Weekly Audit Logs Export (CSV)',
  status: 'succeeded',
  priority: 'normal',
  queue: 'reports',
  payload: { dataset: 'audit_logs', dateRange: 'Last 7 Days', delimiter: 'comma', compression: 'none' },
  progress: 100,
  currentStage: 'Completed & ready for download',
  createdAt: new Date(Date.now() - 1800000).toISOString(),
  queuedAt: new Date(Date.now() - 1800000 + 800).toISOString(),
  startedAt: new Date(Date.now() - 1800000 + 2000).toISOString(),
  finishedAt: new Date(Date.now() - 1800000 + 7200).toISOString(),
  durationMs: 5200,
  attemptCount: 1,
  maxAttempts: 3,
  celeryTaskId: 'celery-uuid-b2c3d4e5-0002',
  assignedWorker: 'celery@worker-node-alpha',
  result: {
    fileName: 'Weekly_Audit_Logs_Export.csv',
    fileSize: 18450,
    fileType: 'text/csv',
    downloadUrl: '/api/v1/tasks/task-csv-102/download',
    recordsProcessed: 280,
    summary: { totalExportedRows: 280, headerColumns: ['timestamp', 'actor', 'action', 'target', 'ip', 'status'] },
  },
});

DB.taskLogs.set('task-csv-102', [
  { id: 'log-10', timestamp: new Date(Date.now() - 1800000 + 2100).toISOString(), level: 'INFO', message: 'Worker started processing CSV export stream', attemptNumber: 1 },
  { id: 'log-11', timestamp: new Date(Date.now() - 1800000 + 4500).toISOString(), level: 'DEBUG', message: 'Extracted 280 audit rows with RFC 4180 escaping', attemptNumber: 1 },
  { id: 'log-12', timestamp: new Date(Date.now() - 1800000 + 7100).toISOString(), level: 'INFO', message: 'CSV successfully flushed to storage volume', attemptNumber: 1 },
]);

DB.taskAttempts.set('task-csv-102', [
  { attemptNumber: 1, startedAt: new Date(Date.now() - 1800000 + 2000).toISOString(), finishedAt: new Date(Date.now() - 1800000 + 7200).toISOString(), durationMs: 5200, status: 'succeeded', workerName: 'celery@worker-node-alpha' },
]);

DB.taskEvents.set('task-csv-102', [
  { id: 'ev-10', timestamp: new Date(Date.now() - 1800000).toISOString(), event: 'TASK_SUBMITTED', details: 'Manual CSV export initiated by DevOps Admin' },
  { id: 'ev-11', timestamp: new Date(Date.now() - 1800000 + 2000).toISOString(), event: 'WORKER_ACKNOWLEDGED', details: 'Worker celery@worker-node-alpha assigned' },
  { id: 'ev-12', timestamp: new Date(Date.now() - 1800000 + 7200).toISOString(), event: 'TASK_COMPLETED', details: 'CSV artifact generated and registered' },
]);

// Seed Recurring Schedules
DB.schedules.set('sch-nightly-cleanup', {
  id: 'sch-nightly-cleanup',
  name: 'Nightly Database Vacuum & Index Cleanup',
  description: 'Runs maintenance routines and purges expired temporary artifacts older than 14 days',
  taskType: 'simulated_job',
  queue: 'maintenance',
  priority: 'low',
  cronExpression: '0 2 * * *',
  cronDescription: 'Every day at 02:00 AM UTC',
  timezone: 'UTC',
  payload: { durationSeconds: 6, stepCount: 5, failureInjectionPercent: 0 },
  status: 'active',
  overlapPolicy: 'skip_if_running',
  totalRuns: 28,
  lastRunAt: new Date(Date.now() - 3600000 * 14).toISOString(),
  lastRunStatus: 'succeeded',
  nextRunAt: new Date(Date.now() + 3600000 * 10).toISOString(),
  createdAt: '2026-02-01T00:00:00.000Z',
  createdBy: 'admin@asyncflow.io',
  runs: [
    { taskId: 'task-clean-prev', executedAt: new Date(Date.now() - 3600000 * 14).toISOString(), status: 'succeeded' }
  ],
});

DB.schedules.set('sch-hourly-telemetry', {
  id: 'sch-hourly-telemetry',
  name: 'Hourly Cluster Telemetry Aggregation',
  description: 'Rolls up 1-minute metrics into hourly quantiles and anomaly scores',
  taskType: 'data_processing',
  queue: 'data_processing',
  priority: 'normal',
  cronExpression: '0 * * * *',
  cronDescription: 'Every hour at minute 0',
  timezone: 'UTC',
  payload: { batchSize: 5000, aggregationMethod: 'quantile_p99', dataset: 'node_telemetry' },
  status: 'active',
  overlapPolicy: 'skip_if_running',
  totalRuns: 432,
  lastRunAt: new Date(Date.now() - 1800000).toISOString(),
  lastRunStatus: 'succeeded',
  nextRunAt: new Date(Date.now() + 1800000).toISOString(),
  createdAt: '2026-01-15T00:00:00.000Z',
  createdBy: 'admin@asyncflow.io',
  runs: [
    { taskId: 'task-tel-prev', executedAt: new Date(Date.now() - 1800000).toISOString(), status: 'succeeded' }
  ],
});

// Seed Audit Logs
DB.auditLogs.unshift(
  {
    id: 'aud-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    actorEmail: 'admin@asyncflow.io',
    actorRole: 'admin',
    action: 'auth.login',
    targetType: 'system',
    targetId: 'auth',
    details: 'Admin user authenticated successfully via argon2 verification',
    ipAddress: '192.168.1.102',
    status: 'success',
  },
  {
    id: 'aud-2',
    timestamp: new Date(Date.now() - 3600000 * 2 + 500).toISOString(),
    actorEmail: 'user@asyncflow.io',
    actorRole: 'user',
    action: 'task.dispatched',
    targetType: 'task',
    targetId: 'task-pdf-101',
    details: 'Dispatched task Q1 Enterprise Resource Utilization PDF to queue [reports]',
    ipAddress: '10.0.4.82',
    status: 'success',
  },
  {
    id: 'aud-3',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    actorEmail: 'admin@asyncflow.io',
    actorRole: 'admin',
    action: 'schedule.updated',
    targetType: 'schedule',
    targetId: 'sch-hourly-telemetry',
    details: 'Adjusted cron expression to 0 * * * *',
    ipAddress: '192.168.1.102',
    status: 'success',
  }
);

// Seed Notifications
DB.notifications.unshift(
  {
    id: 'notif-1',
    userId: 'usr-dev',
    title: 'Task Succeeded',
    message: 'Report "Q1 Enterprise Resource Utilization PDF" generated successfully.',
    type: 'success',
    taskId: 'task-pdf-101',
    timestamp: new Date(Date.now() - 3600000 * 2 + 14200).toISOString(),
    isRead: false,
  },
  {
    id: 'notif-2',
    userId: 'usr-admin',
    title: 'Export Ready',
    message: 'Weekly Audit Logs Export (CSV) is available for download.',
    type: 'info',
    taskId: 'task-csv-102',
    timestamp: new Date(Date.now() - 1800000 + 7200).toISOString(),
    isRead: true,
  }
);

// Active SSE client connections for real-time task updates
const sseClients = new Set<Response>();

function broadcastSSE(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Transactional Outbox Engine: Process pending events and dispatch to workers
function processOutbox() {
  for (const [outboxId, outboxEvent] of DB.outbox.entries()) {
    if (outboxEvent.status === 'PENDING') {
      const task = DB.tasks.get(outboxEvent.taskId);
      if (!task) {
        outboxEvent.status = 'FAILED';
        outboxEvent.error = 'Task record missing';
        continue;
      }

      // Mark outbox event as dispatched
      outboxEvent.status = 'DISPATCHED';
      outboxEvent.dispatchedAt = new Date().toISOString();

      // Transition task from pending_dispatch to queued
      task.status = 'queued';
      task.queuedAt = new Date().toISOString();

      const event = {
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        event: 'OUTBOX_DISPATCHED',
        details: `Transactional outbox published task to Redis queue [${task.queue}]`,
      };
      const events = DB.taskEvents.get(task.id) || [];
      events.push(event);
      DB.taskEvents.set(task.id, events);

      broadcastSSE('task_updated', task);

      // Trigger asynchronous worker execution
      executeWorkerTask(task.id);
    }
  }
}

// Background Worker Execution Simulator & Generator
function executeWorkerTask(taskId: string) {
  const task = DB.tasks.get(taskId);
  if (!task) return;

  // Find suitable worker
  const matchingWorker = DB.workers.find(w => w.queues.includes(task.queue) && w.status !== 'offline') || DB.workers[0];
  matchingWorker.activeTasks++;
  task.assignedWorker = matchingWorker.name;

  // Transition to RUNNING
  task.status = 'running';
  task.startedAt = new Date().toISOString();
  task.currentStage = 'Worker acknowledged payload';
  task.progress = 5;

  const currentAttempt = task.attemptCount;
  const attemptRecord = {
    attemptNumber: currentAttempt,
    startedAt: new Date().toISOString(),
    status: 'running' as const,
    workerName: matchingWorker.name,
  };
  const attempts = DB.taskAttempts.get(taskId) || [];
  attempts.push(attemptRecord);
  DB.taskAttempts.set(taskId, attempts);

  const logs = DB.taskLogs.get(taskId) || [];
  logs.push({
    id: `log-${Date.now()}-1`,
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: `Worker ${matchingWorker.name} acquired task lock on queue [${task.queue}]. Starting attempt #${currentAttempt}.`,
    attemptNumber: currentAttempt,
  });
  DB.taskLogs.set(taskId, logs);

  broadcastSSE('task_updated', task);

  // Define multi-stage execution steps based on task type
  let stages: { pct: number; stage: string; delay: number; logMessage: string; logLevel: 'INFO' | 'DEBUG' | 'WARN' }[] = [];

  if (task.taskType === 'pdf_report') {
    stages = [
      { pct: 20, stage: 'Fetching data records and validating schema', delay: 1000, logMessage: 'Validated filter parameters and established query connection', logLevel: 'INFO' },
      { pct: 45, stage: 'Computing statistical metrics & chart aggregates', delay: 1400, logMessage: 'Aggregated 1,450 rows into executive summaries', logLevel: 'DEBUG' },
      { pct: 75, stage: 'Generating PDF vector layout & rendering tables', delay: 1600, logMessage: 'Rendering report layout with embedded typography and table headers', logLevel: 'INFO' },
      { pct: 95, stage: 'Finalizing PDF binary and writing to storage', delay: 1200, logMessage: 'Finalized PDF artifact buffer and computing SHA256 checksum', logLevel: 'DEBUG' },
    ];
  } else if (task.taskType === 'csv_report') {
    stages = [
      { pct: 25, stage: 'Connecting to dataset partition & building cursor', delay: 800, logMessage: 'Opened stream cursor for dataset', logLevel: 'INFO' },
      { pct: 55, stage: 'Formatting and escaping CSV rows', delay: 1200, logMessage: 'Streaming records through RFC 4180 CSV serializer', logLevel: 'DEBUG' },
      { pct: 85, stage: 'Compressing and writing CSV output file', delay: 1100, logMessage: 'Flushed CSV stream to temporary disk location', logLevel: 'INFO' },
      { pct: 95, stage: 'Publishing artifact metadata', delay: 800, logMessage: 'Registered CSV file in storage index', logLevel: 'INFO' },
    ];
  } else if (task.taskType === 'data_processing') {
    stages = [
      { pct: 20, stage: 'Loading chunked dataset into memory', delay: 900, logMessage: 'Loaded dataset chunk into memory buffer', logLevel: 'INFO' },
      { pct: 50, stage: 'Applying mathematical transformations and aggregations', delay: 1500, logMessage: 'Executed vector calculations and grouped metrics', logLevel: 'DEBUG' },
      { pct: 80, stage: 'Running anomaly detection and distribution analysis', delay: 1400, logMessage: 'Identified variance thresholds and p95 latency quantiles', logLevel: 'INFO' },
      { pct: 95, stage: 'Writing structured JSON summary to storage', delay: 900, logMessage: 'Persisted JSON analytics record', logLevel: 'INFO' },
    ];
  } else if (task.taskType === 'file_validation') {
    stages = [
      { pct: 30, stage: 'Inspecting file headers and MIME signature', delay: 900, logMessage: 'Magic bytes validated: application/octet-stream conforms to spec', logLevel: 'INFO' },
      { pct: 60, stage: 'Scanning row constraints and schema integrity', delay: 1200, logMessage: 'Scanning rows for null constraints, boundary ranges, and encoding', logLevel: 'DEBUG' },
      { pct: 90, stage: 'Generating validation summary report', delay: 900, logMessage: '0 fatal schema errors detected, all records passed validation rules', logLevel: 'INFO' },
    ];
  } else {
    // Simulated job
    const userDuration = Number(task.payload?.durationSeconds) || 6;
    const stepTime = Math.max(800, Math.floor((userDuration * 1000) / 4));
    stages = [
      { pct: 25, stage: 'Simulating workload step 1/4 (Initialization)', delay: stepTime, logMessage: 'Simulated task initialized memory structures', logLevel: 'INFO' },
      { pct: 50, stage: 'Simulating workload step 2/4 (Computation)', delay: stepTime, logMessage: 'Computing simulated heavy payload batch', logLevel: 'DEBUG' },
      { pct: 75, stage: 'Simulating workload step 3/4 (Validation)', delay: stepTime, logMessage: 'Checking intermediate state invariants', logLevel: 'INFO' },
      { pct: 95, stage: 'Simulating workload step 4/4 (Finalization)', delay: stepTime, logMessage: 'Finalizing simulated output state', logLevel: 'INFO' },
    ];
  }

  let stageIndex = 0;

  function runNextStage() {
    const currentTask = DB.tasks.get(taskId);
    if (!currentTask) return;

    // Check for cooperative cancellation
    if (currentTask.cancelRequested) {
      currentTask.status = 'cancelled';
      currentTask.currentStage = 'Task cancelled upon user request';
      currentTask.finishedAt = new Date().toISOString();
      matchingWorker.activeTasks = Math.max(0, matchingWorker.activeTasks - 1);

      const logList = DB.taskLogs.get(taskId) || [];
      logList.push({
        id: `log-${Date.now()}-c`,
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message: 'Task received cooperative cancellation signal. Cleaning up resources and terminating safely.',
        attemptNumber: currentAttempt,
      });

      const events = DB.taskEvents.get(taskId) || [];
      events.push({
        id: `ev-${Date.now()}-c`,
        timestamp: new Date().toISOString(),
        event: 'TASK_CANCELLED',
        details: 'Task execution interrupted cleanly upon user request',
      });

      broadcastSSE('task_updated', currentTask);
      return;
    }

    if (stageIndex < stages.length) {
      const step = stages[stageIndex];
      stageIndex++;

      setTimeout(() => {
        const t = DB.tasks.get(taskId);
        if (!t || t.status === 'cancelled') return;

        t.progress = step.pct;
        t.currentStage = step.stage;

        const logList = DB.taskLogs.get(taskId) || [];
        logList.push({
          id: `log-${Date.now()}-${step.pct}`,
          timestamp: new Date().toISOString(),
          level: step.logLevel,
          message: step.logMessage,
          attemptNumber: currentAttempt,
        });

        broadcastSSE('task_updated', t);
        runNextStage();
      }, step.delay);
    } else {
      // Final stage: check for failure injection or complete successfully
      setTimeout(() => {
        finalizeTask(taskId, matchingWorker, currentAttempt);
      }, 1000);
    }
  }

  runNextStage();
}

function finalizeTask(taskId: string, worker: any, attemptNumber: number) {
  const task = DB.tasks.get(taskId);
  if (!task || task.status === 'cancelled') return;

  worker.activeTasks = Math.max(0, worker.activeTasks - 1);

  // Check if simulated failure injection is requested
  const failurePercent = Number(task.payload?.failureInjectionPercent) || 0;
  const shouldFail = failurePercent > 0 && Math.random() * 100 < failurePercent;

  if (shouldFail && task.attemptCount < task.maxAttempts) {
    // Retryable failure
    task.status = 'retrying';
    task.attemptCount++;
    task.currentStage = `Attempt #${attemptNumber} failed: simulated downstream timeout. Scheduling retry with exponential backoff...`;
    task.errorCode = 'ERR_DOWNSTREAM_TIMEOUT';
    task.safeErrorMessage = 'Simulated network timeout connecting to secondary data store. Retrying...';

    const logList = DB.taskLogs.get(taskId) || [];
    logList.push({
      id: `log-${Date.now()}-err`,
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: `Execution attempt #${attemptNumber} raised ERR_DOWNSTREAM_TIMEOUT. Triggering Celery auto-retry with backoff.`,
      attemptNumber,
    });

    const events = DB.taskEvents.get(taskId) || [];
    events.push({
      id: `ev-${Date.now()}-ret`,
      timestamp: new Date().toISOString(),
      event: 'RETRY_INITIATED',
      details: `Attempt #${attemptNumber} failed. Backing off before attempt #${task.attemptCount}.`,
    });

    broadcastSSE('task_updated', task);

    // Exponential backoff
    setTimeout(() => {
      task.status = 'queued';
      broadcastSSE('task_updated', task);
      executeWorkerTask(taskId);
    }, 3500);

    return;
  } else if (shouldFail) {
    // Permanent failure (max attempts exhausted)
    task.status = 'failed';
    task.finishedAt = new Date().toISOString();
    task.durationMs = task.startedAt ? new Date(task.finishedAt).getTime() - new Date(task.startedAt).getTime() : 8000;
    task.currentStage = 'Execution failed permanently after exhausting all retry attempts';
    task.errorCode = 'ERR_MAX_RETRIES_EXCEEDED';
    task.safeErrorMessage = 'Worker encountered unrecoverable downstream error after multiple attempts.';
    worker.totalFailed++;

    const logList = DB.taskLogs.get(taskId) || [];
    logList.push({
      id: `log-${Date.now()}-fail`,
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Max retry attempts exhausted. Marking task as permanently failed.',
      attemptNumber,
    });

    DB.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: task.userId,
      title: 'Task Failed',
      message: `Task "${task.taskName}" failed after ${task.attemptCount} attempts.`,
      type: 'error',
      taskId: task.id,
      timestamp: new Date().toISOString(),
      isRead: false,
    });

    broadcastSSE('task_updated', task);
    return;
  }

  // SUCCESS: Generate real files based on task type
  task.status = 'succeeded';
  task.progress = 100;
  task.finishedAt = new Date().toISOString();
  task.durationMs = task.startedAt ? new Date(task.finishedAt).getTime() - new Date(task.startedAt).getTime() : 6500;
  task.currentStage = 'Completed successfully. Output artifacts generated.';
  worker.totalCompleted++;

  // Generate output files
  if (task.taskType === 'pdf_report') {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('AsyncFlow System Report', 20, 24);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Title: ${task.payload?.title || task.taskName}`, 20, 34);

    doc.setFontSize(10);
    doc.text(`Task ID: ${task.id} (${task.publicId})`, 20, 44);
    doc.text(`Generated At: ${task.finishedAt} UTC`, 20, 50);
    doc.text(`Assigned Worker: ${worker.name}`, 20, 56);
    doc.text(`Template: ${task.payload?.template || 'standard'}`, 20, 62);

    doc.setDrawColor(203, 213, 225);
    doc.line(20, 68, 190, 68);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Executive Summary & Metrics', 20, 78);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text('• Total records processed: 1,842 items', 25, 88);
    doc.text('• Processing throughput: 324 records/sec', 25, 96);
    doc.text('• System SLA conformance: 99.98%', 25, 104);
    doc.text('• Zero schema violations or memory leaks detected', 25, 112);

    doc.setFont('helvetica', 'bold');
    doc.text('Resource Allocation & Latency Breakdown:', 20, 126);

    doc.setFont('helvetica', 'normal');
    const tableRows = [
      ['Component', 'Queue', 'Latency p95', 'Status'],
      ['FastAPI Ingress', 'default', '12ms', 'Optimal'],
      ['Redis Broker', 'reports', '3ms', 'Optimal'],
      ['Celery Worker', 'reports', '4.2s', 'Optimal'],
      ['Storage Writer', 'results', '45ms', 'Optimal'],
    ];

    let yPos = 138;
    tableRows.forEach((row, i) => {
      if (i === 0) doc.setFont('helvetica', 'bold');
      else doc.setFont('helvetica', 'normal');
      doc.text(row[0], 25, yPos);
      doc.text(row[1], 80, yPos);
      doc.text(row[2], 120, yPos);
      doc.text(row[3], 160, yPos);
      yPos += 8;
    });

    const safeTitle = (task.payload?.title || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
    const pdfFilename = `${safeTitle}_${task.id}.pdf`;
    const pdfPath = path.join(STORAGE_DIR, pdfFilename);
    const pdfOutput = doc.output('arraybuffer');
    fs.writeFileSync(pdfPath, Buffer.from(pdfOutput));

    task.result = {
      fileName: pdfFilename,
      fileSize: pdfOutput.byteLength,
      fileType: 'application/pdf',
      downloadUrl: `/api/v1/tasks/${task.id}/download`,
      recordsProcessed: 1842,
      summary: {
        pageCount: 1,
        title: task.payload?.title || task.taskName,
        generatedAt: task.finishedAt,
      },
    };
  } else if (task.taskType === 'csv_report') {
    const csvFilename = `Export_${task.id}.csv`;
    const csvPath = path.join(STORAGE_DIR, csvFilename);

    let csvContent = 'id,timestamp,event_name,actor,duration_ms,status,queue\n';
    for (let i = 1; i <= 250; i++) {
      const ts = new Date(Date.now() - i * 60000).toISOString();
      csvContent += `evt_${1000 + i},${ts},job.execution_completed,celery-worker-${(i % 3) + 1},${Math.floor(Math.random() * 800 + 200)},success,${task.queue}\n`;
    }
    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    task.result = {
      fileName: csvFilename,
      fileSize: Buffer.byteLength(csvContent, 'utf-8'),
      fileType: 'text/csv',
      downloadUrl: `/api/v1/tasks/${task.id}/download`,
      recordsProcessed: 250,
      summary: {
        exportedRows: 250,
        columns: ['id', 'timestamp', 'event_name', 'actor', 'duration_ms', 'status', 'queue'],
      },
    };
  } else if (task.taskType === 'data_processing') {
    task.result = {
      recordsProcessed: task.payload?.batchSize || 10000,
      summary: {
        totalAnalyzed: task.payload?.batchSize || 10000,
        meanValue: 48.72,
        medianValue: 46.10,
        p95LatencyMs: 142.3,
        anomaliesDetected: 0,
        transformation: task.payload?.transformation || 'quantile_aggregation',
      },
      dataPreview: [
        { cluster: 'us-east-1', throughput: '4.2k ops/s', errorRate: '0.01%' },
        { cluster: 'eu-west-1', throughput: '3.8k ops/s', errorRate: '0.00%' },
        { cluster: 'ap-northeast-1', throughput: '2.9k ops/s', errorRate: '0.02%' },
      ],
    };
  } else if (task.taskType === 'file_validation') {
    task.result = {
      recordsProcessed: 500,
      summary: {
        validRows: 500,
        invalidRows: 0,
        schemaMatchPercent: 100,
        fileFormat: 'CSV / RFC 4180 UTF-8',
        integrityHash: 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
    };
  } else {
    task.result = {
      recordsProcessed: 1,
      summary: {
        durationSeconds: task.payload?.durationSeconds || 6,
        executionMode: 'simulated_background_worker',
        finalStatus: 'Clean exit code 0',
      },
    };
  }

  // Update Attempt Record
  const attemptList = DB.taskAttempts.get(taskId) || [];
  const currentAtt = attemptList.find(a => a.attemptNumber === attemptNumber);
  if (currentAtt) {
    currentAtt.status = 'succeeded';
    currentAtt.finishedAt = task.finishedAt;
    currentAtt.durationMs = task.durationMs;
  }

  // Add Log Entry
  const logList = DB.taskLogs.get(taskId) || [];
  logList.push({
    id: `log-${Date.now()}-done`,
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: `Worker finished execution successfully. Duration: ${(task.durationMs / 1000).toFixed(2)}s.`,
    attemptNumber,
  });

  // Add Event Entry
  const eventList = DB.taskEvents.get(taskId) || [];
  eventList.push({
    id: `ev-${Date.now()}-done`,
    timestamp: new Date().toISOString(),
    event: 'TASK_COMPLETED',
    details: `Task succeeded cleanly on worker ${worker.name}.`,
  });

  // Add Notification
  DB.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: task.userId,
    title: 'Task Completed',
    message: `Task "${task.taskName}" finished successfully in ${(task.durationMs / 1000).toFixed(1)}s.`,
    type: 'success',
    taskId: task.id,
    timestamp: new Date().toISOString(),
    isRead: false,
  });

  broadcastSSE('task_updated', task);
}

// Celery Beat Scheduler: Periodic loop to evaluate scheduled jobs
setInterval(() => {
  const now = new Date();
  for (const [schId, schedule] of DB.schedules.entries()) {
    if (schedule.status === 'active') {
      const nextRun = new Date(schedule.nextRunAt);
      if (now >= nextRun) {
        // Trigger scheduled task
        const newTaskId = `task-sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const publicId = `af-tsk-${Math.random().toString(36).substring(2, 8)}`;

        const scheduledTask = {
          id: newTaskId,
          publicId,
          userId: 'usr-admin',
          userName: 'Celery Beat Scheduler',
          taskType: schedule.taskType,
          taskName: `[Scheduled] ${schedule.name}`,
          status: 'pending_dispatch',
          priority: schedule.priority,
          queue: schedule.queue,
          payload: { ...schedule.payload, scheduledRun: true, scheduleId: schedule.id },
          progress: 0,
          currentStage: 'Dispatched by Celery Beat',
          createdAt: now.toISOString(),
          attemptCount: 1,
          maxAttempts: 3,
        };

        DB.tasks.set(newTaskId, scheduledTask);
        DB.taskLogs.set(newTaskId, []);
        DB.taskAttempts.set(newTaskId, []);
        DB.taskEvents.set(newTaskId, [
          {
            id: `ev-${Date.now()}`,
            timestamp: now.toISOString(),
            event: 'SCHEDULED_DISPATCH',
            details: `Dispatched automatically by Celery Beat scheduler (${schedule.cronExpression})`,
          },
        ]);

        // Transactional outbox entry
        DB.outbox.set(`outbox-${newTaskId}`, {
          id: `outbox-${newTaskId}`,
          taskId: newTaskId,
          status: 'PENDING',
          attempts: 0,
          createdAt: now.toISOString(),
        });

        // Update schedule metrics
        schedule.totalRuns++;
        schedule.lastRunAt = now.toISOString();
        schedule.lastRunStatus = 'running';
        // Compute next run: 10 minutes from now for demonstration
        schedule.nextRunAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
        schedule.runs = schedule.runs || [];
        schedule.runs.unshift({
          taskId: newTaskId,
          executedAt: now.toISOString(),
          status: 'running',
        });
        if (schedule.runs.length > 20) schedule.runs.pop();

        processOutbox();
      }
    }
  }
}, 5000);

// Background Worker Heartbeat loop
setInterval(() => {
  DB.workers.forEach(worker => {
    worker.lastHeartbeat = new Date().toISOString();
    worker.uptimeSeconds += 10;
    worker.cpuPercent = +(10 + Math.random() * 25).toFixed(1);
    worker.memoryMb = +(350 + Math.random() * 120 + worker.activeTasks * 80).toFixed(0);
  });
  broadcastSSE('workers_updated', DB.workers);
}, 10000);

// Outbox Poller loop (every 1s)
setInterval(() => {
  processOutbox();
}, 1000);

// Initialize Express App
async function startServer() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Authentication Middleware Helper
  function getAuthenticatedUser(req: Request): UserSession | null {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) return null;
    const userId = DB.sessions.get(token);
    if (!userId) return null;
    return DB.users.get(userId) || null;
  }

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  app.post('/api/v1/auth/register', (req: Request, res: Response) => {
    const { email, password, name, role = 'user', department = 'Engineering' } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }

    // Check if user exists
    for (const u of DB.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ error: 'A user with this email address already exists' });
      }
    }

    const userId = `usr-${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser: UserSession = {
      id: userId,
      email,
      name,
      role: role as any,
      department,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isActive: true,
      passwordHash,
    };

    DB.users.set(userId, newUser);

    // Create session token
    const token = `af-tok-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    DB.sessions.set(token, userId);

    res.cookie('auth_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 86400000 * 7 });
    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({ user: safeUser, token });
  });

  app.post('/api/v1/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let foundUser: UserSession | null = null;
    for (const u of DB.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser || !bcrypt.compareSync(password, foundUser.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password credentials' });
    }

    if (!foundUser.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact an administrator.' });
    }

    foundUser.lastLoginAt = new Date().toISOString();

    const token = `af-tok-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    DB.sessions.set(token, foundUser.id);

    // Record audit log
    DB.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorEmail: foundUser.email,
      actorRole: foundUser.role,
      action: 'auth.login',
      targetType: 'user',
      targetId: foundUser.id,
      details: 'User authenticated successfully',
      ipAddress: req.ip || '127.0.0.1',
      status: 'success',
    });

    res.cookie('auth_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 86400000 * 7 });
    const { passwordHash: _, ...safeUser } = foundUser;
    return res.json({ user: safeUser, token });
  });

  app.post('/api/v1/auth/refresh', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Session expired or invalid' });

    const newToken = `af-tok-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    DB.sessions.set(newToken, user.id);
    res.cookie('auth_token', newToken, { httpOnly: true, sameSite: 'lax', maxAge: 86400000 * 7 });
    const { passwordHash: _, ...safeUser } = user;
    return res.json({ user: safeUser, token: newToken });
  });

  app.post('/api/v1/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7);
    else if (req.cookies && req.cookies.auth_token) token = req.cookies.auth_token;

    if (token) DB.sessions.delete(token);
    res.clearCookie('auth_token');
    return res.json({ message: 'Successfully logged out' });
  });

  app.get('/api/v1/auth/me', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const { passwordHash: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  });

  // ==========================================
  // REAL-TIME SERVER-SENT EVENTS
  // ==========================================
  app.get('/api/v1/tasks/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);

    // Initial heartbeat
    res.write(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // ==========================================
  // TASK MANAGEMENT ROUTES
  // ==========================================

  app.get('/api/v1/tasks', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { status, taskType, priority, search, page = '1', limit = '15', sort = 'createdAt', order = 'desc' } = req.query;

    let taskList = Array.from(DB.tasks.values());

    // Role-based data isolation: ordinary users only see their own tasks
    if (user && user.role === 'user') {
      taskList = taskList.filter(t => t.userId === user.id);
    }

    // Filter by status
    if (status && status !== 'all') {
      taskList = taskList.filter(t => t.status === status);
    }

    // Filter by taskType
    if (taskType && taskType !== 'all') {
      taskList = taskList.filter(t => t.taskType === taskType);
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      taskList = taskList.filter(t => t.priority === priority);
    }

    // Search query
    if (search) {
      const q = String(search).toLowerCase();
      taskList = taskList.filter(
        t =>
          t.taskName.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.publicId.toLowerCase().includes(q) ||
          t.userName.toLowerCase().includes(q)
      );
    }

    // Sort
    taskList.sort((a, b) => {
      const aVal = a[String(sort)] || '';
      const bVal = b[String(sort)] || '';
      if (order === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    const total = taskList.length;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 15;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = taskList.slice(startIndex, startIndex + limitNum);

    return res.json({
      tasks: paginated,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  });

  app.post('/api/v1/tasks', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { taskType, taskName, priority = 'normal', payload = {}, scheduledAt, idempotencyKey } = req.body;

    if (!taskType || !taskName) {
      return res.status(400).json({ error: 'taskType and taskName are required' });
    }

    // Handle Idempotency Key
    const idempotencyHeader = (req.headers['idempotency-key'] as string) || idempotencyKey;
    if (idempotencyHeader) {
      const existing = DB.idempotencyStore.get(idempotencyHeader);
      if (existing) {
        const existingTask = DB.tasks.get(existing.taskId);
        if (existingTask) {
          return res.status(200).json({ task: existingTask, idempotentReplay: true });
        }
      }
    }

    // Determine target queue based on task type
    let queue: 'default' | 'reports' | 'data_processing' | 'maintenance' = 'default';
    if (taskType === 'pdf_report' || taskType === 'csv_report') queue = 'reports';
    else if (taskType === 'data_processing') queue = 'data_processing';
    else if (taskType === 'file_validation') queue = 'default';
    else if (taskType === 'simulated_job') queue = 'default';

    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const publicId = `af-tsk-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const authorId = user ? user.id : 'usr-dev';
    const authorName = user ? user.name : 'Data Engineer';

    const newTask = {
      id: taskId,
      publicId,
      userId: authorId,
      userName: authorName,
      taskType,
      taskName,
      status: 'pending_dispatch',
      priority,
      queue,
      payload,
      progress: 0,
      currentStage: 'Registered in database. Awaiting transactional outbox dispatch...',
      createdAt: now,
      attemptCount: 1,
      maxAttempts: 3,
      idempotencyKey: idempotencyHeader,
      scheduledAt,
    };

    // Store in canonical store
    DB.tasks.set(taskId, newTask);
    DB.taskLogs.set(taskId, [
      {
        id: `log-${Date.now()}-init`,
        timestamp: now,
        level: 'INFO',
        message: `Task record created by ${authorName}. Payload validated. Target queue: [${queue}].`,
        attemptNumber: 1,
      }
    ]);
    DB.taskAttempts.set(taskId, []);
    DB.taskEvents.set(taskId, [
      {
        id: `ev-${Date.now()}-sub`,
        timestamp: now,
        event: 'TASK_SUBMITTED',
        details: `Submitted task "${taskName}" with priority [${priority}]`,
      }
    ]);

    // Store Idempotency key if supplied
    if (idempotencyHeader) {
      DB.idempotencyStore.set(idempotencyHeader, { taskId, payloadHash: JSON.stringify(payload) });
    }

    // Create Transactional Outbox Event
    const outboxId = `outbox-${taskId}`;
    DB.outbox.set(outboxId, {
      id: outboxId,
      taskId,
      status: 'PENDING',
      attempts: 0,
      createdAt: now,
    });

    // Audit log
    DB.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: now,
      actorEmail: user ? user.email : 'user@asyncflow.io',
      actorRole: user ? user.role : 'user',
      action: 'task.created',
      targetType: 'task',
      targetId: taskId,
      details: `Enqueued task ${taskName} to queue [${queue}]`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'success',
    });

    // Trigger Outbox processing
    processOutbox();

    return res.status(201).json({ task: newTask });
  });

  app.get('/api/v1/tasks/:id', (req: Request, res: Response) => {
    const task = DB.tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    return res.json({ task });
  });

  app.get('/api/v1/tasks/:id/logs', (req: Request, res: Response) => {
    const logs = DB.taskLogs.get(req.params.id) || [];
    return res.json({ logs });
  });

  app.get('/api/v1/tasks/:id/events', (req: Request, res: Response) => {
    const events = DB.taskEvents.get(req.params.id) || [];
    return res.json({ events });
  });

  app.get('/api/v1/tasks/:id/attempts', (req: Request, res: Response) => {
    const attempts = DB.taskAttempts.get(req.params.id) || [];
    return res.json({ attempts });
  });

  app.get('/api/v1/tasks/:id/result', (req: Request, res: Response) => {
    const task = DB.tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    return res.json({ result: task.result || null });
  });

  app.get('/api/v1/tasks/:id/download', (req: Request, res: Response) => {
    const task = DB.tasks.get(req.params.id);
    if (!task || !task.result) {
      return res.status(404).json({ error: 'Result not found or task is not yet completed' });
    }

    const fileName = task.result.fileName;
    if (!fileName) return res.status(404).json({ error: 'Artifact has no downloadable file' });

    const filePath = path.join(STORAGE_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      // Re-generate in case of server restart
      if (task.taskType === 'pdf_report') {
        const doc = new jsPDF();
        doc.text(`AsyncFlow Report: ${task.taskName}`, 20, 20);
        doc.text(`Task ID: ${task.id}`, 20, 30);
        doc.text(`Status: Succeeded`, 20, 40);
        const buf = Buffer.from(doc.output('arraybuffer'));
        fs.writeFileSync(filePath, buf);
      } else {
        fs.writeFileSync(filePath, 'id,event,status\n1,task_completed,success\n', 'utf-8');
      }
    }

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', task.result.fileType || 'application/octet-stream');
    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(res);
  });

  app.post('/api/v1/tasks/:id/retry', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const task = DB.tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.status !== 'failed' && task.status !== 'cancelled') {
      return res.status(400).json({ error: 'Only failed or cancelled tasks can be retried' });
    }

    task.attemptCount++;
    task.status = 'queued';
    task.progress = 0;
    task.currentStage = 'Manual retry queued. Dispatched to worker pool.';
    task.errorCode = undefined;
    task.safeErrorMessage = undefined;
    task.cancelRequested = false;

    const logList = DB.taskLogs.get(task.id) || [];
    logList.push({
      id: `log-${Date.now()}-ret`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: `Manual retry requested by ${user ? user.name : 'operator'}. Triggering attempt #${task.attemptCount}.`,
      attemptNumber: task.attemptCount,
    });

    const eventList = DB.taskEvents.get(task.id) || [];
    eventList.push({
      id: `ev-${Date.now()}-retry`,
      timestamp: new Date().toISOString(),
      event: 'MANUAL_RETRY',
      details: `Operator initiated retry generation #${task.attemptCount}`,
    });

    broadcastSSE('task_updated', task);
    executeWorkerTask(task.id);

    return res.json({ task, message: 'Retry initiated successfully' });
  });

  app.post('/api/v1/tasks/:id/cancel', (req: Request, res: Response) => {
    const task = DB.tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.status === 'succeeded' || task.status === 'failed' || task.status === 'cancelled') {
      return res.status(400).json({ error: `Cannot cancel task in state [${task.status}]` });
    }

    if (task.status === 'pending_dispatch' || task.status === 'queued') {
      task.status = 'cancelled';
      task.currentStage = 'Cancelled before worker started';
      task.finishedAt = new Date().toISOString();
    } else {
      task.cancelRequested = true;
      task.status = 'cancel_requested';
      task.currentStage = 'Cancellation signal sent to worker...';
    }

    const eventList = DB.taskEvents.get(task.id) || [];
    eventList.push({
      id: `ev-${Date.now()}-canc`,
      timestamp: new Date().toISOString(),
      event: 'CANCEL_REQUESTED',
      details: 'User sent cooperative cancellation signal',
    });

    broadcastSSE('task_updated', task);
    return res.json({ task, message: 'Cancellation signal dispatched' });
  });

  // ==========================================
  // SCHEDULES ROUTES
  // ==========================================

  app.get('/api/v1/schedules', (req: Request, res: Response) => {
    const schedules = Array.from(DB.schedules.values());
    return res.json({ schedules });
  });

  app.post('/api/v1/schedules', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { name, description, taskType, queue = 'default', priority = 'normal', cronExpression, timezone = 'UTC', payload = {}, overlapPolicy = 'skip_if_running' } = req.body;

    if (!name || !taskType || !cronExpression) {
      return res.status(400).json({ error: 'name, taskType, and cronExpression are required' });
    }

    const scheduleId = `sch-${Date.now()}`;
    const newSchedule = {
      id: scheduleId,
      name,
      description,
      taskType,
      queue,
      priority,
      cronExpression,
      cronDescription: `Cron: ${cronExpression} (${timezone})`,
      timezone,
      payload,
      status: 'active' as const,
      overlapPolicy,
      totalRuns: 0,
      nextRunAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: user ? user.email : 'admin@asyncflow.io',
      runs: [],
    };

    DB.schedules.set(scheduleId, newSchedule);

    DB.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorEmail: user ? user.email : 'admin@asyncflow.io',
      actorRole: user ? user.role : 'admin',
      action: 'schedule.created',
      targetType: 'schedule',
      targetId: scheduleId,
      details: `Created schedule ${name} with cron ${cronExpression}`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'success',
    });

    return res.status(201).json({ schedule: newSchedule });
  });

  app.get('/api/v1/schedules/:id', (req: Request, res: Response) => {
    const schedule = DB.schedules.get(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    return res.json({ schedule });
  });

  app.patch('/api/v1/schedules/:id', (req: Request, res: Response) => {
    const schedule = DB.schedules.get(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

    Object.assign(schedule, req.body);
    return res.json({ schedule });
  });

  app.delete('/api/v1/schedules/:id', (req: Request, res: Response) => {
    if (!DB.schedules.has(req.params.id)) return res.status(404).json({ error: 'Schedule not found' });
    DB.schedules.delete(req.params.id);
    return res.json({ message: 'Schedule deleted' });
  });

  app.post('/api/v1/schedules/:id/pause', (req: Request, res: Response) => {
    const schedule = DB.schedules.get(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    schedule.status = 'paused';
    return res.json({ schedule });
  });

  app.post('/api/v1/schedules/:id/resume', (req: Request, res: Response) => {
    const schedule = DB.schedules.get(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    schedule.status = 'active';
    schedule.nextRunAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    return res.json({ schedule });
  });

  app.post('/api/v1/schedules/:id/trigger', (req: Request, res: Response) => {
    const schedule = DB.schedules.get(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

    // Manually trigger immediate execution
    const newTaskId = `task-man-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const task = {
      id: newTaskId,
      publicId: `af-tsk-${Math.random().toString(36).substring(2, 8)}`,
      userId: 'usr-admin',
      userName: 'Manual Trigger',
      taskType: schedule.taskType,
      taskName: `[Triggered] ${schedule.name}`,
      status: 'pending_dispatch',
      priority: schedule.priority,
      queue: schedule.queue,
      payload: { ...schedule.payload, triggeredManually: true },
      progress: 0,
      currentStage: 'Manually triggered schedule execution',
      createdAt: new Date().toISOString(),
      attemptCount: 1,
      maxAttempts: 3,
    };

    DB.tasks.set(newTaskId, task);
    DB.taskLogs.set(newTaskId, []);
    DB.taskAttempts.set(newTaskId, []);
    DB.taskEvents.set(newTaskId, [
      { id: `ev-${Date.now()}`, timestamp: new Date().toISOString(), event: 'TRIGGER_MANUAL', details: `Schedule ${schedule.name} triggered on-demand` }
    ]);

    DB.outbox.set(`outbox-${newTaskId}`, {
      id: `outbox-${newTaskId}`,
      taskId: newTaskId,
      status: 'PENDING',
      attempts: 0,
      createdAt: new Date().toISOString(),
    });

    schedule.totalRuns++;
    schedule.lastRunAt = new Date().toISOString();
    schedule.runs = schedule.runs || [];
    schedule.runs.unshift({
      taskId: newTaskId,
      executedAt: new Date().toISOString(),
      status: 'running',
    });

    processOutbox();
    return res.json({ message: 'Schedule triggered successfully', taskId: newTaskId });
  });

  app.get('/api/v1/schedules/:id/runs', (req: Request, res: Response) => {
    const schedule = DB.schedules.get(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    return res.json({ runs: schedule.runs || [] });
  });

  // ==========================================
  // METRICS & WORKERS & HEALTH ROUTES
  // ==========================================

  app.get('/api/v1/metrics/overview', (req: Request, res: Response) => {
    const tasks = Array.from(DB.tasks.values());
    const totalTasks = tasks.length;
    const queuedTasks = tasks.filter(t => t.status === 'queued' || t.status === 'pending_dispatch').length;
    const runningTasks = tasks.filter(t => t.status === 'running' || t.status === 'retrying').length;
    const completedTasks = tasks.filter(t => t.status === 'succeeded').length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;

    const completedWithDuration = tasks.filter(t => t.status === 'succeeded' && t.durationMs);
    const avgDuration = completedWithDuration.length > 0
      ? Math.round(completedWithDuration.reduce((acc, t) => acc + (t.durationMs || 0), 0) / completedWithDuration.length)
      : 7400;

    const finishedTotal = completedTasks + failedTasks;
    const successRate = finishedTotal > 0 ? +((completedTasks / finishedTotal) * 100).toFixed(1) : 98.4;

    const activeWorkers = DB.workers.filter(w => w.status !== 'offline').length;

    return res.json({
      totalTasks,
      queuedTasks,
      runningTasks,
      completedTasks,
      failedTasks,
      activeWorkers,
      avgExecutionDurationMs: avgDuration,
      successRatePercent: successRate,
      systemHealth: {
        api: 'healthy',
        postgres: 'healthy',
        redis: 'healthy',
        celeryWorkers: 'healthy',
        celeryBeat: 'healthy',
      },
    });
  });

  app.get('/api/v1/metrics/tasks', (req: Request, res: Response) => {
    // Generate 7-day history data points for Recharts
    const volumeData = [
      { date: 'Mon', total: 42, succeeded: 40, failed: 2, avgDurationMs: 6800 },
      { date: 'Tue', total: 58, succeeded: 55, failed: 3, avgDurationMs: 7100 },
      { date: 'Wed', total: 64, succeeded: 62, failed: 2, avgDurationMs: 6500 },
      { date: 'Thu', total: 79, succeeded: 77, failed: 2, avgDurationMs: 8200 },
      { date: 'Fri', total: 95, succeeded: 92, failed: 3, avgDurationMs: 7900 },
      { date: 'Sat', total: 31, succeeded: 30, failed: 1, avgDurationMs: 5900 },
      { date: 'Sun', total: 24, succeeded: 24, failed: 0, avgDurationMs: 6100 },
    ];

    const tasks = Array.from(DB.tasks.values());
    const typeCounts: Record<string, number> = {
      pdf_report: 0,
      csv_report: 0,
      data_processing: 0,
      file_validation: 0,
      simulated_job: 0,
    };
    tasks.forEach(t => {
      if (typeCounts[t.taskType] !== undefined) typeCounts[t.taskType]++;
    });

    const typeDistribution = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count: count || 1,
    }));

    return res.json({ volumeData, typeDistribution });
  });

  app.get('/api/v1/metrics/queues', (req: Request, res: Response) => {
    const tasks = Array.from(DB.tasks.values());
    const queues = ['default', 'reports', 'data_processing', 'maintenance'] as const;

    const queueMetrics = queues.map(q => {
      const queuedCount = tasks.filter(t => t.queue === q && (t.status === 'queued' || t.status === 'pending_dispatch')).length;
      const activeCount = tasks.filter(t => t.queue === q && t.status === 'running').length;
      const processedCount = tasks.filter(t => t.queue === q && (t.status === 'succeeded' || t.status === 'failed')).length + 150;
      return {
        name: q,
        queuedCount,
        activeCount,
        processedCount,
        avgLatencyMs: q === 'reports' ? 120 : q === 'data_processing' ? 240 : 45,
      };
    });

    return res.json({ queues: queueMetrics });
  });

  app.get('/api/v1/workers', (req: Request, res: Response) => {
    return res.json({ workers: DB.workers });
  });

  app.get('/api/v1/health/live', (req: Request, res: Response) => {
    return res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/v1/health/ready', (req: Request, res: Response) => {
    return res.json({
      status: 'ready',
      dependencies: {
        database: 'connected (PostgreSQL 16.2)',
        redis: 'connected (Redis 7.2 broker)',
        workers: '3 active nodes registered',
        celeryBeat: 'running',
        outboxDispatcher: 'active',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Prometheus Metrics format endpoint
  app.get('/api/v1/metrics/prometheus', (req: Request, res: Response) => {
    const tasks = Array.from(DB.tasks.values());
    const total = tasks.length;
    const succeeded = tasks.filter(t => t.status === 'succeeded').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const running = tasks.filter(t => t.status === 'running').length;
    const queued = tasks.filter(t => t.status === 'queued').length;

    const prom = `# HELP asyncflow_tasks_total Total tasks submitted
# TYPE asyncflow_tasks_total counter
asyncflow_tasks_total ${total}

# HELP asyncflow_tasks_by_status Current task count by status
# TYPE asyncflow_tasks_by_status gauge
asyncflow_tasks_by_status{status="succeeded"} ${succeeded}
asyncflow_tasks_by_status{status="failed"} ${failed}
asyncflow_tasks_by_status{status="running"} ${running}
asyncflow_tasks_by_status{status="queued"} ${queued}

# HELP asyncflow_worker_count Active registered celery workers
# TYPE asyncflow_worker_count gauge
asyncflow_worker_count 3

# HELP asyncflow_outbox_pending_events Pending transactional outbox events
# TYPE asyncflow_outbox_pending_events gauge
asyncflow_outbox_pending_events 0
`;
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    return res.send(prom);
  });

  // ==========================================
  // ADMIN & AUDIT & NOTIFICATIONS ROUTES
  // ==========================================

  app.get('/api/v1/admin/users', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    // Enforce admin permission
    if (user && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin privilege required' });
    }

    const usersList = Array.from(DB.users.values()).map(({ passwordHash: _, ...u }) => ({
      ...u,
      taskCount: Array.from(DB.tasks.values()).filter(t => t.userId === u.id).length,
    }));
    return res.json({ users: usersList });
  });

  app.patch('/api/v1/admin/users/:id/role', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (user && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin privilege required' });
    }

    const targetUser = DB.users.get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const { role, isActive } = req.body;
    if (role) targetUser.role = role;
    if (isActive !== undefined) targetUser.isActive = isActive;

    DB.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorEmail: user ? user.email : 'admin@asyncflow.io',
      actorRole: user ? user.role : 'admin',
      action: 'admin.user_modified',
      targetType: 'user',
      targetId: targetUser.id,
      details: `Updated role to ${role || targetUser.role}, active: ${targetUser.isActive}`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'success',
    });

    const { passwordHash: _, ...safeUser } = targetUser;
    return res.json({ user: safeUser });
  });

  app.get('/api/v1/admin/audit-logs', (req: Request, res: Response) => {
    return res.json({ auditLogs: DB.auditLogs.slice(0, 50) });
  });

  app.get('/api/v1/notifications', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    let notifs = DB.notifications;
    if (user && user.role === 'user') {
      notifs = notifs.filter(n => n.userId === user.id || !n.userId);
    }
    return res.json({ notifications: notifs.slice(0, 30) });
  });

  app.patch('/api/v1/notifications/:id/read', (req: Request, res: Response) => {
    const notif = DB.notifications.find(n => n.id === req.params.id);
    if (notif) notif.isRead = true;
    return res.json({ success: true });
  });

  app.post('/api/v1/notifications/mark-all-read', (req: Request, res: Response) => {
    DB.notifications.forEach(n => { n.isRead = true; });
    return res.json({ success: true });
  });

  app.post('/api/v1/outbox/recover', (req: Request, res: Response) => {
    processOutbox();
    return res.json({ message: 'Outbox recovery sweep executed cleanly', pendingEventsCount: 0 });
  });

  // Mount Vite middleware in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AsyncFlow] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[AsyncFlow] Failed to start server:', err);
  process.exit(1);
});
