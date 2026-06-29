from analytics.country import get_country_revenue
from analytics.customer import get_top_customers
from analytics.insight import generate_insight
from analytics.product import get_top_products
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


def _latest_revenue_growth(monthly):
    if len(monthly) < 2:
        return 0

    previous = float(monthly[-2]["revenue"] or 0)
    current = float(monthly[-1]["revenue"] or 0)

    if previous == 0:
        return 0

    return round(((current - previous) / previous) * 100, 2)


def build_business_context(db):
    monthly = get_monthly_revenue(db)
    top_products = get_top_products(db, limit=5)
    top_countries = get_country_revenue(db)[:5]
    top_customers = get_top_customers(db, limit=5)
    insight = generate_insight(db)

    insight_growth = insight.get("revenue_growth")

    return {
        "total_revenue": get_total_revenue(db),
        "total_orders": db.query(Orders).count(),
        "total_customers": db.query(Customer).count(),
        "total_products": db.query(Product).count(),
        "monthly": monthly,
        "latest_growth": insight_growth if insight_growth is not None else _latest_revenue_growth(monthly),
        "top_products": top_products,
        "top_countries": top_countries,
        "top_customers": top_customers,
        "insight": insight,
    }


def context_to_text(context, topic="kpi"):
    monthly_rows = "\n".join(
        f"- {_format_month(item['month'])}: {_format_currency(item['revenue'])}"
        for item in context["monthly"][-4:]
    )

    product_rows = "\n".join(
        f"- {item['Description']}: {_format_currency(item['revenue'])}"
        for item in context["top_products"][:3]
    )

    country_rows = "\n".join(
        f"- {item['Country']}: {_format_currency(item['revenue'])}"
        for item in context["top_countries"][:3]
    )

    customer_rows = "\n".join(
        (
            f"- Customer {item['CustomerID']} ({item['Country']}): "
            f"{_format_currency(item['revenue'])}, {_format_number(item['orders'])} orders"
        )
        for item in context["top_customers"][:3]
    )

    insight = context["insight"]

    base = f"""
KPI:
- Revenue: {_format_currency(context["total_revenue"])}
- Orders: {_format_number(context["total_orders"])}
- Customers: {_format_number(context["total_customers"])}
- Products: {_format_number(context["total_products"])}
- Latest growth: {context["latest_growth"]}%
""".strip()

    sections = {
        "products": f"Top products:\n{product_rows or '- Unavailable'}",
        "countries": f"Top countries:\n{country_rows or '- Unavailable'}",
        "customers": f"Top customers:\n{customer_rows or '- Unavailable'}",
        "revenue": f"Recent monthly revenue:\n{monthly_rows or '- Unavailable'}",
        "root_cause": (
            f"Recent monthly revenue:\n{monthly_rows or '- Unavailable'}\n\n"
            f"Top products:\n{product_rows or '- Unavailable'}\n\n"
            f"Top countries:\n{country_rows or '- Unavailable'}\n\n"
            f"Recommendation: {insight.get('recommendation')}"
        ),
        "kpi": (
            f"Top product: {insight.get('top_product')}\n"
            f"Top country: {insight.get('top_country')}\n"
            f"Recommendation: {insight.get('recommendation')}"
        ),
    }

    return f"{base}\n\n{sections.get(topic, sections['kpi'])}".strip()
