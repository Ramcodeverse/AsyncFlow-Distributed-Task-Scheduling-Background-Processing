// AsyncFlow Common Types & Domain Entities

export type UserRole = 'admin' | 'operator' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export type TaskStatus =
  | 'pending_dispatch'
  | 'queued'
  | 'running'
  | 'retrying'
  | 'succeeded'
  | 'failed'
  | 'cancel_requested'
  | 'cancelled';

export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

export type TaskType =
  | 'pdf_report'
  | 'csv_report'
  | 'data_processing'
  | 'file_validation'
  | 'simulated_job'
  | 'python_script';

export type QueueName = 'default' | 'reports' | 'data_processing' | 'maintenance';

export interface TaskLogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  attemptNumber: number;
}

export interface TaskAttempt {
  attemptNumber: number;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: 'running' | 'succeeded' | 'failed' | 'cancelled';
  errorCode?: string;
  errorMessage?: string;
  workerName: string;
}

export interface TaskEvent {
  id: string;
  timestamp: string;
  event: string;
  details: string;
  actor?: string;
}

export interface TaskResult {
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  downloadUrl?: string;
  recordsProcessed?: number;
  summary?: Record<string, any>;
  dataPreview?: any[];
}

export interface Task {
  id: string;
  publicId: string;
  userId: string;
  userName: string;
  taskType: TaskType;
  taskName: string;
  status: TaskStatus;
  priority: TaskPriority;
  queue: QueueName;
  payload: Record<string, any>;
  progress: number;
  currentStage: string;
  createdAt: string;
  queuedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  attemptCount: number;
  maxAttempts: number;
  celeryTaskId?: string;
  idempotencyKey?: string;
  assignedWorker?: string;
  result?: TaskResult;
  errorCode?: string;
  safeErrorMessage?: string;
  cancelRequested?: boolean;
  scheduledAt?: string;
  etaSeconds?: number;
}

export interface Schedule {
  id: string;
  name: string;
  description?: string;
  taskType: TaskType;
  queue: QueueName;
  priority: TaskPriority;
  cronExpression: string;
  cronDescription: string;
  timezone: string;
  payload: Record<string, any>;
  status: 'active' | 'paused';
  overlapPolicy: 'allow' | 'skip_if_running';
  totalRuns: number;
  lastRunAt?: string;
  lastRunStatus?: TaskStatus;
  nextRunAt: string;
  createdAt: string;
  createdBy: string;
  runs?: {
    taskId: string;
    executedAt: string;
    status: TaskStatus;
  }[];
}

export interface WorkerInfo {
  name: string;
  status: 'healthy' | 'busy' | 'degraded' | 'offline';
  queues: QueueName[];
  concurrency: number;
  activeTasks: number;
  reservedTasks: number;
  totalCompleted: number;
  totalFailed: number;
  lastHeartbeat: string;
  uptimeSeconds: number;
  cpuPercent?: number;
  memoryMb?: number;
  lastError?: string;
}

export interface QueueMetrics {
  name: QueueName;
  queuedCount: number;
  activeCount: number;
  processedCount: number;
  avgLatencyMs: number;
}

export interface SystemMetrics {
  totalTasks: number;
  queuedTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  activeWorkers: number;
  avgExecutionDurationMs: number;
  successRatePercent: number;
  systemHealth: {
    api: 'healthy' | 'degraded' | 'unavailable';
    postgres: 'healthy' | 'degraded' | 'unavailable';
    redis: 'healthy' | 'degraded' | 'unavailable';
    celeryWorkers: 'healthy' | 'degraded' | 'unavailable';
    celeryBeat: 'healthy' | 'degraded' | 'unavailable';
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress: string;
  status: 'success' | 'failure';
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  taskId?: string;
  timestamp: string;
  isRead: boolean;
}
