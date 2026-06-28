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

from analytics.revenue import *

router = APIRouter()


@router.get(
    "/api/revenue/monthly"
)
def monthly_revenue(
    db: Session = Depends(get_db)
):

    return get_monthly_revenue(db)


@router.get(
    "/api/revenue/growth"
)
def growth_rate(
    db: Session = Depends(get_db)
):

    return get_growth_rate(db)