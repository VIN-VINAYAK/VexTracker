import json
import re
from pathlib import Path
from typing import Any

import requests
from fastapi import HTTPException, status

from app.core.config import GROQ_API_KEY

KNOWLEDGE_PATH = Path(__file__).resolve().parent.parent / "data" / "verified_knowledge.json"

SAFETY_PATTERNS = [
    "diagnosis",
    "diagnose",
    "treat",
    "treatment",
    "prescribe",
    "medication",
    "doctor",
    "medical advice",
    "side effects",
]


def _load_knowledge() -> list[dict[str, Any]]:
    if not KNOWLEDGE_PATH.exists():
        return []
    with KNOWLEDGE_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return data.get("items", [])
    return []


def classify_question(question: str) -> str:
    q = question.strip().lower()
    if any(word in q for word in ["vaccine", "vaccination", "immunization", "dose", "schedule", "due date", "booster"]):
        return "vaccine"
    return "general"


def retrieve_context(question: str, limit: int = 3) -> list[dict[str, Any]]:
    knowledge = _load_knowledge()
    q = question.lower()
    scored: list[tuple[float, dict[str, Any]]] = []

    for item in knowledge:
        text = " ".join(str(v).lower() for v in item.values())
        score = 0.0
        for token in re.findall(r"[a-z0-9]+", q):
            if token in text:
                score += 1.0
        if score > 0:
            scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:limit]]


def is_out_of_scope(question: str) -> bool:
    lowered = question.lower()
    if any(keyword in lowered for keyword in ["diagnose", "diagnosis", "prescribe", "treatment", "side effect", "medication"]):
        return True
    return False


def _call_groq(prompt: str) -> str:
    if not GROQ_API_KEY:
        return "I don't have verified information on that."

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": "Answer only from the provided verified context. If the question is outside the scope, refuse and say: I don't have verified information on that."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
            },
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        return payload["choices"][0]["message"]["content"].strip()
    except Exception:
        return "I don't have verified information on that."


def ask_assistant(question: str) -> dict[str, Any]:
    if not question or not question.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question is required")

    if is_out_of_scope(question):
        return {
            "answer": "I don't have verified information on that.",
            "source_snippet": "Safety filter: diagnosis/treatment claims are out of scope.",
            "category": "out_of_scope",
        }

    context = retrieve_context(question)
    if not context:
        return {
            "answer": "I don't have verified information on that.",
            "source_snippet": "No verified local context matched the question.",
            "category": "no_context",
        }

    context_text = "\n\n".join(
        f"Source: {item.get('source', 'local_knowledge')}\n{item.get('content', str(item))}"
        for item in context
    )
    prompt = (
        "Use only the following verified context to answer the user's question. "
        "Do not add any clinical claims beyond the given source material. "
        "If the answer is not supported by the context, say: I don't have verified information on that.\n\n"
        f"Context:\n{context_text}\n\nQuestion: {question}"
    )

    answer = _call_groq(prompt)
    source_snippet = context[0].get("content", str(context[0]))
    return {
        "answer": answer,
        "source_snippet": source_snippet,
        "category": classify_question(question),
    }
