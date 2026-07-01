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

def get_country_revenue(db, year=None):
    year_clause = 'WHERE EXTRACT(YEAR FROM o."InvoiceDate") = :year' if year else ""

    result = db.execute(
        text(f"""
        SELECT
            c."Country",
            SUM(o."Total") as revenue

        FROM customer c

        JOIN orders o
        ON c."CustomerID" =
           o."CustomerID"

        {year_clause}

        GROUP BY c."Country"

        ORDER BY revenue DESC
        """),
        {"year": year}
    )

    return [
        dict(row._mapping)
        for row in result
    ]
