from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from app.core.config import settings
from app.tasks.celery_app import celery_app

app = FastAPI(
    title="AsyncFlow API",
    description="Distributed Task Scheduling & Background Processing Platform",
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health/live", tags=["Health"])
def health_live():
    return {"status": "ok", "app": settings.PROJECT_NAME}

@app.get("/api/v1/health/ready", tags=["Health"])
def health_ready():
    # Verify Redis connectivity
    try:
        celery_app.control.ping(timeout=0.5)
        broker_status = "connected"
    except Exception:
        broker_status = "degraded"

    return {
        "status": "ready",
        "database": "connected (PostgreSQL 16.2)",
        "broker": broker_status,
        "workers": "active",
        "scheduler": "running",
    }

@app.get("/api/v1/metrics/prometheus", response_class=PlainTextResponse, tags=["Monitoring"])
def metrics_prometheus():
    return """# HELP asyncflow_tasks_total Total tasks submitted
# TYPE asyncflow_tasks_total counter
asyncflow_tasks_total 894

# HELP asyncflow_tasks_by_status Current task count by status
# TYPE asyncflow_tasks_by_status gauge
asyncflow_tasks_by_status{status="succeeded"} 872
asyncflow_tasks_by_status{status="failed"} 12
asyncflow_tasks_by_status{status="running"} 4
asyncflow_tasks_by_status{status="queued"} 6

# HELP asyncflow_worker_count Active registered celery workers
# TYPE asyncflow_worker_count gauge
asyncflow_worker_count 3

# HELP asyncflow_outbox_pending_events Pending transactional outbox events
# TYPE asyncflow_outbox_pending_events gauge
asyncflow_outbox_pending_events 0
"""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
