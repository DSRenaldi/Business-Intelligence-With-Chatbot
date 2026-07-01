import os
import sys

# 1. Ambil path dari folder root (projekt)
# os.path.dirname(__file__) menghasilkan path folder 'testing'
# Menambahkan os.path.dirname di luarnya akan naik 1 tingkat ke folder 'projekt'
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 2. Daftarkan folder root ke dalam sistem pencarian Python
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Query

from sqlalchemy.orm import Session

from database.database import get_db

from analytics.revenue import (
    get_total_revenue
)

from database.models import Customer, DetailOrder, Orders, Product

router = APIRouter()


@router.get("/api/kpi")
def kpi(
    year: int | None = Query(None, ge=2010, le=2100),
    db: Session = Depends(get_db)
):
    orders_query = db.query(Orders)
    customer_query = db.query(Customer.CustomerID).join(
        Orders,
        Customer.CustomerID == Orders.CustomerID
    )
    product_query = db.query(Product.StockCode).join(
        DetailOrder,
        Product.StockCode == DetailOrder.StockCode
    ).join(
        Orders,
        DetailOrder.InvoiceNo == Orders.InvoiceNo
    )

    if year:
        orders_query = orders_query.filter(
            Orders.InvoiceDate.between(f"{year}-01-01", f"{year}-12-31 23:59:59")
        )
        customer_query = customer_query.filter(
            Orders.InvoiceDate.between(f"{year}-01-01", f"{year}-12-31 23:59:59")
        )
        product_query = product_query.filter(
            Orders.InvoiceDate.between(f"{year}-01-01", f"{year}-12-31 23:59:59")
        )

    return {

        "total_revenue":
            get_total_revenue(db, year=year),

        "total_orders":
            orders_query.count(),

        "total_customers":
            customer_query.distinct().count(),

        "total_products":
            product_query.distinct().count()
    }
