import { Task, Schedule, WorkerInfo, SystemMetrics, AuditLog, NotificationItem, User } from '../types';

const API_BASE = '/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('asyncflow_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('asyncflow_token', token);
    } else {
      localStorage.removeItem('asyncflow_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      // Auto clear invalid token
      this.setToken(null);
    }

    if (!res.ok) {
      let errorMessage = 'An unexpected error occurred';
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // use fallback
      }
      throw new Error(errorMessage);
    }

    // Check if response is empty
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    }
    return res.text() as unknown as T;
  }

  // Auth Endpoints
  async register(data: { email: string; password: string; name: string; role?: string; department?: string }) {
    const res = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    return res;
  }

  async login(email: string, password: string) {
    const res = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  // Task Endpoints
  async getTasks(params?: {
    status?: string;
    taskType?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.taskType) query.set('taskType', params.taskType);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return this.request<{
      tasks: Task[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/tasks${qs ? `?${qs}` : ''}`);
  }

  async getTask(id: string): Promise<{ task: Task }> {
    return this.request<{ task: Task }>(`/tasks/${id}`);
  }

  async createTask(data: {
    taskType: string;
    taskName: string;
    priority?: string;
    payload?: Record<string, any>;
    idempotencyKey?: string;
  }): Promise<{ task: Task; idempotentReplay?: boolean }> {
    return this.request<{ task: Task; idempotentReplay?: boolean }>('/tasks', {
      method: 'POST',
      headers: data.idempotencyKey ? { 'Idempotency-Key': data.idempotencyKey } : {},
      body: JSON.stringify(data),
    });
  }

  async retryTask(id: string): Promise<{ task: Task; message: string }> {
    return this.request<{ task: Task; message: string }>(`/tasks/${id}/retry`, {
      method: 'POST',
    });
  }

  async cancelTask(id: string): Promise<{ task: Task; message: string }> {
    return this.request<{ task: Task; message: string }>(`/tasks/${id}/cancel`, {
      method: 'POST',
    });
  }

  async getTaskLogs(id: string) {
    return this.request<{ logs: any[] }>(`/tasks/${id}/logs`);
  }

  async getTaskEvents(id: string) {
    return this.request<{ events: any[] }>(`/tasks/${id}/events`);
  }

  async getTaskAttempts(id: string) {
    return this.request<{ attempts: any[] }>(`/tasks/${id}/attempts`);
  }

  getDownloadUrl(id: string): string {
    return `${API_BASE}/tasks/${id}/download`;
  }

  // Schedules Endpoints
  async getSchedules(): Promise<{ schedules: Schedule[] }> {
    return this.request<{ schedules: Schedule[] }>('/schedules');
  }

  async getSchedule(id: string): Promise<{ schedule: Schedule }> {
    return this.request<{ schedule: Schedule }>(`/schedules/${id}`);
  }

  async createSchedule(data: Partial<Schedule>): Promise<{ schedule: Schedule }> {
    return this.request<{ schedule: Schedule }>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSchedule(id: string, data: Partial<Schedule>): Promise<{ schedule: Schedule }> {
    return this.request<{ schedule: Schedule }>(`/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSchedule(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/schedules/${id}`, {
      method: 'DELETE',
    });
  }

  async pauseSchedule(id: string): Promise<{ schedule: Schedule }> {
    return this.request<{ schedule: Schedule }>(`/schedules/${id}/pause`, {
      method: 'POST',
    });
  }

  async resumeSchedule(id: string): Promise<{ schedule: Schedule }> {
    return this.request<{ schedule: Schedule }>(`/schedules/${id}/resume`, {
      method: 'POST',
    });
  }

  async triggerSchedule(id: string): Promise<{ message: string; taskId: string }> {
    return this.request<{ message: string; taskId: string }>(`/schedules/${id}/trigger`, {
      method: 'POST',
    });
  }

  async getScheduleRuns(id: string): Promise<{ runs: any[] }> {
    return this.request<{ runs: any[] }>(`/schedules/${id}/runs`);
  }

  // Metrics & Workers Endpoints
  async getOverviewMetrics(): Promise<SystemMetrics> {
    return this.request<SystemMetrics>('/metrics/overview');
  }

  async getTaskMetrics(): Promise<{ volumeData: any[]; typeDistribution: any[] }> {
    return this.request<{ volumeData: any[]; typeDistribution: any[] }>('/metrics/tasks');
  }

  async getQueueMetrics(): Promise<{ queues: any[] }> {
    return this.request<{ queues: any[] }>('/metrics/queues');
  }

  async getWorkers(): Promise<{ workers: WorkerInfo[] }> {
    return this.request<{ workers: WorkerInfo[] }>('/workers');
  }

  async getPrometheusMetrics(): Promise<string> {
    const res = await fetch(`${API_BASE}/metrics/prometheus`);
    return res.text();
  }

  // Admin & Activity & Notifications
  async getAdminUsers(): Promise<{ users: (User & { taskCount: number })[] }> {
    return this.request<{ users: (User & { taskCount: number })[] }>('/admin/users');
  }

  async updateUserRole(userId: string, role: string, isActive?: boolean): Promise<{ user: User }> {
    return this.request<{ user: User }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, isActive }),
    });
  }

  async getAuditLogs(): Promise<{ auditLogs: AuditLog[] }> {
    return this.request<{ auditLogs: AuditLog[] }>('/admin/audit-logs');
  }

  async getNotifications(): Promise<{ notifications: NotificationItem[] }> {
    return this.request<{ notifications: NotificationItem[] }>('/notifications');
  }

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  async triggerOutboxRecovery(): Promise<{ message: string; pendingEventsCount: number }> {
    return this.request<{ message: string; pendingEventsCount: number }>('/outbox/recover', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
