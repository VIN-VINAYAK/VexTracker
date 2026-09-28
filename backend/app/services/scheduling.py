from __future__ import annotations

from datetime import date
from typing import Literal

AgeUnit = Literal["years", "months", "days"]
Status = Literal["Completed", "Upcoming", "Overdue"]
Priority = Literal["Normal", "High", "Critical"]


def calculateAge(date_of_birth: date, as_of: date | None = None) -> int:
    """Return the number of full years between a date of birth and a reference date."""
    if as_of is None:
        as_of = date.today()
    if date_of_birth > as_of:
        raise ValueError("Date of birth cannot be in the future.")

    age = as_of.year - date_of_birth.year
    if (as_of.month, as_of.day) < (date_of_birth.month, date_of_birth.day):
        age -= 1
    return age


def calculateDueDate(date_of_birth: date, months_after_birth: int) -> date:
    """Return the due date after a fixed number of months from birth."""
    if months_after_birth < 0:
        raise ValueError("months_after_birth must be non-negative.")
    if date_of_birth > date.today():
        raise ValueError("Date of birth cannot be in the future.")

    total_months = date_of_birth.month - 1 + months_after_birth
    year = date_of_birth.year + (total_months // 12)
    month = (total_months % 12) + 1
    day = min(date_of_birth.day, 28)
    return date(year, month, day)


def getVaccineStatus(due_date: date, administered_date: date | None = None, as_of: date | None = None) -> Status:
    """Determine the schedule status for a vaccine using deterministic rules."""
    if as_of is None:
        as_of = date.today()

    if administered_date is not None:
        if administered_date > as_of:
            raise ValueError("Administered date cannot be in the future.")
        return "Completed"

    if due_date < as_of:
        return "Overdue"
    return "Upcoming"


def calculatePriority(status: Status, due_date: date | None = None, as_of: date | None = None) -> Priority:
    """Determine priority as Normal, High, or Critical based on due-date urgency."""
    if status == "Completed":
        return "Normal"
    if status == "Overdue":
        return "Critical"
    if status == "Upcoming":
        if due_date is None:
            raise ValueError("due_date is required for upcoming items.")
        if as_of is None:
            as_of = date.today()
        delta_days = (due_date - as_of).days
        if delta_days <= 7:
            return "High"
        return "Normal"
    raise ValueError(f"Unsupported status: {status}")
