from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from analytics.report import generate_executive_report
from database.database import get_db

router = APIRouter()


@router.get("/api/reports/executive")
def executive_report(db: Session = Depends(get_db)):
    return generate_executive_report(db)
