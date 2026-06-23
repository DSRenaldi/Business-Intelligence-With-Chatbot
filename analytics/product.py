from loader import load_data
#Import Dataset
df = load_data()

#Top Product
def get_top_products(
    top_n=10
):

    result = (
        df.groupby(["StockCode","Description"])
        ["Revenue"]
        .sum()
        .sort_values(
            ascending=False
        )
        .head(top_n)
    )

    return result

#Worst Product
def get_worst_products(
    top_n=10
):

    result = (
        df.groupby(["StockCode", "Description"])
        ["Revenue"]
        .sum()
        .sort_values()
        .head(top_n)
    )

    return result

#Most Returned Product
def get_most_returned_products():

    returns = df[
        df["InvoiceNo"]
        .astype(str)
        .str.startswith("C")
    ]

    result = (
        returns.groupby(
            ["StockCode", "Description"]
        )
        ["Quantity"]
        .count()
        .sort_values(
            ascending=False
        )
        .head(10)
    )

    return result