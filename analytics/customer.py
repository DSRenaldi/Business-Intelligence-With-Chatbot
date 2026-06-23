from loader import load_data
#Import Dataset
df = load_data()

#Top Customer
def get_top_customers(
    top_n=10
):

    return (
        df.groupby("CustomerID")
        ["Revenue"]
        .sum()
        .sort_values(
            ascending=False
        )
        .head(top_n)
    )

#Most Frequent Customer
def get_most_frequent_customers():

    return (
        df.groupby("CustomerID")
        ["InvoiceNo"]
        .nunique()
        .sort_values(
            ascending=False
        )
        .head(10)
    )