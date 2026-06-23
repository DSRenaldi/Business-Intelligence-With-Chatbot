from analytics.loader import load_data
import pandas as pd

# ==================================================
# LOAD DATA
# ==================================================

df = load_data()

df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"])

df["YearMonth"] = df["InvoiceDate"].dt.to_period("M")


# ==================================================
# GET DATA BY PERIOD
# ==================================================

def get_period_data(period):
    """
    period format:
    '2011-11'
    """

    period = pd.Period(period)

    return df[df["YearMonth"] == period]


# ==================================================
# REVENUE CHANGE
# ==================================================

def get_revenue_change(current_df, previous_df):

    current_revenue = current_df["Revenue"].sum()

    previous_revenue = previous_df["Revenue"].sum()

    if previous_revenue == 0:
        return 0

    change = (
        (current_revenue - previous_revenue)
        / previous_revenue
    ) * 100

    return round(change, 2)


# ==================================================
# PRODUCT CONTRIBUTION
# ==================================================

def get_product_contribution(
    current_period,
    previous_period
):

    current_df = get_period_data(current_period)

    previous_df = get_period_data(previous_period)

    current_product = (
        current_df
        .groupby("Description")["Revenue"]
        .sum()
    )

    previous_product = (
        previous_df
        .groupby("Description")["Revenue"]
        .sum()
    )

    comparison = pd.concat(
        [current_product, previous_product],
        axis=1
    )

    comparison.columns = [
        "CurrentRevenue",
        "PreviousRevenue"
    ]

    comparison = comparison.fillna(0)

    comparison["Change"] = (
        comparison["CurrentRevenue"]
        - comparison["PreviousRevenue"]
    )

    worst_product = comparison.sort_values(
        "Change"
    ).iloc[0]

    product_name = comparison.sort_values(
        "Change"
    ).index[0]

    return {
        "product": product_name,
        "change": round(
            worst_product["Change"],
            2
        )
    }


# ==================================================
# COUNTRY CONTRIBUTION
# ==================================================

def get_country_contribution(
    current_period,
    previous_period
):

    current_df = get_period_data(current_period)

    previous_df = get_period_data(previous_period)

    current_country = (
        current_df
        .groupby("Country")["Revenue"]
        .sum()
    )

    previous_country = (
        previous_df
        .groupby("Country")["Revenue"]
        .sum()
    )

    comparison = pd.concat(
        [current_country, previous_country],
        axis=1
    )

    comparison.columns = [
        "CurrentRevenue",
        "PreviousRevenue"
    ]

    comparison = comparison.fillna(0)

    comparison["Change"] = (
        comparison["CurrentRevenue"]
        - comparison["PreviousRevenue"]
    )

    worst_country = comparison.sort_values(
        "Change"
    ).iloc[0]

    country_name = comparison.sort_values(
        "Change"
    ).index[0]

    return {
        "country": country_name,
        "change": round(
            worst_country["Change"],
            2
        )
    }


# ==================================================
# CUSTOMER CONTRIBUTION
# ==================================================

def get_customer_contribution(
    current_period,
    previous_period
):

    current_df = get_period_data(current_period)

    previous_df = get_period_data(previous_period)

    current_customer = (
        current_df
        .groupby("CustomerID")["Revenue"]
        .sum()
    )

    previous_customer = (
        previous_df
        .groupby("CustomerID")["Revenue"]
        .sum()
    )

    comparison = pd.concat(
        [current_customer, previous_customer],
        axis=1
    )

    comparison.columns = [
        "CurrentRevenue",
        "PreviousRevenue"
    ]

    comparison = comparison.fillna(0)

    comparison["Change"] = (
        comparison["CurrentRevenue"]
        - comparison["PreviousRevenue"]
    )

    worst_customer = comparison.sort_values(
        "Change"
    ).iloc[0]

    customer_id = comparison.sort_values(
        "Change"
    ).index[0]

    return {
        "customer": customer_id,
        "change": round(
            worst_customer["Change"],
            2
        )
    }


# ==================================================
# ROOT CAUSE SUMMARY
# ==================================================

def get_root_cause(
    current_period,
    previous_period
):

    current_df = get_period_data(
        current_period
    )

    previous_df = get_period_data(
        previous_period
    )

    revenue_change = get_revenue_change(
        current_df,
        previous_df
    )

    product = get_product_contribution(
        current_period,
        previous_period
    )

    country = get_country_contribution(
        current_period,
        previous_period
    )

    customer = get_customer_contribution(
        current_period,
        previous_period
    )

    return {

        "revenue_change":
            revenue_change,

        "main_product":
            product["product"],

        "product_change":
            product["change"],

        "main_country":
            country["country"],

        "country_change":
            country["change"],

        "main_customer":
            customer["customer"],

        "customer_change":
            customer["change"]
    }


# ==================================================
# BUSINESS CONDITION
# ==================================================

def business_condition(
    revenue_change
):

    if revenue_change > 10:
        return "GROWTH"

    elif revenue_change < -10:
        return "DECLINE"

    else:
        return "STABLE"


# ==================================================
# BUSINESS NARRATIVE
# ==================================================

def generate_root_cause_text(
    summary
):

    condition = business_condition(
        summary["revenue_change"]
    )

    return f"""
Business Condition : {condition}

Revenue Change : {summary['revenue_change']}%

Main Product Contributor :
{summary['main_product']}

Product Revenue Change :
{summary['product_change']}

Main Country Contributor :
{summary['main_country']}

Country Revenue Change :
{summary['country_change']}

Main Customer Contributor :
{summary['main_customer']}

Customer Revenue Change :
{summary['customer_change']}
"""


# ==================================================
# INSIGHT DATASET
# ==================================================

def build_insight_dataset():

    monthly = (
        df.groupby("YearMonth")
        ["Revenue"]
        .sum()
        .reset_index()
    )

    monthly["GrowthRate"] = (
        monthly["Revenue"]
        .pct_change()
        * 100
    )

    monthly["Condition"] = (
        monthly["GrowthRate"]
        .apply(
            lambda x:
            business_condition(x)
            if pd.notna(x)
            else "STABLE"
        )
    )

    return monthly