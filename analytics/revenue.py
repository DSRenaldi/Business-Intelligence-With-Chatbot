import os
import sys

# 1. Ambil path dari folder root (projekt)
# os.path.dirname(__file__) menghasilkan path folder 'testing'
# Menambahkan os.path.dirname di luarnya akan naik 1 tingkat ke folder 'projekt'
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 2. Daftarkan folder root ke dalam sistem pencarian Python
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from sqlalchemy import func, text

from database.models import Orders


def get_total_revenue(db):

    revenue = db.query(
        func.sum(Orders.Total)
    ).scalar()

    return revenue


def get_monthly_revenue(db):

    result = db.execute(
        text("""
            SELECT
                DATE_TRUNC('month', "InvoiceDate") as month,
                SUM("Total") as revenue
            FROM orders
            GROUP BY month
            ORDER BY month
        """)
    )

    return [
        dict(row._mapping)
        for row in result
    ]


def get_growth_rate(db):

    monthly = get_monthly_revenue(db)

    growth = []

    for i in range(1, len(monthly)):

        prev = monthly[i-1]["revenue"]
        curr = monthly[i]["revenue"]

        rate = (
            ((curr - prev) / prev) * 100
        ) if prev else 0

        growth.append({
            "month":
                monthly[i]["month"],

            "growth_rate":
                round(rate, 2)
        })

    return growth