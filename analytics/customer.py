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
    limit=10
):
    limit = int(limit)

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

        GROUP BY
            c."CustomerID",
            c."Country"

        ORDER BY revenue DESC

        LIMIT {limit}
        """)
    )

    return [
        dict(row._mapping)
        for row in result
    ]
