from loader import load_data
from revenue import (
    get_total_revenue
)

#Import Data
df = load_data()

def get_kpi_summary():

    return {
        "total_revenue":
            get_total_revenue(),

        "total_customers":
            df["CustomerID"]
            .nunique(),

        "total_products":
            df["StockCode"]
            .nunique(),

        "total_countries":
            df["Country"]
            .nunique()
    }