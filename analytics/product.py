import os
import sys

# 1. Ambil path dari folder root (projekt)
# os.path.dirname(__file__) menghasilkan path folder 'testing'
# Menambahkan os.path.dirname di luarnya akan naik 1 tingkat ke folder 'projekt'
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 2. Daftarkan folder root ke dalam sistem pencarian Python
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from sqlalchemy import func,text

from database.models import Orders

def get_top_products(
    db,
    limit=10
):
    limit = int(limit)

    result = db.execute(
        text(f"""
        SELECT
            p."Description",
            SUM(d."Quantity") as quantity_sold,
            SUM(
                d."Quantity"
                *
                d."UnitPrice"
            ) as revenue

        FROM detail_order d

        JOIN product p
        ON p."StockCode" = d."StockCode"

        GROUP BY p."Description"

        ORDER BY revenue DESC

        LIMIT {limit}
        """)
    )

    return [
        dict(row._mapping)
        for row in result
    ]


def get_worst_products(
    db,
    limit=10
):
    limit = int(limit)

    result = db.execute(
        text(f"""
        SELECT
            p."Description",
            SUM(d."Quantity") as quantity_sold,
            SUM(
                d."Quantity"
                *
                d."UnitPrice"
            ) as revenue

        FROM detail_order d

        JOIN product p
        ON p."StockCode" = d."StockCode"

        GROUP BY p."Description"

        ORDER BY revenue ASC

        LIMIT {limit}
        """)
    )

    return [
        dict(row._mapping)
        for row in result
    ]
