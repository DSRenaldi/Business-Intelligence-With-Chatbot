from analytics.loader import load_data
#import data
df = load_data()

#Total Revenue
def get_total_revenue():

    return round(
        df["Revenue"].sum(),
        2
    )

#Revenue Per Month
def get_monthly_revenue():

    monthly = (
        df.groupby(
            df["InvoiceDate"]
            .dt.to_period("M")
        )["Revenue"]
        .sum()
        .reset_index()
    )

    return monthly

#Growth Rate
def get_monthly_growth():

    monthly = get_monthly_revenue()

    monthly["GrowthRate"] = (
        monthly["Revenue"]
        .pct_change()
        * 100
    )

    return monthly

#Best Month
def get_best_month():

    monthly = get_monthly_revenue()

    return monthly.loc[
        monthly["Revenue"].idxmax()
    ]

#Worst Month
def get_worst_month():

    monthly = get_monthly_revenue()

    return monthly.loc[
        monthly["Revenue"].idxmin()
    ]