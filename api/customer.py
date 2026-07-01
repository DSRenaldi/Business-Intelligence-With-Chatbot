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

from analytics.customer import *

router = APIRouter()


@router.get(
    "/api/customers/top"
)
def top_customers(
    limit: int = Query(10, ge=1, le=10000),
    year: int | None = Query(None, ge=2010, le=2100),
    db: Session = Depends(get_db)
):

    return get_top_customers(db, limit=limit, year=year)


@router.get(
    "/api/customers/activity"
)
def customer_activity(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    year: int | None = Query(None, ge=2010, le=2100),
    search: str | None = Query(None),
    country: str | None = Query(None),
    min_orders: int | None = Query(None, ge=0),
    db: Session = Depends(get_db)
):

    return get_customer_activity(
        db,
        page=page,
        page_size=page_size,
        year=year,
        search=search,
        country=country,
        min_orders=min_orders,
    )
