"""Small, DB-independent authorization helpers -- kept separate so they can be
unit tested without a live MongoDB connection."""
from __future__ import annotations

from beanie import PydanticObjectId

from app.models import Child


def user_is_guardian(user_id: PydanticObjectId, child: Child) -> bool:
    """Return True if user_id is a registered guardian of this child.

    This is the check that stands in for the foreign-key constraint a
    relational DB would have enforced -- MongoDB has no FKs, so this must be
    checked explicitly before returning or mutating any Child document.
    """
    return user_id in child.guardians
