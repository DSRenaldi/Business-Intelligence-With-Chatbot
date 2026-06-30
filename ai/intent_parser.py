import re

from ai.semantic_analytics import MONTHS
from ai.semantic_analytics import _date_range


def _detect_dimension(message):
    normalized = message.lower()

    if any(term in normalized for term in ["produk", "product", "barang"]):
        return "product"
    if any(term in normalized for term in ["customer", "pelanggan", "client"]):
        return "customer"
    if any(term in normalized for term in ["negara", "country", "market"]):
        return "country"

    return None


def _detect_metric(message):
    normalized = message.lower()

    if any(term in normalized for term in ["quantity", "jumlah", "unit", "volume"]):
        return "quantity"

    return "revenue"


def _detect_ranks(message):
    normalized = message.lower()
    ranks = []

    if any(term in normalized for term in ["tertinggi", "terbesar", "top", "paling besar", "paling tinggi"]):
        ranks.append("top")
    if any(term in normalized for term in ["menengah", "sedang", "median", "middle", "biasa saja", "rata-rata", "average", "normal"]):
        ranks.append("middle")
    if any(term in normalized for term in ["terkecil", "terendah", "paling kecil", "paling rendah", "bottom"]):
        ranks.append("bottom")

    return ranks


def _detect_month_period(message):
    normalized = message.lower()
    year_match = re.search(r"\b(20\d{2})\b", normalized)
    year = int(year_match.group(1)) if year_match else 2011
    assumed_year = year_match is None

    for month_name, month in MONTHS.items():
        if month_name in normalized:
            start, end = _date_range(year, month, month)
            return {
                "label": f"{month_name.title()} {year}",
                "start": start,
                "end": end,
                "assumed_year": assumed_year,
            }

    return None


def parse_structured_intent(message):
    dimension = _detect_dimension(message)
    ranks = _detect_ranks(message)
    period = _detect_month_period(message)

    if dimension and ranks and period:
        return {
            "intent": "rank_distribution_by_period",
            "dimension": dimension,
            "metric": _detect_metric(message),
            "ranks": ranks,
            "period": period,
        }

    return None


def normalize_llm_plan(plan):
    if not plan or plan.get("needs_clarification"):
        return None

    if plan.get("intent") != "rank_distribution_by_period":
        return None

    dimension = plan.get("dimension")
    ranks = plan.get("ranks") or []
    period = plan.get("period") or {}
    month = period.get("month")

    if dimension not in {"product", "customer", "country"}:
        return None

    if not ranks or not month:
        return None

    year = int(period.get("year") or 2011)
    start, end = _date_range(year, int(month), int(month))

    metric = plan.get("metric")
    if metric == "orders":
        metric = "quantity"
    elif metric not in {"revenue", "quantity"}:
        metric = "revenue"

    return {
        "intent": "rank_distribution_by_period",
        "dimension": dimension,
        "metric": metric,
        "ranks": [rank for rank in ranks if rank in {"top", "middle", "bottom"}],
        "period": {
            "label": f"{year}-{int(month):02d}",
            "start": start,
            "end": end,
            "assumed_year": period.get("year") is None,
        },
    }
