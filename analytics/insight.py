import os
import sys

# 1. Ambil path dari folder root (projekt)
# os.path.dirname(__file__) menghasilkan path folder 'testing'
# Menambahkan os.path.dirname di luarnya akan naik 1 tingkat ke folder 'projekt'
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 2. Daftarkan folder root ke dalam sistem pencarian Python
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from analytics.revenue import get_monthly_revenue
from analytics.product import get_top_products
from analytics.country import get_country_revenue


def generate_insight(db):

    monthly = get_monthly_revenue(db)

    # print(monthly[-3:])

    products = get_top_products(db, limit=1)

    countries = get_country_revenue(db)

    revenue_growth = 0

    if len(monthly) >= 3:

        prev = float(monthly[-3]["revenue"])
        curr = float(monthly[-2]["revenue"])

        if prev > 0:

            revenue_growth = round(
                ((curr - prev) / prev) * 100,
                2
            )

    top_product = (
        products[0]["Description"]
        if products
        else "N/A"
    )

    top_country = (
        countries[0]["Country"]
        if countries
        else "N/A"
    )

    if revenue_growth > 10:

        recommendation = (
            "Revenue menunjukkan pertumbuhan yang kuat. "
            "Pertimbangkan meningkatkan stok produk terlaris."
        )

    elif revenue_growth < 0:

        recommendation = (
            "Revenue mengalami penurunan. "
            "Evaluasi performa produk dan negara dengan kontribusi terbesar."
        )

    else:

        recommendation = (
            "Revenue relatif stabil. "
            "Fokus pada optimasi promosi dan retensi pelanggan."
        )

    return {

        "revenue_growth":
            revenue_growth,

        "top_country":
            top_country,

        "top_product":
            top_product,

        "recommendation":
            recommendation
    }