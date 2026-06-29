from ai.business_context import build_business_context
from ai.business_context import context_to_text
from ai.analytics_tools import execute_structured_plan
from ai.chatbot import generate_chat_response
from ai.copilot_context import build_copilot_context
from ai.intent_parser import parse_structured_intent
from ai.model_loader import get_runtime_info
from ai.semantic_analytics import answer_period_analysis


SUGGESTIONS = [
    "Bagaimana kondisi perusahaan pada pertengahan 2011?",
    "Kenapa revenue Q3 2011 lebih baik dari Q2 2011?",
    "Apakah perusahaan terlalu bergantung pada satu negara?",
    "Produk apa yang paling besar kontribusinya di UK pada Q3 2011?",
]


IN_SCOPE_KEYWORDS = [
    "revenue",
    "pendapatan",
    "sales",
    "penjualan",
    "order",
    "orders",
    "invoice",
    "customer",
    "pelanggan",
    "produk",
    "product",
    "barang",
    "country",
    "negara",
    "market",
    "kpi",
    "growth",
    "pertumbuhan",
    "q1",
    "q2",
    "q3",
    "q4",
    "2010",
    "2011",
    "bulan",
    "kuartal",
    "periode",
    "perusahaan",
    "bisnis",
    "dashboard",
    "insight",
    "analisis",
    "summary",
    "ringkasan",
    "kontribusi",
    "kontributor",
    "bergantung",
    "terlemah",
    "terbaik",
    "tertinggi",
    "terbesar",
    "turun",
    "naik",
]

OUT_OF_SCOPE_ANSWER = (
    "Saya hanya bisa membantu pertanyaan yang terkait data Nexus BI, seperti revenue, "
    "orders, produk, customer, country performance, growth, periode penjualan, dan insight bisnis. "
    "Silakan ajukan pertanyaan berdasarkan data dashboard."
)

GREETING_KEYWORDS = [
    "halo",
    "hai",
    "hello",
    "hi",
    "selamat pagi",
    "selamat siang",
    "selamat sore",
    "selamat malam",
]

OUT_OF_SCOPE_KEYWORDS = [
    "presiden",
    "politik",
    "cuaca",
    "weather",
    "film",
    "movie",
    "lagu",
    "musik",
    "resep",
    "masak",
    "olahraga",
    "sepak bola",
    "game",
    "crypto",
    "saham",
    "berita",
    "news",
    "translate",
    "terjemahkan",
    "coding",
    "programming",
]

FOLLOW_UP_KEYWORDS = [
    "kenapa",
    "mengapa",
    "jelaskan",
    "lanjut",
    "detail",
    "bagaimana",
    "apa penyebab",
    "rekomendasi",
    "lalu",
    "bandingkan",
]

GREETING_ANSWER = (
    "Halo, saya AI Assistant untuk Nexus BI. Saya bisa membantu analisis revenue, "
    "produk, customer, country performance, growth, dan insight bisnis dari dashboard."
)

ANALYTICAL_KEYWORDS = [
    "kenapa",
    "mengapa",
    "penyebab",
    "sebab",
    "analisis",
    "analyze",
    "jelaskan",
    "explain",
    "kondisi",
    "sehat",
    "risiko",
    "risk",
    "rekomendasi",
    "strategi",
    "strategy",
    "summary",
    "ringkasan",
    "executive",
    "insight",
    "apa yang harus",
    "bagaimana performa",
    "mengapa bisa",
    "terlemah",
    "terbaik",
    "lebih baik",
    "lebih buruk",
    "bergantung",
    "ketergantungan",
]


def _format_currency(value):
    return f"${float(value or 0):,.0f}"


def _format_number(value):
    return f"{int(value or 0):,}"


def infer_topic(message):
    normalized = message.lower()

    if any(keyword in normalized for keyword in ["produk", "product", "top product", "barang"]):
        return "products"
    if any(keyword in normalized for keyword in ["negara", "country", "region", "market"]):
        return "countries"
    if any(keyword in normalized for keyword in ["customer", "pelanggan", "client"]):
        return "customers"
    if any(keyword in normalized for keyword in ["turun", "drop", "decrease", "decline", "root cause", "why", "kenapa"]):
        return "root_cause"
    if any(keyword in normalized for keyword in ["revenue", "growth", "pendapatan"]):
        return "revenue"

    return "kpi"


def _is_in_scope(message, history=None):
    normalized = message.lower()

    if any(keyword in normalized for keyword in OUT_OF_SCOPE_KEYWORDS):
        return False

    if any(keyword in normalized for keyword in IN_SCOPE_KEYWORDS):
        return True

    # Very short follow-ups such as "kenapa?", "jelaskan lagi", or "bagaimana dengan produk?"
    # are allowed only when there is previous BI context.
    if history and len(normalized.split()) <= 6 and any(keyword in normalized for keyword in FOLLOW_UP_KEYWORDS):
        return True

    return False


def _is_greeting(message):
    normalized = message.lower().strip()
    return any(normalized == keyword or normalized.startswith(f"{keyword} ") for keyword in GREETING_KEYWORDS)


def build_cards(context):
    return {
        "kpi": {
            "total_revenue": context["total_revenue"],
            "total_orders": context["total_orders"],
            "total_customers": context["total_customers"],
            "total_products": context["total_products"],
            "latest_growth": context["latest_growth"],
        },
        "top_product": context["top_products"][0] if context["top_products"] else None,
        "top_country": context["top_countries"][0] if context["top_countries"] else None,
        "top_customer": context["top_customers"][0] if context["top_customers"] else None,
    }


def _dashboard_fast_answer(topic, context):
    if topic == "products" and context["top_products"]:
        product = context["top_products"][0]
        return {
            "answer": (
                f"Produk dengan revenue tertinggi adalah {product['Description']} "
                f"dengan revenue {_format_currency(product['revenue'])}."
            ),
            "source": "dashboard_tool",
            "data": {"top_product": product},
        }

    if topic == "countries" and context["top_countries"]:
        country = context["top_countries"][0]
        return {
            "answer": (
                f"Negara dengan kontribusi revenue terbesar adalah {country['Country']} "
                f"dengan revenue {_format_currency(country['revenue'])}."
            ),
            "source": "dashboard_tool",
            "data": {"top_country": country},
        }

    if topic == "customers" and context["top_customers"]:
        customer = context["top_customers"][0]
        return {
            "answer": (
                f"Customer paling bernilai adalah Customer {customer['CustomerID']} "
                f"({customer['Country']}) dengan revenue {_format_currency(customer['revenue'])} "
                f"dari {_format_number(customer['orders'])} orders."
            ),
            "source": "dashboard_tool",
            "data": {"top_customer": customer},
        }

    if topic == "kpi":
        return {
            "answer": (
                f"KPI utama: revenue {_format_currency(context['total_revenue'])}, "
                f"orders {_format_number(context['total_orders'])}, "
                f"customers {_format_number(context['total_customers'])}, dan "
                f"products {_format_number(context['total_products'])}."
            ),
            "source": "dashboard_tool",
            "data": {"kpi": build_cards(context)["kpi"]},
        }

    return None


def _insight_answer(topic, context):
    if topic not in {"revenue", "root_cause"}:
        return None

    insight = context["insight"]
    answer = (
        f"Revenue growth periode lengkap terakhir adalah {insight.get('revenue_growth')}%. "
        f"Kontributor utama yang perlu dipantau adalah {insight.get('top_country')} dan "
        f"produk {insight.get('top_product')}. Rekomendasi: {insight.get('recommendation')}"
    )

    return {
        "answer": answer,
        "source": "insight_tool",
        "data": {"insight": insight},
    }


def _should_polish(message):
    normalized = message.lower()
    return any(
        keyword in normalized
        for keyword in ["gunakan qwen", "pakai qwen", "jawab dengan model"]
    )


def run_copilot(message, db, history=None):
    topic = infer_topic(message)
    context = build_business_context(db)
    history = history or []

    if _is_greeting(message):
        return {
            "answer": GREETING_ANSWER,
            "topic": "greeting",
            "source": "scope_guard",
            "model": get_runtime_info(),
            "cards": build_cards(context),
            "suggestions": SUGGESTIONS,
        }

    if not _is_in_scope(message, history=history):
        return {
            "answer": OUT_OF_SCOPE_ANSWER,
            "topic": "out_of_scope",
            "source": "scope_guard",
            "model": get_runtime_info(),
            "cards": build_cards(context),
            "suggestions": SUGGESTIONS,
        }

    structured_plan = parse_structured_intent(message)
    tool_result = execute_structured_plan(db, structured_plan) if structured_plan else None

    if not tool_result:
        tool_result = answer_period_analysis(message, db, history=history)

    if tool_result:
        tool_result.setdefault("data", {})
    else:
        tool_result = _dashboard_fast_answer(topic, context) or _insight_answer(topic, context)

    if tool_result and not _should_polish(message):
        answer = tool_result["answer"]
        source = tool_result["source"]
    elif tool_result:
        copilot_context = build_copilot_context(message, tool_result)
        answer = generate_chat_response(message, copilot_context)
        source = f"{tool_result['source']}+qwen_narrator"
    else:
        business_context_text = context_to_text(context, topic=topic)
        answer = generate_chat_response(message, business_context_text)
        source = "qwen_fallback"

    return {
        "answer": answer,
        "topic": topic,
        "source": source,
        "model": get_runtime_info(),
        "cards": build_cards(context),
        "suggestions": SUGGESTIONS,
    }
