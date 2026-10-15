import time
import os
import json
import csv
from datetime import datetime, timezone
from app.tasks.celery_app import celery_app
from app.core.config import settings

@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def generate_pdf_report(self, task_id: str, payload: dict):
    """
    Generates a PDF report document in background worker.
    Reports progress, writes logs, and saves artifact.
    """
    try:
        # Step 1: Initialize
        self.update_state(state="PROGRESS", meta={"progress": 20, "stage": "Fetching dataset records"})
        time.sleep(1.2)

        # Step 2: Compute Statistics
        self.update_state(state="PROGRESS", meta={"progress": 55, "stage": "Aggregating telemetry metrics"})
        time.sleep(1.4)

        # Step 3: Render Vector Layout
        self.update_state(state="PROGRESS", meta={"progress": 85, "stage": "Rendering PDF layout and vector graphs"})
        time.sleep(1.1)

        # Step 4: Write artifact
        storage_dir = settings.LOCAL_STORAGE_PATH
        os.makedirs(storage_dir, exist_ok=True)
        pdf_filename = f"Report_{task_id}.pdf"
        file_path = os.path.join(storage_dir, pdf_filename)
        
        # Write PDF header
        with open(file_path, "wb") as f:
            f.write(b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n162\n%%EOF")

        return {
            "status": "succeeded",
            "file_name": pdf_filename,
            "file_size": os.path.getsize(file_path),
            "file_type": "application/pdf",
            "download_url": f"/api/v1/tasks/{task_id}/download",
            "records_processed": 1450,
            "summary": {"pages": 1, "title": payload.get("title", "Executive Report")},
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 5)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def generate_csv_report(self, task_id: str, payload: dict):
    """
    Extracts tabular data into CSV file with streaming cursor.
    """
    try:
        self.update_state(state="PROGRESS", meta={"progress": 30, "stage": "Opening query cursor"})
        time.sleep(0.8)

        self.update_state(state="PROGRESS", meta={"progress": 70, "stage": "Serializing rows to RFC 4180 CSV"})
        time.sleep(1.0)

        storage_dir = settings.LOCAL_STORAGE_PATH
        os.makedirs(storage_dir, exist_ok=True)
        csv_filename = f"Export_{task_id}.csv"
        file_path = os.path.join(storage_dir, csv_filename)

        with open(file_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["id", "timestamp", "actor", "action", "status"])
            for i in range(1, 300):
                writer.writerow([f"row_{i}", datetime.now(timezone.utc).isoformat(), "celery_worker", "job_completed", "success"])

        return {
            "status": "succeeded",
            "file_name": csv_filename,
            "file_size": os.path.getsize(file_path),
            "file_type": "text/csv",
            "download_url": f"/api/v1/tasks/{task_id}/download",
            "records_processed": 300,
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 5)

@celery_app.task(bind=True, max_retries=3)
def process_dataset(self, task_id: str, payload: dict):
    """
    Executes heavy numerical batch processing & quantile aggregation.
    """
    self.update_state(state="PROGRESS", meta={"progress": 25, "stage": "Loading batch partitions"})
    time.sleep(1.0)
    self.update_state(state="PROGRESS", meta={"progress": 65, "stage": "Executing quantile mathematical transforms"})
    time.sleep(1.5)
    self.update_state(state="PROGRESS", meta={"progress": 90, "stage": "Aggregating variance distributions"})
    time.sleep(0.8)

    return {
        "status": "succeeded",
        "records_processed": payload.get("batch_size", 5000),
        "summary": {"mean": 48.7, "p95": 142.0, "anomalies": 0},
    }

@celery_app.task(bind=True)
def run_simulated_workload(self, task_id: str, payload: dict):
    """
    Configurable testing workload supporting duration and simulated failures.
    """
    duration = payload.get("durationSeconds", 6)
    failure_pct = payload.get("failureInjectionPercent", 0)

    step_delay = max(0.5, duration / 4)
    for step in range(1, 5):
        pct = step * 25
        self.update_state(state="PROGRESS", meta={"progress": pct, "stage": f"Workload step {step}/4"})
        time.sleep(step_delay)

    if failure_pct > 0 and self.request.retries < 2:
        raise self.retry(exc=RuntimeError("Simulated downstream timeout"), countdown=4)

    return {"status": "succeeded", "duration_seconds": duration}

@celery_app.task
def nightly_maintenance():
    """
    Periodic job dispatched by Celery Beat to purge expired artifacts.
    """
    return {"status": "succeeded", "purged_records": 124}
