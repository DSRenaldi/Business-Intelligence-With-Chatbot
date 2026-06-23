from loader import load_data
#Import Dataset
df = load_data()

#Revenue by Country
def get_country_revenue():

    return (
        df.groupby("Country")
        ["Revenue"]
        .sum()
        .sort_values(
            ascending=False
        )
    )

#Top Country
def get_top_country():

    country = (
        get_country_revenue()
    )

    return country.index[0]