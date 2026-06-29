import json

from ai.metric_catalog import DATA_CAVEATS
from ai.metric_catalog import get_metric_context


def build_copilot_context(user_message, tool_result):
    payload = {
        "user_question": user_message,
        "analytics_source": tool_result.get("source"),
        "analytics_result": tool_result.get("data") or {},
        "direct_answer": tool_result.get("answer"),
        "metric_definitions": get_metric_context(),
        "caveats": DATA_CAVEATS,
        "instructions": [
            "Use only analytics_result and direct_answer.",
            "Do not create new numbers.",
            "Explain business meaning, likely drivers, risks, and recommended action.",
            "If direct_answer already contains the key facts, enrich it without changing the numbers.",
            "If the user asks why, focus on causes and what to investigate next.",
            "Answer in Indonesian.",
        ],
    }

    return json.dumps(payload, default=str, ensure_ascii=False, indent=2)
