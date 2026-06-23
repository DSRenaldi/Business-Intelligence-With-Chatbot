from analytics.root_cause import *

#Revenue Turun
def revenue_decline_recommendation(summary):

    recommendations = []

    recommendations.append(
        f"Evaluasi performa produk "
        f"{summary['main_product']} "
        f"yang mengalami penurunan terbesar."
    )

    recommendations.append(
        f"Lakukan analisis pasar pada "
        f"{summary['main_country']} "
        f"karena memberikan kontribusi "
        f"penurunan terbesar."
    )

    recommendations.append(
        "Pertimbangkan program promosi "
        "atau diskon untuk meningkatkan penjualan."
    )

    recommendations.append(
        "Analisis perubahan pola pembelian customer."
    )

    return recommendations

#Revenue Naik
def revenue_growth_recommendation(summary):

    recommendations = []

    recommendations.append(
        f"Pertahankan strategi yang "
        f"mendukung pertumbuhan "
        f"{summary['main_product']}."
    )

    recommendations.append(
        f"Perkuat penetrasi pasar "
        f"di {summary['main_country']}."
    )

    recommendations.append(
        "Pastikan ketersediaan stok "
        "untuk mengantisipasi kenaikan permintaan."
    )

    recommendations.append(
        "Identifikasi peluang cross-selling."
    )

    return recommendations

#Revenue Stabil
def revenue_stable_recommendation(summary):

    recommendations = []

    recommendations.append(
        "Lakukan evaluasi peluang "
        "untuk meningkatkan pertumbuhan."
    )

    recommendations.append(
        "Fokus pada produk dengan "
        "potensi pertumbuhan tinggi."
    )

    recommendations.append(
        "Optimalkan strategi pemasaran."
    )

    return recommendations

#Recomendation Router
def get_recommendation(summary):

    condition = business_condition(
        summary["revenue_change"]
    )

    if condition == "DECLINE":

        return revenue_decline_recommendation(
            summary
        )

    elif condition == "GROWTH":

        return revenue_growth_recommendation(
            summary
        )

    else:

        return revenue_stable_recommendation(
            summary
        )
    
#Business Advisory Report
def generate_advisory_report(summary):

    recommendations = get_recommendation(
        summary
    )

    report = f"""
BUSINESS ADVISORY REPORT

Business Condition :
{business_condition(summary['revenue_change'])}

Revenue Change :
{summary['revenue_change']}%

Main Product :
{summary['main_product']}

Main Country :
{summary['main_country']}

Recommendations:

"""

    for i, rec in enumerate(
        recommendations,
        start=1
    ):
        report += f"{i}. {rec}\n"

    return report