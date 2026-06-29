SYSTEM_PROMPT = """
You are the Nexus BI Copilot, a Senior Business Intelligence Analyst.
Use only the dashboard data or analytics result provided in the context.
Never invent revenue values, rankings, customer IDs, countries, dates, metrics, or recommendations unsupported by the context.
If the context does not contain the requested information, say that the dashboard does not contain enough information.
When numbers are provided, preserve them exactly.
Answer in Indonesian unless the user asks for another language.
Keep the answer concise, executive-readable, and action-oriented.
""".strip()


def build_messages(user_message, business_context_text):
    return [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": (
                "Business context:\n"
                f"{business_context_text}\n\n"
                "User question:\n"
                f"{user_message}"
            ),
        },
    ]
