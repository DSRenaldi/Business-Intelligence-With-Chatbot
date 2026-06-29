import re
from datetime import datetime
from datetime import timedelta

from sqlalchemy import text


MONTHS = {
    "januari": 1,
    "january": 1,
    "februari": 2,
    "february": 2,
    "maret": 3,
    "march": 3,
    "april": 4,
    "mei": 5,
    "may": 5,
    "juni": 6,
    "june": 6,
    "juli": 7,
    "july": 7,
    "agustus": 8,
    "august": 8,
    "september": 9,
    "oktober": 10,
    "october": 10,
    "november": 11,
    "desember": 12,
    "december": 12,
}


def _format_currency(value):
    return f"${float(value or 0):,.0f}"


def _format_number(value):
    return f"{int(value or 0):,}"


def _date_range(year, start_month, end_month):
    start = datetime(year, start_month, 1)
    if end_month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, end_month + 1, 1)
    return start, end


def parse_period(message):
    normalized = message.lower()
    year_match = re.search(r"\b(20\d{2})\b", normalized)

    if not year_match:
        return None

    year = int(year_match.group(1))

    quarter_match = re.search(r"\bq([1-4])\b|kuartal\s*([1-4])", normalized)
    if quarter_match:
        quarter = int(quarter_match.group(1) or quarter_match.group(2))
        start_month = ((quarter - 1) * 3) + 1
        end_month = start_month + 2
        return {
            "label": f"Q{quarter} {year}",
            "start": _date_range(year, start_month, end_month)[0],
            "end": _date_range(year, start_month, end_month)[1],
        }

    if any(term in normalized for term in ["pertengahan", "mid", "middle"]):
        start, end = _date_range(year, 4, 8)
        return {
            "label": f"pertengahan {year} (April-Agustus)",
            "start": start,
            "end": end,
        }

    for month_name, month in MONTHS.items():
        if month_name in normalized:
            start, end = _date_range(year, month, month)
            return {
                "label": f"{month_name.title()} {year}",
                "start": start,
                "end": end,
            }

    if any(term in normalized for term in ["awal", "early", "start"]):
        start, end = _date_range(year, 1, 3)
        return {
            "label": f"awal {year} (Januari-Maret)",
            "start": start,
            "end": end,
        }

    if any(term in normalized for term in ["akhir", "late", "end"]):
        start, end = _date_range(year, 9, 11)
        return {
            "label": f"akhir {year} (September-November)",
            "start": start,
            "end": end,
        }

    start, end = _date_range(year, 1, 11)
    return {
        "label": f"{year} sampai November",
        "start": start,
        "end": end,
    }


def _history_text(history):
    return "\n".join(
        item.get("content", "")
        for item in history[-6:]
        if item.get("content")
    )


def _last_period_from_history(history):
    text_value = _history_text(history)

    if not text_value:
        return None

    period = parse_period(text_value)

    if period:
        return period

    match = re.search(r"\b(20\d{2})-(0[1-9]|1[0-2])\b", text_value)
    if match:
        year = int(match.group(1))
        month = int(match.group(2))
        start, end = _date_range(year, month, month)
        return {
            "label": f"{year}-{month:02d}",
            "start": start,
            "end": end,
        }

    return None


def _last_referenced_month(message, history):
    normalized = message.lower()
    history_value = _history_text(history)

    for month_name, month in MONTHS.items():
        if month_name in normalized:
            year_match = re.search(r"\b(20\d{2})\b", normalized)

            if not year_match:
                year_match = re.search(r"\b(20\d{2})\b", history_value)

            if year_match:
                year = int(year_match.group(1))
                start, end = _date_range(year, month, month)
                return {
                    "label": f"{month_name.title()} {year}",
                    "start": start,
                    "end": end,
                }

    match = re.search(r"\b(20\d{2})-(0[1-9]|1[0-2])\b", normalized)
    if match:
        year = int(match.group(1))
        month = int(match.group(2))
        start, end = _date_range(year, month, month)
        return {
            "label": f"{year}-{month:02d}",
            "start": start,
            "end": end,
        }

    if "bulan terlemah" in normalized or "terlemah" in normalized:
        match = re.search(r"bulan terlemah adalah (20\d{2})-(0[1-9]|1[0-2])", history_value.lower())
        if match:
            year = int(match.group(1))
            month = int(match.group(2))
            start, end = _date_range(year, month, month)
            return {
                "label": f"{year}-{month:02d}",
                "start": start,
                "end": end,
            }

    if "bulan terbaik" in normalized or "terbaik" in normalized:
        match = re.search(r"bulan terbaik adalah (20\d{2})-(0[1-9]|1[0-2])", history_value.lower())
        if match:
            year = int(match.group(1))
            month = int(match.group(2))
            start, end = _date_range(year, month, month)
            return {
                "label": f"{year}-{month:02d}",
                "start": start,
                "end": end,
            }

    return None


def parse_quarter_comparison(message):
    normalized = message.lower()
    year_match = re.search(r"\b(20\d{2})\b", normalized)

    if not year_match:
        return None

    quarters = [int(item) for item in re.findall(r"\bq([1-4])\b", normalized)]

    if len(quarters) < 2:
        return None

    year = int(year_match.group(1))
    periods = []

    for quarter in quarters[:2]:
        start_month = ((quarter - 1) * 3) + 1
        end_month = start_month + 2
        start, end = _date_range(year, start_month, end_month)
        periods.append({
            "label": f"Q{quarter} {year}",
            "start": start,
            "end": end,
        })

    return periods


def _previous_period(period):
    start = period["start"]
    end = period["end"]
    months = (end.year - start.year) * 12 + (end.month - start.month)
    previous_end_month = start.month - 1
    previous_end_year = start.year

    if previous_end_month == 0:
        previous_end_month = 12
        previous_end_year -= 1

    previous_start_month = previous_end_month - months + 1
    previous_start_year = previous_end_year

    while previous_start_month <= 0:
        previous_start_month += 12
        previous_start_year -= 1

    previous_start, previous_end = _date_range(
        previous_start_year,
        previous_start_month,
        previous_end_month,
    )
    previous_label_end = previous_end - timedelta(days=1)

    return {
        "label": f"periode sebelumnya ({previous_start.strftime('%Y-%m')} sampai {previous_label_end.strftime('%Y-%m')})",
        "start": previous_start,
        "end": previous_end,
    }


def _detect_country(message, db):
    normalized = message.lower()

    if re.search(r"\buk\b", normalized):
        return "United Kingdom"

    countries = db.execute(
        text("""
            SELECT DISTINCT "Country"
            FROM customer
            WHERE "Country" IS NOT NULL
        """)
    ).scalars().all()

    for country in countries:
        if country and country.lower() in normalized:
            return country

    return None


def _fetch_period_summary(db, period, country=None):
    params = {
        "start_date": period["start"],
        "end_date": period["end"],
        "country": country,
    }

    summary = db.execute(
        text("""
            SELECT
                COALESCE(SUM(o."Total"), 0) AS revenue,
                COUNT(DISTINCT o."InvoiceNo") AS orders,
                COUNT(DISTINCT o."CustomerID") AS customers
            FROM orders o
            LEFT JOIN customer c ON c."CustomerID" = o."CustomerID"
            WHERE o."InvoiceDate" >= :start_date
              AND o."InvoiceDate" < :end_date
              AND (:country IS NULL OR c."Country" = :country)
        """),
        params,
    ).mappings().first()

    monthly = db.execute(
        text("""
            SELECT
                DATE_TRUNC('month', "InvoiceDate") AS month,
                COALESCE(SUM("Total"), 0) AS revenue,
                COUNT(DISTINCT "InvoiceNo") AS orders
            FROM orders o
            LEFT JOIN customer c ON c."CustomerID" = o."CustomerID"
            WHERE o."InvoiceDate" >= :start_date
              AND o."InvoiceDate" < :end_date
              AND (:country IS NULL OR c."Country" = :country)
            GROUP BY month
            ORDER BY month
        """),
        params,
    ).mappings().all()

    top_product = db.execute(
        text("""
            SELECT
                p."Description",
                COALESCE(SUM(d."Quantity" * d."UnitPrice"), 0) AS revenue,
                COALESCE(SUM(d."Quantity"), 0) AS quantity_sold
            FROM detail_order d
            JOIN orders o ON o."InvoiceNo" = d."InvoiceNo"
            LEFT JOIN customer c ON c."CustomerID" = o."CustomerID"
            JOIN product p ON p."StockCode" = d."StockCode"
            WHERE o."InvoiceDate" >= :start_date
              AND o."InvoiceDate" < :end_date
              AND (:country IS NULL OR c."Country" = :country)
            GROUP BY p."Description"
            ORDER BY revenue DESC
            LIMIT 1
        """),
        params,
    ).mappings().first()

    top_country = db.execute(
        text("""
            SELECT
                c."Country",
                COALESCE(SUM(o."Total"), 0) AS revenue
            FROM orders o
            JOIN customer c ON c."CustomerID" = o."CustomerID"
            WHERE o."InvoiceDate" >= :start_date
              AND o."InvoiceDate" < :end_date
              AND (:country IS NULL OR c."Country" = :country)
            GROUP BY c."Country"
            ORDER BY revenue DESC
            LIMIT 1
        """),
        params,
    ).mappings().first()

    return {
        "summary": dict(summary or {}),
        "monthly": [dict(row) for row in monthly],
        "top_product": dict(top_product) if top_product else None,
        "top_country": dict(top_country) if top_country else None,
    }


def _revenue_by_dimension(db, period, dimension, country=None):
    params = {
        "start_date": period["start"],
        "end_date": period["end"],
        "country": country,
    }

    if dimension == "product":
        query = """
            SELECT p."Description" AS name,
                   COALESCE(SUM(d."Quantity" * d."UnitPrice"), 0) AS revenue
            FROM detail_order d
            JOIN orders o ON o."InvoiceNo" = d."InvoiceNo"
            JOIN product p ON p."StockCode" = d."StockCode"
            LEFT JOIN customer c ON c."CustomerID" = o."CustomerID"
            WHERE o."InvoiceDate" >= :start_date
              AND o."InvoiceDate" < :end_date
              AND (:country IS NULL OR c."Country" = :country)
            GROUP BY p."Description"
        """
    elif dimension == "customer":
        query = """
            SELECT o."CustomerID" AS name,
                   COALESCE(SUM(o."Total"), 0) AS revenue
            FROM orders o
            LEFT JOIN customer c ON c."CustomerID" = o."CustomerID"
            WHERE o."InvoiceDate" >= :start_date
              AND o."InvoiceDate" < :end_date
              AND (:country IS NULL OR c."Country" = :country)
            GROUP BY o."CustomerID"
        """
    else:
        query = """
            SELECT c."Country" AS name,
                   COALESCE(SUM(o."Total"), 0) AS revenue
            FROM orders o
            JOIN customer c ON c."CustomerID" = o."CustomerID"
            WHERE o."InvoiceDate" >= :start_date
              AND o."InvoiceDate" < :end_date
            GROUP BY c."Country"
        """

    return {
        row["name"]: float(row["revenue"] or 0)
        for row in db.execute(text(query), params).mappings().all()
        if row["name"]
    }


def _top_changes(db, current_period, previous_period, dimension, country=None, limit=3):
    current = _revenue_by_dimension(db, current_period, dimension, country=country)
    previous = _revenue_by_dimension(db, previous_period, dimension, country=country)
    names = set(current) | set(previous)
    rows = [
        {
            "name": name,
            "current": current.get(name, 0),
            "previous": previous.get(name, 0),
            "change": current.get(name, 0) - previous.get(name, 0),
        }
        for name in names
    ]

    positive = sorted(rows, key=lambda item: item["change"], reverse=True)[:limit]
    negative = sorted(rows, key=lambda item: item["change"])[:limit]
    return positive, negative


def _dimension_from_message(message):
    normalized = message.lower()

    if any(term in normalized for term in ["produk", "product", "barang"]):
        return "product"
    if any(term in normalized for term in ["customer", "pelanggan", "client"]):
        return "customer"
    return "country"


def answer_follow_up(message, db, history):
    if not history:
        return None

    normalized = message.lower()
    follow_up_terms = [
        "kenapa",
        "mengapa",
        "apa penyebab",
        "penyebab",
        "sebab",
        "mengapa",
    ]

    if not any(term in normalized for term in follow_up_terms):
        return None

    current_period = _last_referenced_month(message, history)
    parent_period = _last_period_from_history(history)

    if not current_period or not parent_period:
        return None

    current_summary = _fetch_period_summary(db, current_period)["summary"]
    parent_data = _fetch_period_summary(db, parent_period)
    parent_monthly = parent_data["monthly"]

    other_months = [
        item
        for item in parent_monthly
        if item["month"].strftime("%Y-%m") != current_period["start"].strftime("%Y-%m")
    ]

    if not other_months:
        previous_period = _previous_period(current_period)
        comparison_label = previous_period["label"]
        comparison_revenue = float(_fetch_period_summary(db, previous_period)["summary"].get("revenue") or 0)
    else:
        comparison_revenue = sum(float(item["revenue"] or 0) for item in other_months) / len(other_months)
        comparison_label = f"rata-rata bulan lain dalam {parent_period['label']}"

    current_revenue = float(current_summary.get("revenue") or 0)
    gap = current_revenue - comparison_revenue
    gap_pct = (gap / comparison_revenue * 100) if comparison_revenue else 0

    parent_products = _revenue_by_dimension(db, parent_period, "product")
    month_products = _revenue_by_dimension(db, current_period, "product")
    parent_countries = _revenue_by_dimension(db, parent_period, "country")
    month_countries = _revenue_by_dimension(db, current_period, "country")

    top_month_product = max(month_products.items(), key=lambda item: item[1]) if month_products else None
    top_parent_product = max(parent_products.items(), key=lambda item: item[1]) if parent_products else None
    top_month_country = max(month_countries.items(), key=lambda item: item[1]) if month_countries else None
    top_parent_country = max(parent_countries.items(), key=lambda item: item[1]) if parent_countries else None

    answer = (
        f"{current_period['label']} menjadi lemah karena revenue-nya {_format_currency(current_revenue)}, "
        f"{abs(gap_pct):.1f}% {'lebih rendah' if gap < 0 else 'lebih tinggi'} dibanding {comparison_label} "
        f"({_format_currency(comparison_revenue)}). "
    )

    if top_month_country and top_parent_country:
        answer += (
            f"Market utama bulan tersebut adalah {top_month_country[0]} "
            f"({_format_currency(top_month_country[1])}), sementara kontributor utama periode induk adalah "
            f"{top_parent_country[0]} ({_format_currency(top_parent_country[1])}). "
        )

    if top_month_product and top_parent_product:
        answer += (
            f"Produk terbesar bulan tersebut adalah {top_month_product[0]} "
            f"({_format_currency(top_month_product[1])}); ini perlu dibandingkan dengan produk utama periode "
            f"{top_parent_product[0]} ({_format_currency(top_parent_product[1])}) untuk melihat apakah volume produk kunci belum optimal."
        )

    return {
        "answer": answer,
        "source": "conversation_memory+bi_query_planner",
        "data": {
            "current_period": current_period["label"],
            "parent_period": parent_period["label"],
            "current_revenue": current_revenue,
            "comparison_revenue": comparison_revenue,
        },
    }


def answer_quarter_comparison(message, db):
    periods = parse_quarter_comparison(message)

    if not periods:
        return None

    first = _fetch_period_summary(db, periods[0])["summary"]
    second = _fetch_period_summary(db, periods[1])["summary"]
    first_revenue = float(first.get("revenue") or 0)
    second_revenue = float(second.get("revenue") or 0)

    if second_revenue >= first_revenue:
        better = periods[1]
        weaker = periods[0]
        weaker_revenue = first_revenue
        diff = second_revenue - first_revenue
    else:
        better = periods[0]
        weaker = periods[1]
        weaker_revenue = second_revenue
        diff = first_revenue - second_revenue

    growth = (diff / weaker_revenue * 100) if weaker_revenue else 0

    return {
        "answer": (
            f"{better['label']} lebih baik dibanding {weaker['label']}. "
            f"Revenue {periods[0]['label']} adalah {_format_currency(first_revenue)}, "
            f"sedangkan {periods[1]['label']} adalah {_format_currency(second_revenue)}. "
            f"Selisihnya {_format_currency(diff)}, atau {growth:.1f}% lebih tinggi "
            f"dari {weaker['label']}."
        ),
        "source": "semantic_analytics",
        "data": {
            "intent": "period_comparison",
            "periods": [periods[0]["label"], periods[1]["label"]],
            "first_revenue": first_revenue,
            "second_revenue": second_revenue,
            "better_period": better["label"],
            "weaker_period": weaker["label"],
            "difference": diff,
            "growth_percent": round(growth, 1),
        },
    }


def answer_root_cause(message, db):
    normalized = message.lower()
    root_terms = [
        "kenapa",
        "mengapa",
        "penyebab",
        "sebab",
        "mendorong",
        "berpengaruh",
        "impact",
        "driver",
        "root cause",
    ]

    if not any(term in normalized for term in root_terms):
        return None

    comparison_periods = parse_quarter_comparison(message)
    if comparison_periods:
        current_period = comparison_periods[0]
        previous_period = comparison_periods[1]
    else:
        current_period = parse_period(message)
        if not current_period:
            return None
        previous_period = _previous_period(current_period)

    country = _detect_country(message, db)
    current = _fetch_period_summary(db, current_period, country=country)["summary"]
    previous = _fetch_period_summary(db, previous_period, country=country)["summary"]
    current_revenue = float(current.get("revenue") or 0)
    previous_revenue = float(previous.get("revenue") or 0)
    change = current_revenue - previous_revenue
    growth = (change / previous_revenue * 100) if previous_revenue else 0

    dimension = _dimension_from_message(message)
    positive, negative = _top_changes(
        db,
        current_period,
        previous_period,
        dimension,
        country=country,
    )
    main_positive = positive[0] if positive else None
    main_negative = negative[0] if negative else None
    direction = "naik" if change >= 0 else "turun"
    scope = f" di {country}" if country else ""

    answer = (
        f"Revenue {current_period['label']}{scope} {direction} "
        f"{_format_currency(abs(change))} ({growth:.1f}%) dibanding {previous_period['label']}. "
    )

    if main_positive:
        answer += (
            f"Kontributor kenaikan terbesar pada dimensi {dimension} adalah "
            f"{main_positive['name']} dengan perubahan {_format_currency(main_positive['change'])}. "
        )

    if main_negative and main_negative["change"] < 0:
        answer += (
            f"Tekanan penurunan terbesar berasal dari {main_negative['name']} "
            f"({_format_currency(main_negative['change'])}). "
        )

    answer += (
        "Prioritas analisis berikutnya adalah menjaga kontributor positif dan mengecek "
        "area yang mengalami penurunan terbesar."
    )

    return {
        "answer": answer,
        "source": "bi_query_planner",
        "data": {
            "intent": "root_cause",
            "current_period": current_period["label"],
            "previous_period": previous_period["label"],
            "country_filter": country,
            "dimension": dimension,
            "current_revenue": current_revenue,
            "previous_revenue": previous_revenue,
            "change": change,
            "growth_percent": round(growth, 1),
            "top_positive_driver": main_positive,
            "top_negative_driver": main_negative,
        },
    }


def answer_concentration(message, db):
    normalized = message.lower()
    concentration_terms = [
        "bergantung",
        "ketergantungan",
        "konsentrasi",
        "terkonsentrasi",
        "dominan",
        "dominasi",
        "terlalu bergantung",
    ]

    if not any(term in normalized for term in concentration_terms):
        return None

    period = parse_period(message) or {
        "label": "seluruh periode data",
        "start": datetime(2010, 1, 1),
        "end": datetime(2012, 1, 1),
    }
    dimension = _dimension_from_message(message)
    rows = _revenue_by_dimension(db, period, dimension)
    total = sum(rows.values())

    if not rows or total == 0:
        return {
            "answer": "Dashboard belum memiliki data yang cukup untuk mengukur konsentrasi revenue.",
            "source": "bi_query_planner",
        }

    top_name, top_revenue = max(rows.items(), key=lambda item: item[1])
    share = (top_revenue / total) * 100

    if share >= 70:
        risk = "tinggi"
    elif share >= 45:
        risk = "sedang"
    else:
        risk = "rendah"

    return {
        "answer": (
            f"Ketergantungan revenue pada dimensi {dimension} di {period['label']} berada pada level {risk}. "
            f"Kontributor terbesar adalah {top_name} dengan {_format_currency(top_revenue)}, "
            f"setara {share:.1f}% dari total revenue {_format_currency(total)}. "
            "Jika proporsinya terlalu tinggi, strategi mitigasinya adalah memperluas kontribusi dari segmen lain."
        ),
        "source": "bi_query_planner",
        "data": {
            "intent": "concentration_risk",
            "period": period["label"],
            "dimension": dimension,
            "top_contributor": top_name,
            "top_revenue": top_revenue,
            "total_revenue": total,
            "share_percent": round(share, 1),
            "risk_level": risk,
        },
    }


def answer_top_contributor(message, db):
    normalized = message.lower()
    contributor_terms = [
        "kontributor",
        "berkontribusi",
        "paling besar",
        "terbesar",
        "tertinggi",
        "mendorong",
    ]

    if not any(term in normalized for term in contributor_terms):
        return None

    period = parse_period(message) or {
        "label": "seluruh periode data",
        "start": datetime(2010, 1, 1),
        "end": datetime(2012, 1, 1),
    }
    country = _detect_country(message, db)
    dimension = _dimension_from_message(message)
    rows = _revenue_by_dimension(db, period, dimension, country=country)
    total = sum(rows.values())

    if not rows or total == 0:
        return None

    top_name, top_revenue = max(rows.items(), key=lambda item: item[1])
    share = (top_revenue / total) * 100
    scope = f" di {country}" if country else ""

    return {
        "answer": (
            f"Kontributor {dimension} terbesar pada {period['label']}{scope} adalah {top_name} "
            f"dengan revenue {_format_currency(top_revenue)}, atau {share:.1f}% dari total "
            f"{_format_currency(total)}."
        ),
        "source": "bi_query_planner",
        "data": {
            "intent": "top_contributor",
            "period": period["label"],
            "dimension": dimension,
            "country_filter": country,
            "top_contributor": top_name,
            "top_revenue": top_revenue,
            "total_revenue": total,
            "share_percent": round(share, 1),
        },
    }


def _trend(monthly):
    if len(monthly) < 2:
        return "belum cukup data bulanan untuk membaca tren"

    first = float(monthly[0]["revenue"] or 0)
    last = float(monthly[-1]["revenue"] or 0)

    if first == 0:
        return "tren belum bisa dihitung karena revenue awal nol"

    growth = ((last - first) / first) * 100
    direction = "naik" if growth >= 0 else "turun"
    return f"tren {direction} {abs(growth):.1f}% dari awal ke akhir periode"


def answer_bi_query(message, db, history=None):
    follow_up = answer_follow_up(message, db, history or [])

    if follow_up:
        return follow_up

    for handler in [
        answer_root_cause,
        answer_concentration,
        answer_quarter_comparison,
        answer_top_contributor,
    ]:
        result = handler(message, db)

        if result:
            return result

    comparison = answer_quarter_comparison(message, db)

    if comparison:
        return comparison

    period = parse_period(message)

    if not period:
        return None

    data = _fetch_period_summary(db, period)
    summary = data["summary"]
    monthly = data["monthly"]

    if not monthly:
        return {
            "answer": f"Dashboard tidak memiliki data untuk periode {period['label']}.",
            "source": "semantic_analytics",
        }

    best_month = max(monthly, key=lambda item: float(item["revenue"] or 0))
    worst_month = min(monthly, key=lambda item: float(item["revenue"] or 0))
    top_product = data["top_product"]
    top_country = data["top_country"]

    answer = (
        f"Pada {period['label']}, kondisi perusahaan menghasilkan revenue "
        f"{_format_currency(summary['revenue'])} dari {_format_number(summary['orders'])} orders "
        f"dan {_format_number(summary['customers'])} customers. "
        f"Secara bulanan, {_trend(monthly)}; bulan terbaik adalah "
        f"{best_month['month'].strftime('%Y-%m')} dengan {_format_currency(best_month['revenue'])}, "
        f"sedangkan bulan terlemah adalah {worst_month['month'].strftime('%Y-%m')} "
        f"dengan {_format_currency(worst_month['revenue'])}. "
    )

    if top_country:
        answer += (
            f"Market utama adalah {top_country['Country']} "
            f"({_format_currency(top_country['revenue'])}). "
        )

    if top_product:
        answer += (
            f"Produk kontributor terbesar adalah {top_product['Description']} "
            f"({_format_currency(top_product['revenue'])})."
        )

    return {
        "answer": answer,
        "source": "semantic_analytics",
        "data": {
            "intent": "performance_summary",
            "period": period["label"],
            "summary": summary,
            "best_month": dict(best_month),
            "worst_month": dict(worst_month),
            "top_product": top_product,
            "top_country": top_country,
            "trend": _trend(monthly),
        },
    }


def answer_period_analysis(message, db, history=None):
    return answer_bi_query(message, db, history=history)
