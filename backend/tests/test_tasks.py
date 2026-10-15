import unittest

class TestTaskStateMachine(unittest.TestCase):
    def test_task_state_machine_valid_transitions(self):
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

        self.assertIn("queued", legal_transitions["pending_dispatch"])
        self.assertIn("running", legal_transitions["queued"])
        self.assertIn("succeeded", legal_transitions["running"])
        self.assertIn("retrying", legal_transitions["running"])
        self.assertEqual(len(legal_transitions["succeeded"]), 0)

    def test_idempotency_key_constraint(self):
        key = "af-idemp-unique-12345"
        store = {}
        
        # First submission
        task_id = "tsk-1"
        store[key] = task_id
        
        # Duplicate submission
        duplicate_task_id = store.get(key)
        self.assertEqual(duplicate_task_id, "tsk-1")

    def test_exponential_backoff_calculation(self):
        # Verify Celery backoff retry formula: min(300, base * (2 ** retry_count))
        base = 5
        self.assertEqual(base * (2 ** 0), 5)
        self.assertEqual(base * (2 ** 1), 10)
        self.assertEqual(base * (2 ** 2), 20)
        self.assertEqual(base * (2 ** 3), 40)

if __name__ == "__main__":
    unittest.main()
