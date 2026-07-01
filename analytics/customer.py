import os
import sys

# 1. Ambil path dari folder root (projekt)
# os.path.dirname(__file__) menghasilkan path folder 'testing'
# Menambahkan os.path.dirname di luarnya akan naik 1 tingkat ke folder 'projekt'
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 2. Daftarkan folder root ke dalam sistem pencarian Python
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from sqlalchemy import text

def get_top_customers(
    db,
    limit=10,
    year=None
):
    limit = int(limit)
    year_clause = 'WHERE EXTRACT(YEAR FROM o."InvoiceDate") = :year' if year else ""

    result = db.execute(
        text(f"""
        SELECT
            c."CustomerID",
            c."Country",
            COUNT(o."InvoiceNo") as orders,
            SUM(o."Total") as revenue

        FROM customer c

        JOIN orders o
        ON c."CustomerID" =
           o."CustomerID"

        {year_clause}

        GROUP BY
            c."CustomerID",
            c."Country"

        ORDER BY revenue DESC

        LIMIT {limit}
        """),
        {"year": year}
    )

    return [
        dict(row._mapping)
        for row in result
    ]


def get_customer_activity(
    db,
    page=1,
    page_size=10,
    year=None,
    search=None,
    country=None,
    min_orders=None,
):
    page = max(int(page), 1)
    page_size = min(max(int(page_size), 1), 100)
    offset = (page - 1) * page_size
    params = {
        "limit": page_size,
        "offset": offset,
    }
    where_clauses = []
    having_clauses = []

    if year:
        where_clauses.append('EXTRACT(YEAR FROM o."InvoiceDate") = :year')
        params["year"] = year

    if search:
        where_clauses.append('(CAST(c."CustomerID" AS TEXT) ILIKE :search OR c."Country" ILIKE :search)')
        params["search"] = f"%{search}%"

    if country and country != "all":
        where_clauses.append('c."Country" = :country')
        params["country"] = country

    if min_orders is not None:
        having_clauses.append('COUNT(o."InvoiceNo") >= :min_orders')
        params["min_orders"] = int(min_orders)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    having_sql = f"HAVING {' AND '.join(having_clauses)}" if having_clauses else ""
    grouped_sql = f"""
        SELECT
            c."CustomerID",
            c."Country",
            COUNT(o."InvoiceNo") as orders,
            SUM(o."Total") as revenue

        FROM customer c

        JOIN orders o
        ON c."CustomerID" =
           o."CustomerID"

        {where_sql}

        GROUP BY
            c."CustomerID",
            c."Country"

        {having_sql}
    """

    total = db.execute(
        text(f"SELECT COUNT(*) FROM ({grouped_sql}) customer_activity"),
        params
    ).scalar() or 0

    result = db.execute(
        text(f"""
        SELECT *
        FROM ({grouped_sql}) customer_activity
        ORDER BY revenue DESC
        LIMIT :limit
        OFFSET :offset
        """),
        params
    )

    return {
        "items": [dict(row._mapping) for row in result],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": max((total + page_size - 1) // page_size, 1),
    }
