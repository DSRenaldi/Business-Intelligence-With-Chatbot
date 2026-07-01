from fastapi import APIRouter
from fastapi import Depends
from fastapi import Query
from sqlalchemy.orm import Session

from analytics.report import generate_executive_report
from analytics.report import generate_report_enhancement
from database.database import get_db

router = APIRouter()


@router.get("/api/reports/executive")
def executive_report(
    year: int | None = Query(None, ge=2010, le=2100),
    db: Session = Depends(get_db),
):
    return generate_executive_report(db, year=year)


@router.get("/api/reports/executive/enhance")
def executive_report_enhancement(
    year: int | None = Query(None, ge=2010, le=2100),
    db: Session = Depends(get_db),
):
    return generate_report_enhancement(db, year=year)
