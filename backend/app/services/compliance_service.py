"""
Config compliance AI service.
Called fire-and-forget after a NetworkConfig is captured.
Sends config_text to Ollama/OpenRouter with a compliance prompt,
then stores the result in NetworkConfig.compliance_notes.
"""
import asyncio
import json
import logging
import urllib.request
import uuid

from app.core.config import settings

logger = logging.getLogger(__name__)

COMPLIANCE_PROMPT = """You are a network security auditor. Review the following network device
configuration and identify any compliance violations. Check specifically for:
1. Open Telnet (should use SSH only)
2. Weak or default credentials (admin/admin, cisco/cisco, etc.)
3. Missing logging configuration
4. Unused or overly permissive access control lists
5. Unencrypted SNMP v1/v2 communities

Respond with a concise bullet list of violations found, or "No violations detected." if the
config is clean. Be specific — include line numbers or config sections where possible."""


def _call_ollama(config_text: str) -> str | None:
    prompt = f"{COMPLIANCE_PROMPT}\n\nConfig:\n{config_text}\n\nFindings:"
    payload = json.dumps({
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
    }).encode()
    req = urllib.request.Request(
        f"{settings.ollama_url}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            return data.get("response", "").strip() or None
    except Exception as e:
        logger.debug("Ollama unavailable for compliance check: %s", e)
        return None


def _call_openrouter(config_text: str) -> str | None:
    if not settings.openrouter_api_key:
        return None
    prompt = f"{COMPLIANCE_PROMPT}\n\nConfig:\n{config_text}\n\nFindings:"
    payload = json.dumps({
        "model": settings.openrouter_model,
        "messages": [{"role": "user", "content": prompt}],
    }).encode()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.openrouter_api_key}",
    }
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers=headers,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            return data["choices"][0]["message"]["content"].strip() or None
    except Exception as e:
        logger.debug("OpenRouter unavailable for compliance check: %s", e)
        return None


async def run_compliance_check(config_id: uuid.UUID, config_text: str) -> None:
    """
    Fire-and-forget: call LLM and update NetworkConfig.compliance_notes.
    Creates its own DB session so it can outlive the originating request.
    """
    from app.core.database import engine
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select
    from app.models.network_config import NetworkConfig

    result = await asyncio.to_thread(
        lambda: _call_ollama(config_text) or _call_openrouter(config_text)
    )
    if not result:
        logger.debug("No LLM available for compliance check on config=%s", config_id)
        return

    async with AsyncSession(engine, expire_on_commit=False) as session:
        cfg_result = await session.execute(
            select(NetworkConfig).where(NetworkConfig.id == config_id)
        )
        config = cfg_result.scalar_one_or_none()
        if config:
            config.compliance_notes = result
            await session.commit()
            logger.info("Compliance notes stored for config=%s", config_id)
