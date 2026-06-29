from sqlalchemy import text


def _format_currency(value):
    return f"${float(value or 0):,.0f}"


def _format_number(value):
    return f"{int(value or 0):,}"


def _rank_label(rank):
    labels = {
        "top": "tertinggi",
        "middle": "menengah",
        "bottom": "paling kecil",
    }
    return labels.get(rank, rank)


def _dimension_label(dimension):
    labels = {
        "product": "produk",
        "customer": "customer",
        "country": "negara",
    }
    return labels.get(dimension, dimension)


def _rows_by_dimension(db, plan):
    period = plan["period"]
    params = {
        "start_date": period["start"],
        "end_date": period["end"],
    }

    if plan["dimension"] == "product":
        query = """
            SELECT
                p."Description" AS name,
                COALESCE(SUM(d."Quantity"), 0) AS quantity,
                COALESCE(SUM(d."Quantity" * d."UnitPrice"), 0) AS revenue
            FROM detail_order d
            JOIN orders o ON o."InvoiceNo" = d."InvoiceNo"
            JOIN product p ON p."StockCode" = d."StockCode"
            WHERE o."InvoiceDate" >= :start_date
              AND o."InvoiceDate" < :end_date
            GROUP BY p."Description"
        """
    elif plan["dimension"] == "customer":
        query = """
            SELECT
                o."CustomerID" AS name,
                COUNT(DISTINCT o."InvoiceNo") AS quantity,
                COALESCE(SUM(o."Total"), 0) AS revenue
            FROM orders o
            WHERE o."InvoiceDate" >= :start_date
              AND o."InvoiceDate" < :end_date
            GROUP BY o."CustomerID"
        """
    else:
        query = """
            SELECT
                c."Country" AS name,
                COUNT(DISTINCT o."InvoiceNo") AS quantity,
                COALESCE(SUM(o."Total"), 0) AS revenue
            FROM orders o
            JOIN customer c ON c."CustomerID" = o."CustomerID"
            WHERE o."InvoiceDate" >= :start_date
              AND o."InvoiceDate" < :end_date
            GROUP BY c."Country"
        """

    rows = [
        dict(row)
        for row in db.execute(text(query), params).mappings().all()
        if row["name"]
    ]

    return sorted(rows, key=lambda item: float(item[plan["metric"]] or 0))


def execute_rank_distribution(db, plan):
    rows = _rows_by_dimension(db, plan)

    if not rows:
        return {
            "answer": f"Dashboard tidak memiliki data {plan['dimension']} untuk {plan['period']['label']}.",
            "source": "rank_distribution_tool",
            "data": {"intent": plan["intent"], "rows": []},
        }

    selected = {}

    for rank in plan["ranks"]:
        if rank == "top":
            selected[rank] = rows[-1]
        elif rank == "middle":
            selected[rank] = rows[len(rows) // 2]
        elif rank == "bottom":
            selected[rank] = rows[0]

    metric = plan["metric"]
    metric_label = "quantity" if metric == "quantity" else "revenue bersih"
    lines = []

    for rank in plan["ranks"]:
        item = selected.get(rank)

        if not item:
            continue

        value = _format_number(item[metric]) if metric == "quantity" else _format_currency(item[metric])
        lines.append(f"- {_dimension_label(plan['dimension'])} {_rank_label(rank)}: {item['name']} dengan {metric_label} {value}")

    assumption = ""
    if plan["period"].get("assumed_year"):
        assumption = " Saya menggunakan tahun 2011 karena pertanyaan tidak menyebut tahun."

    negative_note = ""
    if metric == "revenue" and any(float(item[metric] or 0) < 0 for item in selected.values()):
        negative_note = " Nilai revenue negatif biasanya menunjukkan retur, pembatalan, atau koreksi transaksi."

    return {
        "answer": (
            f"Untuk {plan['period']['label']}, berdasarkan {metric_label}:\n"
            + "\n".join(lines)
            + assumption
            + negative_note
        ),
        "source": "rank_distribution_tool",
        "data": {
            "intent": plan["intent"],
            "dimension": plan["dimension"],
            "metric": metric,
            "period": plan["period"]["label"],
            "ranks": selected,
            "assumed_year": plan["period"].get("assumed_year", False),
        },
    }


def execute_structured_plan(db, plan):
    if plan["intent"] == "rank_distribution_by_period":
        return execute_rank_distribution(db, plan)

    return None
