"""Send alert notifications to Slack or generic webhook URLs."""
import json
import logging
import urllib.request
import urllib.error
from app.core.config import settings
from app.models.alert import Alert

logger = logging.getLogger(__name__)


def _post(url: str, payload: dict) -> None:
    body = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            logger.info("Webhook delivered: status=%d", resp.status)
    except urllib.error.URLError as e:
        logger.warning("Webhook delivery failed: %s", e)


def notify_alert(alert: Alert, hostname: str = "unknown") -> None:
    """Fire-and-forget notification. Safe to call even if no webhook configured."""
    url = settings.slack_webhook_url
    if not url:
        return
    payload = {
        "text": (
            f":rotating_light: *[{alert.severity.upper()}]* {alert.title}\n"
            f"Device: `{hostname}` | Status: {alert.status}\n"
            f"{alert.description or ''}"
        )
    }
    try:
        _post(url, payload)
    except Exception:
        logger.exception("Unexpected error in notify_alert")
