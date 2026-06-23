import pandas as pd
import os

# Mencari lokasi folder dataset relatif terhadap file loader.py ini
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "Dataset", "cleaned_order.csv")


def load_data():
    df = pd.read_csv(
        DATASET_PATH
    )

    df["InvoiceDate"] = pd.to_datetime(
        df["InvoiceDate"]
    )

    return df