METRIC_CATALOG = {
    "revenue": {
        "label": "Revenue",
        "definition": "Total sales value from orders.Total or Quantity * UnitPrice for product-level analysis.",
        "source": "PostgreSQL orders and detail_order tables",
    },
    "orders": {
        "label": "Orders",
        "definition": "Distinct invoice count.",
        "source": "PostgreSQL orders table",
    },
    "customers": {
        "label": "Customers",
        "definition": "Distinct customer count.",
        "source": "PostgreSQL customer/orders tables",
    },
    "growth": {
        "label": "Growth",
        "definition": "Percentage change between two comparable periods.",
        "source": "Derived by Nexus BI analytics tools",
    },
    "contribution": {
        "label": "Contribution",
        "definition": "Revenue share or revenue delta by product, country, or customer.",
        "source": "Derived by Nexus BI analytics tools",
    },
}


DATA_CAVEATS = [
    "December 2011 may be incomplete, so executive analysis should prioritize complete periods up to November 2011.",
    "Dashboard APIs and PostgreSQL analytics are the source of truth; model output must not invent metrics.",
]


def get_metric_context():
    lines = []

    for key, metric in METRIC_CATALOG.items():
        lines.append(f"- {key}: {metric['definition']}")

    return "\n".join(lines)
