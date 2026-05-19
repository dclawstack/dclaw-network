"""
LLM Root-Cause Analysis service.
Called when an Alert is created. Fetches recent metrics for the device,
builds a structured prompt, and calls Ollama (fallback: OpenRouter).
The result is stored in Alert.description.
"""
import json
import logging
import urllib.request
import urllib.error
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.utils import utc_now

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a senior network operations engineer. "
    "Analyse the provided network telemetry and explain the root cause of the alert "
    "in 2-3 concise sentences. Then suggest one specific remediation step. "
    "Be direct and technical. Do not repeat the metric values verbatim."
)


def _call_ollama(prompt: str) -> str | None:
    url = f"{settings.ollama_url}/api/generate"
    payload = json.dumps({
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            return data.get("response", "").strip()
    except Exception as e:
        logger.debug("Ollama unavailable: %s", e)
        return None


def _call_openrouter(prompt: str) -> str | None:
    if not settings.openrouter_api_key:
        return None
    url = "https://openrouter.ai/api/v1/chat/completions"
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
    req = urllib.request.Request(url, data=payload, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.debug("OpenRouter unavailable: %s", e)
        return None


async def generate_rca(
    db: AsyncSession,
    device_id,
    alert_title: str,
    alert_severity: str,
) -> str | None:
    """Return an AI-generated root-cause explanation, or None if LLM unavailable."""
    from sqlalchemy import select
    from app.models.metric import MetricSample

    cutoff = utc_now() - timedelta(minutes=30)
    result = await db.execute(
        select(MetricSample)
        .where(MetricSample.device_id == device_id, MetricSample.sampled_at >= cutoff)
        .order_by(MetricSample.sampled_at.desc())
        .limit(50)
    )
    samples = result.scalars().all()

    if not samples:
        metric_summary = "No recent telemetry available."
    else:
        lines = [
            f"  {s.metric_type.value}: {s.value:.2f} @ {s.sampled_at.isoformat()}"
            for s in samples[:20]
        ]
        metric_summary = "\n".join(lines)

    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Alert: [{alert_severity.upper()}] {alert_title}\n\n"
        f"Recent metrics (last 30 min):\n{metric_summary}\n\n"
        "Root cause and remediation:"
    )

    result_text = _call_ollama(prompt) or _call_openrouter(prompt)
    if result_text:
        logger.info("RCA generated for device=%s alert=%s", device_id, alert_title)
    return result_text
