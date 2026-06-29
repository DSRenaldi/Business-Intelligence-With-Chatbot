from analytics.country import get_country_revenue
from analytics.customer import get_top_customers
from analytics.insight import generate_insight
from analytics.product import get_top_products
from analytics.product import get_worst_products
from analytics.revenue import get_monthly_revenue
from analytics.revenue import get_total_revenue
from database.models import Customer
from database.models import Orders
from database.models import Product


def _format_currency(value):
    return f"${float(value or 0):,.0f}"


def _format_number(value):
    return f"{int(value or 0):,}"


def _format_month(value):
    return value.strftime("%Y-%m") if hasattr(value, "strftime") else str(value)


def _growth(previous, current):
    previous = float(previous or 0)
    current = float(current or 0)

    if previous == 0:
        return 0

    return round(((current - previous) / previous) * 100, 2)


def generate_executive_report(db):
    monthly = get_monthly_revenue(db)
    complete_monthly = monthly[:-1] if monthly and _format_month(monthly[-1]["month"]) == "2011-12" else monthly
    top_products = get_top_products(db, limit=5)
    worst_products = get_worst_products(db, limit=5)
    countries = get_country_revenue(db)
    customers = get_top_customers(db, limit=5)
    insight = generate_insight(db)

    best_month = max(complete_monthly, key=lambda item: float(item["revenue"] or 0)) if complete_monthly else None
    weakest_month = min(complete_monthly, key=lambda item: float(item["revenue"] or 0)) if complete_monthly else None
    latest_growth = (
        _growth(complete_monthly[-2]["revenue"], complete_monthly[-1]["revenue"])
        if len(complete_monthly) >= 2
        else 0
    )

    total_revenue = get_total_revenue(db)
    total_orders = db.query(Orders).count()
    total_customers = db.query(Customer).count()
    total_products = db.query(Product).count()
    aov = float(total_revenue or 0) / total_orders if total_orders else 0
    top_country = countries[0] if countries else None
    country_share = (
        (float(top_country["revenue"] or 0) / float(total_revenue or 1)) * 100
        if top_country
        else 0
    )

    risk_level = "High" if country_share >= 70 else "Medium" if country_share >= 45 else "Low"

    executive_summary = [
        f"Total revenue reached {_format_currency(total_revenue)} from {_format_number(total_orders)} orders.",
        f"Latest complete-month revenue growth is {latest_growth}%.",
        f"{top_country['Country'] if top_country else 'N/A'} is the dominant market with {country_share:.1f}% revenue share.",
        f"Top product is {top_products[0]['Description'] if top_products else 'N/A'}.",
    ]

    recommendations = [
        "Protect availability and fulfillment for the strongest revenue products.",
        "Reduce market concentration risk by growing non-dominant countries.",
        "Review low-performing products for pricing, returns, or assortment decisions.",
        "Use complete periods for executive decisions because December 2011 appears incomplete.",
    ]

    return {
        "title": "Nexus BI Executive Report",
        "period": "2010-2011 dataset, complete-period analysis prioritized through November 2011",
        "executive_summary": executive_summary,
        "kpi": {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "total_customers": total_customers,
            "total_products": total_products,
            "average_order_value": round(aov, 2),
        },
        "revenue_analysis": {
            "latest_complete_growth": latest_growth,
            "best_month": {
                "month": _format_month(best_month["month"]),
                "revenue": best_month["revenue"],
            } if best_month else None,
            "weakest_month": {
                "month": _format_month(weakest_month["month"]),
                "revenue": weakest_month["revenue"],
            } if weakest_month else None,
            "note": "December 2011 is excluded from complete-period growth interpretation.",
        },
        "product_analysis": {
            "top_products": top_products,
            "worst_products": worst_products,
        },
        "market_analysis": {
            "top_countries": countries[:5],
            "concentration_risk": risk_level,
            "top_country_share": round(country_share, 2),
        },
        "customer_analysis": {
            "top_customers": customers,
        },
        "insight": insight,
        "recommendations": recommendations,
    }
