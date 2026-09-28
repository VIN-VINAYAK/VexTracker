from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta


@dataclass
class ReminderConfig:
    days_before_due: int = 7
    days_before_due_urgent: int = 2
    due_day_window: int = 0
    overdue_after_days: int = 1


def build_reminder_status(due_date: date, as_of: date | None = None) -> str:
    if as_of is None:
        as_of = date.today()

    delta = (due_date - as_of).days
    if delta < 0:
        return "overdue"
    if delta == 0:
        return "due"
    if delta <= 2:
        return "2d"
    if delta <= 7:
        return "7d"
    return "upcoming"


def get_reminder_window(due_date: date, as_of: date | None = None) -> tuple[str, str]:
    status = build_reminder_status(due_date, as_of)
    if status == "overdue":
        return "overdue", "Send overdue reminder"
    if status == "due":
        return "due", "Send due-date reminder"
    if status == "2d":
        return "2d", "Send 2-day reminder"
    if status == "7d":
        return "7d", "Send 7-day reminder"
    return "upcoming", "No reminder needed"


def send_email_stub(email: str, subject: str, body: str) -> dict[str, str]:
    return {
        "to": email,
        "subject": subject,
        "body": body,
        "status": "queued",
    }


def evaluate_reminder_plan(due_date: date, as_of: date | None = None) -> dict[str, str | bool]:
    config = ReminderConfig()
    reminder_type, message = get_reminder_window(due_date, as_of)
    send_date = as_of or date.today()
    is_due = reminder_type in {"due", "2d", "7d", "overdue"}
    return {
        "reminder_type": reminder_type,
        "message": message,
        "scheduled": is_due,
        "email_stub": send_email_stub(
            "parent@example.com",
            f"Vaccination reminder: {reminder_type}",
            f"Vaccination reminder for {due_date.isoformat()} ({reminder_type}).",
        ),
        "config": {
            "days_before_due": config.days_before_due,
            "days_before_due_urgent": config.days_before_due_urgent,
            "due_day_window": config.due_day_window,
            "overdue_after_days": config.overdue_after_days,
        },
        "send_date": send_date.isoformat(),
    }
