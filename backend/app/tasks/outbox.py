import time
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.models import OutboxEvent, Task
from app.tasks.celery_app import celery_app

logger = logging.getLogger("asyncflow.outbox")

def dispatch_task_to_celery(task: Task):
    """
    Routes a task record to its designated Celery queue and task signature.
    """
    task_type_map = {
        "pdf_report": "app.tasks.workers.generate_pdf_report",
        "csv_report": "app.tasks.workers.generate_csv_report",
        "data_processing": "app.tasks.workers.process_dataset",
        "file_validation": "app.tasks.workers.run_simulated_workload",
        "simulated_job": "app.tasks.workers.run_simulated_workload",
    }
    task_func = task_type_map.get(task.task_type, "app.tasks.workers.run_simulated_workload")

    async_res = celery_app.send_task(
        task_func,
        args=[task.id, task.payload],
        queue=task.queue,
        priority={"critical": 9, "high": 7, "normal": 5, "low": 2}.get(task.priority, 5),
    )
    return async_res.id

def process_pending_outbox_events(db: Session) -> int:
    """
    Transactional Outbox poller:
    Reads PENDING outbox entries, publishes to Celery, marks as DISPATCHED.
    """
    pending = (
        db.query(OutboxEvent)
        .filter(OutboxEvent.status == "PENDING")
        .order_by(OutboxEvent.created_at.asc())
        .limit(50)
        .all()
    )

    dispatched_count = 0
    now = datetime.now(timezone.utc)

    for event in pending:
        task = db.query(Task).filter(Task.id == event.task_id).first()
        if not task:
            event.status = "FAILED"
            event.error = "Associated task record not found"
            continue

        try:
            celery_id = dispatch_task_to_celery(task)
            event.status = "DISPATCHED"
            event.dispatched_at = now
            task.status = "queued"
            task.queued_at = now
            task.celery_task_id = celery_id
            dispatched_count += 1
        except Exception as exc:
            event.attempts += 1
            event.error = str(exc)
            logger.error(f"Failed to dispatch outbox event {event.id}: {exc}")

    db.commit()
    return dispatched_count
