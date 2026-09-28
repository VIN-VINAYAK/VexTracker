from __future__ import annotations

from datetime import date

from app.services.notifications import evaluate_reminder_plan


class NotificationEngine:
    def __init__(self, config: dict | None = None):
        self.config = config or {}

    def generate_for_child(self, due_date: date, as_of: date | None = None) -> dict[str, object]:
        return evaluate_reminder_plan(due_date, as_of)
