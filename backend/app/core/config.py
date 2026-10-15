from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "AsyncFlow"
    APP_ENV: str = "production"
    APP_SECRET_KEY: str = "asyncflow-super-secure-production-secret-key-32b"
    DATABASE_URL: str = "postgresql+psycopg://asyncflow:asyncflow_secure_pass@postgres:5432/asyncflow"
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/1"
    
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    STORAGE_BACKEND: str = "local_storage"
    LOCAL_STORAGE_PATH: str = "/storage/results"
    MAX_UPLOAD_SIZE_MB: int = 50
    TASK_DEFAULT_TIMEOUT: int = 300
    TASK_MAX_RETRIES: int = 3
    TASK_RETENTION_DAYS: int = 30
    
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
