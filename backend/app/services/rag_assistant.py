import json
import re
from pathlib import Path
from typing import Any

import requests
from fastapi import HTTPException, status

from app.core.config import GROQ_API_KEY, GROQ_MODEL

KNOWLEDGE_PATH = Path(__file__).resolve().parent.parent / "data" / "verified_knowledge.json"

DIAGNOSIS_PATTERNS = [
    "diagnose me",
    "diagnose my child",
    "prescribe me",
    "prescribe antibiotics",
    "cancer treatment",
    "cure disease",
    "surgery",
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
    if any(word in q for word in ["vaccine", "vaccination", "immunization", "dose", "schedule", "due date", "booster", "shot", "fever", "reaction", "bcg", "dtap", "mmr", "polio", "rotavirus"]):
        return "vaccine"
    return "general"


def retrieve_context(question: str, limit: int = 3) -> list[dict[str, Any]]:
    knowledge = _load_knowledge()
    q = question.lower()
    stopwords = {"what", "is", "a", "the", "does", "do", "of", "and", "or", "in", "to", "for", "with", "can", "should", "my", "child", "baby", "usually", "include"}
    query_tokens = [w for w in re.findall(r"[a-z0-9]+", q) if w not in stopwords]
    if not query_tokens:
        query_tokens = re.findall(r"[a-z0-9]+", q)

    scored: list[tuple[float, dict[str, Any]]] = []

    for item in knowledge:
        text = " ".join(str(v).lower() for v in item.values())
        score = 0.0
        for token in query_tokens:
            if token in text:
                # boost exact word boundary match
                score += 2.0 if re.search(r"\b" + re.escape(token) + r"\b", text) else 1.0
        if score > 0:
            scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored and knowledge:
        # Fallback to general guidance if nothing specifically scored
        return knowledge[:limit]
    return [item for _, item in scored[:limit]]


def is_out_of_scope(question: str) -> bool:
    lowered = question.lower()
    if any(pat in lowered for pat in DIAGNOSIS_PATTERNS):
        return True
    return False


def _call_groq(prompt: str) -> str | None:
    if not GROQ_API_KEY:
        return None

    # Try preferred model first, then fallbacks
    models_to_try = [GROQ_MODEL, "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "openai/gpt-oss-120b"]
    for model in dict.fromkeys(models_to_try):
        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are VexTracker AI Clinical Assistant, an evidence-based pediatric immunization expert. "
                                "Answer the question thoroughly, clearly, and empathetically using the provided verified clinical guidance. "
                                "Be concise, friendly, and structured. Always advise caregivers to contact their pediatrician if they observe acute warning signs."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.2,
                },
                timeout=15,
            )
            if response.status_code == 200:
                payload = response.json()
                content = payload["choices"][0]["message"]["content"].strip()
                if content:
                    return content
        except Exception:
            continue
    return None


def ask_assistant(question: str) -> dict[str, Any]:
    if not question or not question.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question is required")

    if is_out_of_scope(question):
        return {
            "answer": "I don't have verified information on that. I am an immunization educational assistant and cannot diagnose conditions, recommend surgical procedures, or prescribe medications. Please consult your pediatrician.",
            "source_snippet": "Safety filter: individual diagnosis and prescription requests are out of scope.",
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
        f"Source: {item.get('source', 'local_knowledge')}\nTopic: {item.get('topic', '')}\nGuidance: {item.get('content', str(item))}"
        for item in context
    )
    prompt = (
        f"Verified Clinical Guidance:\n{context_text}\n\n"
        f"User Question: {question}\n\n"
        "Provide a clear, helpful response based on the clinical guidance above:"
    )

    answer = _call_groq(prompt)
    if not answer:
        # High quality offline / fallback synthesis from the most relevant verified knowledge
        primary = context[0]
        answer = f"{primary.get('content', '')}\n\n(Source: {primary.get('source', 'WHO/CDC Guidelines')})"

    source_snippet = context[0].get("content", str(context[0]))
    return {
        "answer": answer,
        "source_snippet": f"{context[0].get('source', 'Verified Source')}: {source_snippet[:200]}...",
        "category": classify_question(question),
    }

