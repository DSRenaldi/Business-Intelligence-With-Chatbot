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

from sqlalchemy.orm import Session

from database.database import get_db

from analytics.revenue import (
    get_total_revenue
)

from database.models import (
    Customer,
    Product,
    Orders
)

router = APIRouter()


@router.get("/api/kpi")
def kpi(
    db: Session = Depends(get_db)
):

    return {

        "total_revenue":
            get_total_revenue(db),

        "total_orders":
            db.query(
                Orders
            ).count(),

        "total_customers":
            db.query(
                Customer
            ).count(),

        "total_products":
            db.query(
                Product
            ).count()
    }