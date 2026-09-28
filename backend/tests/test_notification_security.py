from datetime import date, datetime, timedelta, timezone

import pytest
from beanie import PydanticObjectId
from jose import jwt

from app.auth.security import (
    JWT_SECRET,
    decode_access_token,
    decode_record_qr_token,
)
from app.models import Child
from app.services.authorization import user_is_guardian
from app.services.notifications import build_reminder_status, evaluate_reminder_plan


def test_notification_reminder_windows():
    assert build_reminder_status(date(2026, 9, 20), date(2026, 9, 13)) == "7d"
    assert build_reminder_status(date(2026, 9, 20), date(2026, 9, 18)) == "2d"
    assert build_reminder_status(date(2026, 9, 20), date(2026, 9, 20)) == "due"
    assert build_reminder_status(date(2026, 9, 20), date(2026, 9, 22)) == "overdue"

    report = evaluate_reminder_plan(date(2026, 9, 20), date(2026, 9, 18))
    assert report["reminder_type"] == "2d"
    assert report["email_stub"]["status"] == "queued"


def test_invalid_and_expired_token_rejected():
    with pytest.raises(ValueError):
        decode_record_qr_token("bad.token.value")

    expired = jwt.encode(
        {"sub": "expired@example.com", "exp": datetime.now(timezone.utc) - timedelta(minutes=5)},
        JWT_SECRET,
        algorithm="HS256",
    )
    with pytest.raises(ValueError):
        decode_access_token(expired)


def test_cross_child_access_is_blocked():
    owner_id = PydanticObjectId()
    other_id = PydanticObjectId()
    child = Child(
        guardians=[owner_id],
        first_name="Test",
        last_name="Child",
        date_of_birth=datetime(2022, 1, 1),
    )

    assert user_is_guardian(owner_id, child) is True
    assert user_is_guardian(other_id, child) is False
