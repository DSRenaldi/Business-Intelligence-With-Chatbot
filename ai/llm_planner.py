import json
import re


PLANNER_CONTEXT = """
You are a BI intent planner for Nexus BI.
Return only valid JSON. Do not answer the user.

Allowed intents:
- rank_distribution_by_period
- top_contributor
- period_summary
- period_comparison
- root_cause
- concentration_risk
- clarification
- out_of_scope

Allowed dimensions: product, customer, country
Allowed metrics: revenue, quantity, orders
Allowed ranks: top, middle, bottom

Return schema:
{
  "intent": "...",
  "dimension": "product|customer|country|null",
  "metric": "revenue|quantity|orders",
  "period": {"month": 1-12|null, "quarter": 1-4|null, "year": 2010|2011|null},
  "ranks": ["top"|"middle"|"bottom"],
  "needs_clarification": false,
  "clarification_question": null
}

Rules:
- If the question asks about products, use dimension product.
- If it asks about middle/average/ordinary performance, include rank middle.
- If it asks smallest/lowest/worst, include rank bottom.
- If it asks highest/best/largest, include rank top.
- If a month is mentioned without year, use year 2011 and needs_clarification false.
- If the question is unrelated to business dashboard data, use out_of_scope.
""".strip()


PLANNER_FEW_SHOTS = """
Example:
Question: pada bulan februari, produk apa yg penjualannya menengah dan penjualannya paling kecil?
JSON: {"intent":"rank_distribution_by_period","dimension":"product","metric":"revenue","period":{"month":2,"quarter":null,"year":2011},"ranks":["middle","bottom"],"needs_clarification":false,"clarification_question":null}

Example:
Question: di februari, barang mana yang performanya biasa saja dan paling rendah?
JSON: {"intent":"rank_distribution_by_period","dimension":"product","metric":"revenue","period":{"month":2,"quarter":null,"year":2011},"ranks":["middle","bottom"],"needs_clarification":false,"clarification_question":null}

Example:
Question: kenapa revenue Q3 2011 lebih baik dari Q2 2011?
JSON: {"intent":"root_cause","dimension":"country","metric":"revenue","period":{"month":null,"quarter":3,"year":2011},"comparison_period":{"month":null,"quarter":2,"year":2011},"ranks":[],"needs_clarification":false,"clarification_question":null}

Example:
Question: siapa presiden indonesia?
JSON: {"intent":"out_of_scope","dimension":null,"metric":"revenue","period":{"month":null,"quarter":null,"year":null},"ranks":[],"needs_clarification":false,"clarification_question":null}
""".strip()


def build_planner_prompt(message, history=None):
    history_text = "\n".join(
        f"{item.get('role')}: {item.get('content')}"
        for item in (history or [])[-4:]
        if item.get("content")
    )

    return (
        f"{PLANNER_CONTEXT}\n\n"
        f"{PLANNER_FEW_SHOTS}\n\n"
        f"Conversation history:\n{history_text or 'None'}\n\n"
        f"User question:\n{message}\n\n"
        "JSON:"
    )


def parse_planner_output(output):
    if not output:
        return None

    match = re.search(r"\{.*\}", output, re.DOTALL)
    raw_json = match.group(0) if match else output

    try:
        plan = json.loads(raw_json)
    except json.JSONDecodeError:
        return None

    if not isinstance(plan, dict) or "intent" not in plan:
        return None

    return plan
