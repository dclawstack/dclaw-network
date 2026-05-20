"""
AI Network Copilot endpoint.
POST /api/v1/copilot/chat
Accepts a user message + optional device context, returns an LLM response.
"""
import asyncio
import json
import logging
import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.utils import utc_now
from app.models.metric import MetricSample
from app.models.alert import Alert, AlertStatus

logger = logging.getLogger(__name__)
router = APIRouter()

SYSTEM_PROMPT = """You are an expert network operations engineer and AI copilot for DClaw Network.
You have access to real-time network telemetry. Help the operator diagnose issues, interpret metrics,
and suggest optimisations. Be concise, technical, and actionable.
If asked about a specific device, focus your analysis on its data."""


class ChatRequest(BaseModel):
    message: str = Field(..., max_length=4096)
    device_id: uuid.UUID | None = None


async def _build_context(db: AsyncSession, device_id: uuid.UUID | None) -> str:
    if not device_id:
        return ""
    cutoff = utc_now() - timedelta(hours=1)
    metrics_result = await db.execute(
        select(MetricSample)
        .where(MetricSample.device_id == device_id, MetricSample.sampled_at >= cutoff)
        .order_by(MetricSample.sampled_at.desc())
        .limit(30)
    )
    samples = metrics_result.scalars().all()

    alerts_result = await db.execute(
        select(Alert).where(
            Alert.device_id == device_id,
            Alert.status == AlertStatus.open,
        ).order_by(Alert.created_at.desc()).limit(5)
    )
    open_alerts = alerts_result.scalars().all()

    lines = ["--- Device Context ---"]
    if samples:
        lines.append("Recent metrics (last hour):")
        for s in samples[:15]:
            lines.append(f"  {s.metric_type.value}: {s.value:.2f} @ {s.sampled_at.isoformat()}")
    if open_alerts:
        lines.append("Open alerts:")
        for a in open_alerts:
            lines.append(f"  [{a.severity}] {a.title}")
    lines.append("--- End Context ---")
    return "\n".join(lines)


def _stream_ollama(prompt: str):
    import urllib.request
    url = f"{settings.ollama_url}/api/generate"
    payload = json.dumps({"model": settings.ollama_model, "prompt": prompt, "stream": True}).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            for line in resp:
                if line.strip():
                    try:
                        data = json.loads(line)
                        token = data.get("response", "")
                        if token:
                            yield f"data: {json.dumps({'token': token})}\n\n"
                        if data.get("done"):
                            break
                    except json.JSONDecodeError:
                        pass
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


def _call_openrouter_sync(prompt: str) -> str:
    import urllib.request
    if not settings.openrouter_api_key:
        return "AI services are not configured. Set OLLAMA_URL or OPENROUTER_API_KEY."
    payload = json.dumps({
        "model": settings.openrouter_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    }).encode()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.openrouter_api_key}",
    }
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions", data=payload, headers=headers
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return f"Error contacting AI service: {e}"


@router.post("/chat")
async def copilot_chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    context = await _build_context(db, request.device_id)
    full_prompt = f"{SYSTEM_PROMPT}\n\n{context}\n\nUser: {request.message}\n\nAssistant:"

    def generate():
        for chunk in _stream_ollama(full_prompt):
            yield chunk
        # done sentinel
        yield "data: [DONE]\n\n"

    # Try Ollama first (liveness check is blocking — run in thread); fall back to OpenRouter
    try:
        await asyncio.to_thread(
            lambda: __import__("urllib.request", fromlist=["urlopen"])
            .urlopen(f"{settings.ollama_url}/api/tags", timeout=2)
            .close()
        )
        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception:
        text = await asyncio.to_thread(_call_openrouter_sync, full_prompt)
        return {"response": text}
