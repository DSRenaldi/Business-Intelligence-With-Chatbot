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

from analytics.insight import (
    generate_insight
)

router = APIRouter()

@router.get(
    "/api/insight/summary"
)
def summary(
    year: int | None = Query(None, ge=2010, le=2100),
    db: Session = Depends(get_db)
):
    return generate_insight(db, year=year)
