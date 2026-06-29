import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ai.copilot_orchestrator import run_copilot
from ai.model_loader import get_runtime_info
from database.database import get_db

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


@router.get("/api/assistant/status")
def assistant_status():
    return get_runtime_info()


@router.post("/api/assistant/chat")
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
):
    message = payload.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message is required.",
        )

    try:
        return run_copilot(message, db, history=payload.history)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"AI Assistant is not available: {exc}",
        ) from exc
