import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum,
    Index,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="user")  # admin, operator, user
    department = Column(String(255), default="Engineering")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=lambda: f"tsk-{uuid.uuid4().hex[:12]}")
    public_id = Column(String(50), unique=True, nullable=False, index=True, default=lambda: f"af-tsk-{uuid.uuid4().hex[:6]}")
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_name = Column(String(255), nullable=False)
    task_type = Column(String(50), nullable=False, index=True)
    task_name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="pending_dispatch", index=True)
    priority = Column(String(20), nullable=False, default="normal", index=True)
    queue = Column(String(50), nullable=False, default="default", index=True)
    payload = Column(JSONB, nullable=False, default=dict)
    progress = Column(Integer, default=0)
    current_stage = Column(String(255), default="Initialized")
    created_at = Column(DateTime(timezone=True), default=utcnow, index=True)
    queued_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    attempt_count = Column(Integer, default=1)
    max_attempts = Column(Integer, default=3)
    celery_task_id = Column(String(255), nullable=True, index=True)
    idempotency_key = Column(String(255), nullable=True, unique=True, index=True)
    assigned_worker = Column(String(255), nullable=True)
    result = Column(JSONB, nullable=True)
    error_code = Column(String(100), nullable=True)
    safe_error_message = Column(Text, nullable=True)
    cancel_requested = Column(Boolean, default=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="tasks")
    attempts = relationship("TaskAttempt", back_populates="task", cascade="all, delete-orphan")
    logs = relationship("TaskLog", back_populates="task", cascade="all, delete-orphan")
    events = relationship("TaskEvent", back_populates="task", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_tasks_status_queue", "status", "queue"),
        Index("ix_tasks_user_created", "user_id", "created_at"),
    )

class TaskAttempt(Base):
    __tablename__ = "task_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number = Column(Integer, nullable=False)
    started_at = Column(DateTime(timezone=True), default=utcnow)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    status = Column(String(50), nullable=False)  # running, succeeded, failed, cancelled
    error_code = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    worker_name = Column(String(255), nullable=False)

    task = relationship("Task", back_populates="attempts")

class TaskLog(Base):
    __tablename__ = "task_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)
    level = Column(String(20), nullable=False)  # INFO, DEBUG, WARN, ERROR
    message = Column(Text, nullable=False)
    attempt_number = Column(Integer, default=1)

    task = relationship("Task", back_populates="logs")

class TaskEvent(Base):
    __tablename__ = "task_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow)
    event = Column(String(100), nullable=False)
    details = Column(Text, nullable=False)

    task = relationship("Task", back_populates="events")

class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String(36), nullable=False, index=True)
    status = Column(String(50), default="PENDING", index=True)  # PENDING, DISPATCHED, FAILED
    attempts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow, index=True)
    dispatched_at = Column(DateTime(timezone=True), nullable=True)
    error = Column(Text, nullable=True)

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(String(36), primary_key=True, default=lambda: f"sch-{uuid.uuid4().hex[:8]}")
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(String(50), nullable=False)
    queue = Column(String(50), nullable=False, default="default")
    priority = Column(String(20), nullable=False, default="normal")
    cron_expression = Column(String(100), nullable=False)
    cron_description = Column(String(255), nullable=False)
    timezone = Column(String(100), default="UTC")
    payload = Column(JSONB, nullable=False, default=dict)
    status = Column(String(50), default="active", index=True)  # active, paused
    overlap_policy = Column(String(50), default="skip_if_running")
    total_runs = Column(Integer, default=0)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    last_run_status = Column(String(50), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    created_by = Column(String(255), nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)
    actor_email = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False, index=True)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(255), nullable=False)
    details = Column(Text, nullable=False)
    ip_address = Column(String(45), nullable=False)
    status = Column(String(20), default="success")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")
    task_id = Column(String(36), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)
    is_read = Column(Boolean, default=False)
