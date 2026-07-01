from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.database import get_db

router = APIRouter()


@router.get("/api/years")
def years(db: Session = Depends(get_db)):
    rows = db.execute(
        text(
            """
            SELECT DISTINCT EXTRACT(YEAR FROM "InvoiceDate")::int AS year
            FROM orders
            WHERE "InvoiceDate" IS NOT NULL
            ORDER BY year
            """
        )
    )

    return [int(row.year) for row in rows]
