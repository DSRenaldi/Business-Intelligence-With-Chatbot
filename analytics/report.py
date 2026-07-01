import json
import os
import re

import torch
from sqlalchemy import func

from ai.model_loader import get_model_bundle
from ai.model_loader import is_model_loaded
from analytics.country import get_country_revenue
from analytics.customer import get_top_customers
from analytics.insight import generate_insight
from analytics.product import get_top_products
from analytics.product import get_worst_products
from analytics.revenue import get_monthly_revenue
from analytics.revenue import get_total_revenue
from database.models import DetailOrder
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


def _period_label(monthly, year=None):
    if year:
        return f"{year} analysis"

    if not monthly:
        return "No transaction period available"

    return f"{_format_month(monthly[0]['month'])} to {_format_month(monthly[-1]['month'])}"


def _filtered_counts(db, year=None):
    orders_query = db.query(Orders)

    if year:
        orders_query = orders_query.filter(func.extract("year", Orders.InvoiceDate) == year)

    total_orders = orders_query.count()
    total_customers = orders_query.with_entities(Orders.CustomerID).distinct().count()

    product_query = (
        db.query(Product.StockCode)
        .join(DetailOrder, Product.StockCode == DetailOrder.StockCode)
        .join(Orders, DetailOrder.InvoiceNo == Orders.InvoiceNo)
    )

    if year:
        product_query = product_query.filter(func.extract("year", Orders.InvoiceDate) == year)

    total_products = product_query.distinct().count()

    return total_orders, total_customers, total_products


def _share(value, total):
    total = float(total or 0)
    return (float(value or 0) / total) * 100 if total else 0


def _contextual_fallback(context):
    growth = context["latest_growth"]
    top_country = context["top_country"]
    top_product = context["top_product"]
    top_customer = context["top_customer"]
    concentration = context["country_share"]

    trend_text = "improving" if growth > 0 else "declining" if growth < 0 else "flat"
    risk_text = "high" if concentration >= 70 else "moderate" if concentration >= 45 else "balanced"

    return {
        "executive_summary": [
            (
                f"Revenue reached {_format_currency(context['total_revenue'])} from "
                f"{_format_number(context['total_orders'])} orders during {context['period']}."
            ),
            (
                f"Latest month-over-month revenue momentum is {trend_text} at {growth}%, "
                f"with best month {context['best_month_label']} and weakest month {context['weakest_month_label']}."
            ),
            (
                f"{top_country['Country'] if top_country else 'N/A'} is the leading market with "
                f"{concentration:.1f}% revenue share, indicating {risk_text} market concentration."
            ),
            (
                f"Top product contribution is led by {top_product['Description'] if top_product else 'N/A'}, "
                f"while top customer concentration is led by Customer {top_customer['CustomerID'] if top_customer else 'N/A'}."
            ),
        ],
        "recommendations": [
            (
                f"Prioritize stock and fulfillment for {top_product['Description'] if top_product else 'top products'} "
                "because it is the strongest product revenue driver in the selected period."
            ),
            (
                f"Review dependency on {top_country['Country'] if top_country else 'the leading market'} "
                "and build growth actions for secondary countries to reduce concentration risk."
            ),
            (
                "Investigate the weakest month by comparing product mix, order volume, and country contribution "
                "against the best month."
            ),
            (
                "Use the highest-value customers for retention campaigns, then test reactivation offers for "
                "low-frequency customers."
            ),
        ],
        "narrative": (
            f"The selected period shows {trend_text} revenue momentum with {risk_text} market concentration. "
            "Management should focus on protecting the strongest revenue drivers while checking whether growth "
            "is broad-based across countries, products, and customers."
        ),
    }


def _build_ai_prompt(context):
    monthly_rows = "\n".join(
        f"- {_format_month(item['month'])}: {_format_currency(item['revenue'])}"
        for item in context["monthly"][-6:]
    )
    product_rows = "\n".join(
        (
            f"- {item['Description']}: {_format_currency(item['revenue'])}, "
            f"{float(item.get('share') or 0):.1f}% share"
        )
        for item in context["top_products"][:3]
    )
    country_rows = "\n".join(
        (
            f"- {item['Country']}: {_format_currency(item['revenue'])}, "
            f"{float(item.get('share') or 0):.1f}% share"
        )
        for item in context["top_countries"][:3]
    )

    return f"""
You are the Business Intelligence Copilot for Nexus BI.
Use ONLY the facts below. Do not invent data.
Return strict JSON only with keys:
recommendations: array of 3 short actionable strings,
narrative: one short paragraph, max 70 words.

Selected period: {context['period']}
KPI:
- Revenue: {_format_currency(context['total_revenue'])}
- Orders: {_format_number(context['total_orders'])}
- Customers: {_format_number(context['total_customers'])}
- Products: {_format_number(context['total_products'])}
- Average order value: {_format_currency(context['average_order_value'])}
- Latest MoM growth: {context['latest_growth']}%
- Best month: {context['best_month_label']}
- Weakest month: {context['weakest_month_label']}
- Market concentration risk: {context['risk_level']}

Monthly revenue:
{monthly_rows or '- No monthly data'}

Top products:
{product_rows or '- No product data'}

Top countries:
{country_rows or '- No country data'}
""".strip()


def _parse_json_object(text):
    if not text:
        return None

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None

    try:
        parsed = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None

    if not isinstance(parsed, dict):
        return None

    recommendations = parsed.get("recommendations")
    narrative = parsed.get("narrative")

    if not isinstance(recommendations, list) or not narrative:
        return None

    return {
        "recommendations": [str(item) for item in recommendations[:3]],
        "narrative": str(narrative),
    }


def _generate_ai_sections(context):
    if not is_model_loaded():
        fallback = _contextual_fallback(context)
        fallback["source"] = "contextual_fast"
        return fallback

    try:
        tokenizer, model = get_model_bundle()
        messages = [
            {
                "role": "system",
                "content": "You generate grounded BI recommendations as strict JSON.",
            },
            {
                "role": "user",
                "content": _build_ai_prompt(context),
            },
        ]
        prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )
        inputs = tokenizer([prompt], return_tensors="pt").to(model.device)
        max_new_tokens = int(os.getenv("QWEN_REPORT_MAX_NEW_TOKENS", "128"))

        with torch.inference_mode():
            output_ids = model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,
                use_cache=True,
                pad_token_id=tokenizer.eos_token_id,
            )

        generated_ids = output_ids[0][inputs.input_ids.shape[-1]:]
        output = tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
        parsed = _parse_json_object(output)

        if parsed:
            parsed["source"] = "qwen_contextual"
            return parsed
    except Exception as error:
        print(f"AI report generation failed: {error}")

    fallback = _contextual_fallback(context)
    fallback["source"] = "contextual_fallback"
    return fallback


def _build_report_payload(db, year=None):
    monthly = get_monthly_revenue(db, year=year)
    top_products = get_top_products(db, limit=5, year=year)
    worst_products = get_worst_products(db, limit=5, year=year)
    countries = get_country_revenue(db, year=year)
    customers = get_top_customers(db, limit=5, year=year)
    insight = generate_insight(db, year=year)

    best_month = max(monthly, key=lambda item: float(item["revenue"] or 0)) if monthly else None
    weakest_month = min(monthly, key=lambda item: float(item["revenue"] or 0)) if monthly else None
    latest_growth = (
        _growth(monthly[-2]["revenue"], monthly[-1]["revenue"])
        if len(monthly) >= 2
        else 0
    )

    total_revenue = get_total_revenue(db, year=year)
    total_orders, total_customers, total_products = _filtered_counts(db, year=year)
    aov = float(total_revenue or 0) / total_orders if total_orders else 0

    for item in top_products:
        item["share"] = round(_share(item.get("revenue"), total_revenue), 2)

    for item in countries:
        item["share"] = round(_share(item.get("revenue"), total_revenue), 2)

    top_country = countries[0] if countries else None
    top_product = top_products[0] if top_products else None
    top_customer = customers[0] if customers else None
    country_share = _share(top_country["revenue"], total_revenue) if top_country else 0

    risk_level = "High" if country_share >= 70 else "Medium" if country_share >= 45 else "Low"
    best_month_label = (
        f"{_format_month(best_month['month'])} ({_format_currency(best_month['revenue'])})"
        if best_month
        else "N/A"
    )
    weakest_month_label = (
        f"{_format_month(weakest_month['month'])} ({_format_currency(weakest_month['revenue'])})"
        if weakest_month
        else "N/A"
    )
    context = {
        "period": _period_label(monthly, year=year),
        "monthly": monthly,
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_products": total_products,
        "average_order_value": round(aov, 2),
        "latest_growth": latest_growth,
        "best_month_label": best_month_label,
        "weakest_month_label": weakest_month_label,
        "top_products": top_products,
        "top_countries": countries[:5],
        "top_customers": customers,
        "top_country": top_country,
        "top_product": top_product,
        "top_customer": top_customer,
        "country_share": country_share,
        "risk_level": risk_level,
    }

    return {
        "context": context,
        "deterministic": _contextual_fallback(context),
        "insight": insight,
        "top_products": top_products,
        "worst_products": worst_products,
        "countries": countries,
        "customers": customers,
        "best_month": best_month,
        "weakest_month": weakest_month,
        "latest_growth": latest_growth,
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_products": total_products,
        "average_order_value": round(aov, 2),
        "country_share": country_share,
        "risk_level": risk_level,
    }


def generate_executive_report(db, year=None):
    payload = _build_report_payload(db, year=year)
    context = payload["context"]
    deterministic = payload["deterministic"]
    best_month = payload["best_month"]
    weakest_month = payload["weakest_month"]

    return {
        "title": "Nexus BI Executive Report",
        "period": context["period"],
        "ai_source": "deterministic_context",
        "executive_summary": deterministic["executive_summary"],
        "narrative": deterministic["narrative"],
        "kpi": {
            "total_revenue": payload["total_revenue"],
            "total_orders": payload["total_orders"],
            "total_customers": payload["total_customers"],
            "total_products": payload["total_products"],
            "average_order_value": payload["average_order_value"],
        },
        "revenue_analysis": {
            "latest_complete_growth": payload["latest_growth"],
            "best_month": {
                "month": _format_month(best_month["month"]),
                "revenue": best_month["revenue"],
            } if best_month else None,
            "weakest_month": {
                "month": _format_month(weakest_month["month"]),
                "revenue": weakest_month["revenue"],
            } if weakest_month else None,
            "note": "Generated from the selected dashboard period.",
        },
        "product_analysis": {
            "top_products": payload["top_products"],
            "worst_products": payload["worst_products"],
        },
        "market_analysis": {
            "top_countries": payload["countries"][:5],
            "concentration_risk": payload["risk_level"],
            "top_country_share": round(payload["country_share"], 2),
        },
        "customer_analysis": {
            "top_customers": payload["customers"],
        },
        "insight": payload["insight"],
        "recommendations": deterministic["recommendations"][:3],
    }


def generate_report_enhancement(db, year=None):
    payload = _build_report_payload(db, year=year)
    deterministic = payload["deterministic"]
    generated = _generate_ai_sections(payload["context"])

    return {
        "ai_source": generated["source"],
        "narrative": generated.get("narrative") or deterministic["narrative"],
        "recommendations": (generated.get("recommendations") or deterministic["recommendations"])[:3],
    }
