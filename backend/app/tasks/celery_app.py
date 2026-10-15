from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "asyncflow",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.workers"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=settings.TASK_DEFAULT_TIMEOUT,
    task_soft_time_limit=settings.TASK_DEFAULT_TIMEOUT - 30,
    worker_concurrency=4,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_routes={
        "app.tasks.workers.generate_pdf_report": {"queue": "reports"},
        "app.tasks.workers.generate_csv_report": {"queue": "reports"},
        "app.tasks.workers.process_dataset": {"queue": "data_processing"},
        "app.tasks.workers.validate_file_schema": {"queue": "default"},
        "app.tasks.workers.run_simulated_workload": {"queue": "default"},
        "app.tasks.workers.nightly_maintenance": {"queue": "maintenance"},
    },
    beat_schedule={
        "nightly-system-maintenance": {
            "task": "app.tasks.workers.nightly_maintenance",
            "schedule": crontab(hour=2, minute=0),
            "options": {"queue": "maintenance"},
        },
        "hourly-telemetry-rollup": {
            "task": "app.tasks.workers.process_dataset",
            "schedule": crontab(minute=0),
            "kwargs": {"batch_size": 2500, "transformation": "quantile_aggregation"},
            "options": {"queue": "data_processing"},
        },
    },
)
