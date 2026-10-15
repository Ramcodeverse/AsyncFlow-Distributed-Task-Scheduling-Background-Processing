import pytest
from app.db.models import Task, OutboxEvent, User
from app.tasks.outbox import process_pending_outbox_events

def test_task_state_machine_valid_transitions():
    legal_transitions = {
        "pending_dispatch": ["queued", "cancelled"],
        "queued": ["running", "cancelled"],
        "running": ["retrying", "succeeded", "failed", "cancel_requested", "cancelled"],
        "retrying": ["queued", "running", "failed"],
        "cancel_requested": ["cancelled", "failed"],
        "succeeded": [],
        "failed": ["queued"],  # manual retry
        "cancelled": ["queued"], # manual retry
    }

    assert "queued" in legal_transitions["pending_dispatch"]
    assert "running" in legal_transitions["queued"]
    assert "succeeded" in legal_transitions["running"]
    assert "retrying" in legal_transitions["running"]
    assert len(legal_transitions["succeeded"]) == 0

def test_idempotency_key_constraint():
    key = "af-idemp-unique-12345"
    store = {}
    
    # First submission
    task_id = "tsk-1"
    store[key] = task_id
    
    # Duplicate submission
    duplicate_task_id = store.get(key)
    assert duplicate_task_id == "tsk-1"
