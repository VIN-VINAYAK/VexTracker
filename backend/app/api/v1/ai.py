from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.services.rag_assistant import ask_assistant

router = APIRouter(prefix="/ai", tags=["ai"])


class AskRequest(BaseModel):
    question: str


@router.post("/ask")
def ask_question(payload: AskRequest):
    try:
        return ask_assistant(payload.question)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
