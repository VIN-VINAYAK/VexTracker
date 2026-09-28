from datetime import date

import pytest

from app.services.scheduling import (
    calculateAge,
    calculateDueDate,
    calculatePriority,
    getVaccineStatus,
)


@pytest.mark.parametrize(
    "dob, as_of, expected",
    [
        (date(2020, 5, 10), date(2025, 5, 9), 4),
        (date(2020, 5, 10), date(2025, 5, 10), 5),
    ],
)
def test_calculate_age_valid_dob(dob, as_of, expected):
    assert calculateAge(dob, as_of) == expected


def test_calculate_age_future_dob_raises():
    with pytest.raises(ValueError):
        calculateAge(date(2030, 1, 1), date(2025, 1, 1))


def test_calculate_due_date_for_months_after_birth():
    assert calculateDueDate(date(2024, 1, 15), 6) == date(2024, 7, 15)


def test_get_vaccine_status_existing_dose_is_completed():
    assert getVaccineStatus(date(2024, 6, 1), administered_date=date(2024, 5, 20), as_of=date(2024, 6, 15)) == "Completed"


def test_get_vaccine_status_past_due_date_is_overdue():
    assert getVaccineStatus(date(2024, 6, 1), as_of=date(2024, 6, 15)) == "Overdue"


def test_get_vaccine_status_upcoming_date_is_upcoming():
    assert getVaccineStatus(date(2024, 6, 20), as_of=date(2024, 6, 15)) == "Upcoming"


def test_calculate_priority_for_overdue_and_upcoming():
    assert calculatePriority("Overdue", due_date=date(2024, 6, 1), as_of=date(2024, 6, 15)) == "Critical"
    assert calculatePriority("Upcoming", due_date=date(2024, 6, 20), as_of=date(2024, 6, 15)) == "High"
    assert calculatePriority("Upcoming", due_date=date(2024, 6, 30), as_of=date(2024, 6, 15)) == "Normal"
