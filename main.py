import os
import sys

# 1. Ambil path dari folder root (projekt)
# os.path.dirname(__file__) menghasilkan path folder 'testing'
# Menambahkan os.path.dirname di luarnya akan naik 1 tingkat ke folder 'projekt'
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 2. Daftarkan folder root ke dalam sistem pencarian Python
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.kpi import router as kpi_router
from api.revenue import router as revenue_router
from api.product import router as product_router
from api.customer import router as customer_router
from api.country import router as country_router
from api.insight import (router as insight_router)
from api.assistant import router as assistant_router
from api.report import router as report_router
from api.metadata import router as metadata_router

app = FastAPI(
    title="Nexus BI API"
)

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)

app.include_router(
    kpi_router
)

app.include_router(
    revenue_router
)

app.include_router(
    product_router
)

app.include_router(
    customer_router
)

app.include_router(
    country_router
)

app.include_router(
    insight_router
)

app.include_router(
    assistant_router
)

app.include_router(
    report_router
)

app.include_router(
    metadata_router
)
