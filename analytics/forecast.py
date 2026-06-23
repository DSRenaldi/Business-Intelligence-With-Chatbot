import matplotlib.pyplot as plt
from analytics.loader import load_data
import pandas as pd
from prophet import Prophet

df = load_data()

def get_monthly_revenue_data():

    monthly = (
        df.groupby(
            df["InvoiceDate"]
            .dt.to_period("M")
        )["Revenue"]
        .sum()
        .reset_index()
    )

    monthly["InvoiceDate"] = (
        monthly["InvoiceDate"]
        .dt.to_timestamp()
    )

    return monthly

#Format Prophet
def prepare_prophet_data():

    monthly = get_monthly_revenue_data()

    prophet_df = monthly.rename(
        columns={
            "InvoiceDate": "ds",
            "Revenue": "y"
        }
    )

    return prophet_df

#Train Model
def train_forecast_model():

    prophet_df = prepare_prophet_data()

    model = Prophet()

    model.fit(prophet_df)

    return model

#Forecast 3 Bulan
def forecast_next_months(
    periods=3
):

    model = train_forecast_model()

    future = model.make_future_dataframe(
        periods=periods,
        freq="M"
    )

    forecast = model.predict(
        future
    )

    return forecast

#Ambil Forecast Saja
def get_future_forecast(
    periods=3
):

    forecast = forecast_next_months(
        periods
    )

    return forecast[
        ["ds", "yhat", "yhat_lower", "yhat_upper"]
    ].tail(periods)

#Forecast Trend
def get_forecast_trend():

    future = get_future_forecast(3)

    first = future.iloc[0]["yhat"]

    last = future.iloc[-1]["yhat"]

    growth = (
        (last - first)
        / first
    ) * 100

    return round(growth, 2)

#Forecast Narrative
def generate_forecast_summary():

    future = get_future_forecast(3)

    trend = get_forecast_trend()

    if trend > 5:

        condition = "Growth"

    elif trend < -5:

        condition = "Decline"

    else:

        condition = "Stable"

    return f"""
Forecast Condition:
{condition}

Predicted Revenue Growth:
{trend}%

Forecast Horizon:
3 Months
"""

#Visualisasi Dashboard
forecast = forecast_next_months(3)

plt.figure(figsize=(12,5))

plt.plot(
    forecast["ds"],
    forecast["yhat"]
)

plt.title(
    "Revenue Forecast"
)

plt.show()