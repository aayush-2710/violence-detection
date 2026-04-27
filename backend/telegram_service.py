"""
Telegram alert service.
Sends violence alert with inline False Alarm button.
Handles webhook callback for false alarm replies.
"""
import io
import requests
from datetime import datetime
from typing import Optional


def _base(token: str) -> str:
    return f"https://api.telegram.org/bot{token}"


def get_severity_label(confidence: float) -> str:
    if confidence < 40:
        return "🟢 CLEAR"
    elif confidence < 60:
        return "🟡 SUSPICIOUS"
    elif confidence < 80:
        return "🟠 HIGH RISK"
    else:
        return "🔴 CRITICAL"


def send_violence_alert(
    token: str,
    chat_id: str,
    confidence: float,
    filename: str,
    gif_bytes: Optional[bytes] = None,
) -> tuple[bool, str]:
    """
    Send alert with inline False Alarm button.
    Returns (success, message).
    """
    if not token or not chat_id:
        return False, "Telegram credentials not configured."

    ts = datetime.now().strftime("%d %b %Y, %H:%M")
    severity = get_severity_label(confidence)

    text = (
        f"🚨 *Violence Detected!*\n"
        f"File: `{filename}`\n"
        f"Severity: {severity}\n"
        f"Confidence: `{confidence:.2f}%`\n"
        f"Time: `{ts}`\n\n"
        f"📹 Video analyzed successfully\n"
        f"⚠️ Immediate attention required"
    )

    inline_keyboard = {
        "inline_keyboard": [[
            {"text": "✅ False Alarm", "callback_data": "false_alarm"}
        ]]
    }

    base = _base(token)

    try:
        if gif_bytes:
            resp = requests.post(
                f"{base}/sendAnimation",
                data={
                    "chat_id": chat_id,
                    "caption": text,
                    "parse_mode": "Markdown",
                    "reply_markup": str(inline_keyboard).replace("'", '"'),
                },
                files={"animation": ("alert.gif", io.BytesIO(gif_bytes), "image/gif")},
                timeout=20,
            )
        else:
            import json
            resp = requests.post(
                f"{base}/sendMessage",
                data={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "Markdown",
                    "reply_markup": json.dumps(inline_keyboard),
                },
                timeout=10,
            )

        if resp.status_code == 200:
            return True, "Alert sent."
        return False, f"Telegram error: {resp.json().get('description', 'Unknown')}"

    except requests.exceptions.ConnectionError:
        return False, "Network error."
    except requests.exceptions.Timeout:
        return False, "Request timed out."
    except Exception as e:
        return False, str(e)


def answer_false_alarm_callback(token: str, callback_query_id: str, message_id: int, chat_id: str) -> None:
    """
    Called when user taps False Alarm button on Telegram.
    Answers the callback + sends thank you reply.
    """
    base = _base(token)
    # Answer the callback (removes loading state on button)
    requests.post(f"{base}/answerCallbackQuery", data={
        "callback_query_id": callback_query_id,
        "text": "Thanks for your feedback!",
        "show_alert": False,
    }, timeout=5)

    # Send follow-up message
    requests.post(f"{base}/sendMessage", data={
        "chat_id": chat_id,
        "text": "✅ *False Alarm Recorded*\nThanks for your feedback. It will be used for future retraining of the model.",
        "parse_mode": "Markdown",
    }, timeout=5)