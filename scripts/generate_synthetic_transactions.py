import argparse
import calendar
import random
import sys
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import func, text

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from database.database import SessionLocal
from database.models import Customer, DetailOrder, Orders, Product


SYNTHETIC_INVOICE_PREFIX = "SYN"
RANDOM_SEED = 42
ANNUAL_TRANSACTION_TARGET = 2000
END_DATE = datetime(2012, 12, 31, 23, 59, 59)


def weighted_choice(items, weights):
    return random.choices(items, weights=weights, k=1)[0]


def month_key(dt):
    return dt.strftime("%Y-%m")


def month_ranges(start_date, end_date):
    current = datetime(start_date.year, start_date.month, 1)
    while current <= end_date:
      last_day = calendar.monthrange(current.year, current.month)[1]
      month_start = max(start_date, current)
      month_end = min(end_date, datetime(current.year, current.month, last_day, 23, 59, 59))
      if month_start <= month_end:
          yield month_start, month_end
      current = datetime(current.year + (current.month // 12), (current.month % 12) + 1, 1)


def get_monthly_weights(db):
    rows = db.execute(
        text(
            """
            SELECT EXTRACT(MONTH FROM "InvoiceDate")::int AS month,
                   COUNT(*) AS orders
            FROM orders
            WHERE "InvoiceDate" >= '2011-01-01'
              AND "InvoiceDate" < '2012-01-01'
            GROUP BY EXTRACT(MONTH FROM "InvoiceDate")::int
            """
        )
    ).mappings().all()
    weights = {int(row["month"]): int(row["orders"]) for row in rows}
    fallback = max(weights.values(), default=1)
    return {month: max(weights.get(month, fallback), 1) for month in range(1, 13)}


def get_2010_growth_weights():
    return {
        1: 55,
        2: 62,
        3: 70,
        4: 78,
        5: 88,
        6: 96,
        7: 108,
        8: 120,
        9: 138,
        10: 165,
        11: 210,
        12: 245,
    }


def get_2013_recovery_weights():
    return {
        1: 120,
        2: 115,
        3: 130,
        4: 135,
        5: 128,
        6: 126,
        7: 132,
        8: 150,
        9: 165,
        10: 185,
        11: 230,
        12: 205,
    }


def get_2014_black_friday_weights():
    return {
        1: 118,
        2: 112,
        3: 128,
        4: 142,
        5: 150,
        6: 146,
        7: 158,
        8: 152,
        9: 174,
        10: 190,
        11: 280,
        12: 230,
    }


def get_trend_weights(db, target_year=None):
    if target_year == 2010:
        return get_2010_growth_weights()

    if target_year == 2013:
        return get_2013_recovery_weights()

    if target_year == 2014:
        return get_2014_black_friday_weights()

    return get_monthly_weights(db)


def allocate_orders(start_date, end_date, annual_target, monthly_weights):
    month_spans = list(month_ranges(start_date, end_date))
    raw_allocations = []

    for month_start, month_end in month_spans:
        month_days = (month_end.date() - month_start.date()).days + 1
        full_month_days = calendar.monthrange(month_start.year, month_start.month)[1]
        seasonality = monthly_weights[month_start.month]
        raw_allocations.append(
            {
                "start": month_start,
                "end": month_end,
                "weight": seasonality * (month_days / full_month_days),
            }
        )

    allocated = []
    for year in sorted({item["start"].year for item in raw_allocations}):
        year_items = [item for item in raw_allocations if item["start"].year == year]
        year_start = max(start_date, datetime(year, 1, 1))
        year_end = min(end_date, datetime(year, 12, 31, 23, 59, 59))
        year_days = (year_end.date() - year_start.date()).days + 1
        year_target = annual_target if year_start.month == 1 and year_start.day == 1 else round((year_days / 365) * annual_target)
        total_weight = sum(item["weight"] for item in year_items) or 1
        remainder = year_target
        year_allocated = []

        for item in year_items:
            count = int(year_target * item["weight"] / total_weight)
            year_allocated.append({**item, "orders": count})
            remainder -= count

        for item in sorted(year_allocated, key=lambda value: value["weight"], reverse=True)[:remainder]:
            item["orders"] += 1

        allocated.extend(year_allocated)

    return allocated


def random_datetime(start_date, end_date):
    seconds = int((end_date - start_date).total_seconds())
    selected = start_date + timedelta(seconds=random.randint(0, max(seconds, 0)))
    return selected.replace(second=0, microsecond=0)


def load_customer_pool(db, new_customer_count):
    existing = db.query(Customer.CustomerID, Customer.Country).all()
    country_counts = Counter(country for _, country in existing if country)
    countries = list(country_counts.keys())
    country_weights = list(country_counts.values())
    max_customer_pk = db.query(func.max(Customer.ID)).scalar() or 0

    numeric_ids = []
    for customer_id, _ in existing:
        if str(customer_id).isdigit():
            numeric_ids.append(int(customer_id))
    next_customer_id = max(numeric_ids or [20000]) + 1

    new_customers = []
    for offset in range(new_customer_count):
        customer_id = str(next_customer_id + offset)
        country = weighted_choice(countries, country_weights)
        new_customers.append(
            Customer(
                ID=max_customer_pk + offset + 1,
                CustomerID=customer_id,
                Country=country,
            )
        )

    return existing, new_customers


def load_product_pool(db, profile=None):
    products = (
        db.query(Product.StockCode, Product.UnitPrice)
        .filter(Product.UnitPrice > 0)
        .all()
    )
    product_revenue = db.execute(
        text(
            """
            SELECT d."StockCode",
                   SUM(d."Quantity" * d."UnitPrice") AS revenue
            FROM detail_order d
            JOIN product p ON p."StockCode" = d."StockCode"
            WHERE d."Quantity" > 0
              AND d."UnitPrice" > 0
            GROUP BY d."StockCode"
            """
        )
    ).mappings().all()
    revenue_map = {row["StockCode"]: max(float(row["revenue"] or 0), 1) for row in product_revenue}
    stock_codes = [stock_code for stock_code, _ in products]
    price_map = {stock_code: float(unit_price or 0) for stock_code, unit_price in products}
    if profile == "2010_growth":
        weights = [min(revenue_map.get(stock_code, 1) ** 0.5, 100) for stock_code in stock_codes]
    elif profile == "2013_recovery":
        weights = [min(revenue_map.get(stock_code, 1) ** 0.75, 500) for stock_code in stock_codes]
    elif profile == "2014_black_friday":
        weights = [min(revenue_map.get(stock_code, 1) ** 0.68, 420) for stock_code in stock_codes]
    else:
        weights = [revenue_map.get(stock_code, 1) for stock_code in stock_codes]
    return stock_codes, price_map, weights


def build_orders(db, allocations, new_customer_count=260, profile=None):
    seed = (
        2010
        if profile == "2010_growth"
        else 2013
        if profile == "2013_recovery"
        else 2014
        if profile == "2014_black_friday"
        else RANDOM_SEED
    )
    random.seed(seed)
    max_order_id = db.query(func.max(Orders.ID)).scalar() or 0
    max_detail_id = db.query(func.max(DetailOrder.ID)).scalar() or 0
    existing_customers, new_customers = load_customer_pool(db, new_customer_count=new_customer_count)
    stock_codes, price_map, product_weights = load_product_pool(db, profile=profile)
    customer_pool = existing_customers + [(customer.CustomerID, customer.Country) for customer in new_customers]
    customer_ids = [customer_id for customer_id, _ in customer_pool]

    orders = []
    details = []
    order_id = max_order_id
    detail_id = max_detail_id
    invoice_sequence = 1

    for allocation in allocations:
        for _ in range(allocation["orders"]):
            order_id += 1
            invoice_no = f"{SYNTHETIC_INVOICE_PREFIX}{order_id:07d}"
            invoice_date = random_datetime(allocation["start"], allocation["end"])
            customer_id = random.choice(customer_ids)
            if profile == "2010_growth":
                line_count = random.choices(
                    [3, 4, 5, 6, 8, 10],
                    weights=[10, 18, 22, 22, 18, 10],
                    k=1,
                )[0]
            elif profile == "2013_recovery":
                line_count = random.choices(
                    [4, 6, 8, 10, 12, 14, 16],
                    weights=[8, 14, 20, 22, 18, 12, 6],
                    k=1,
                )[0]
            elif profile == "2014_black_friday":
                line_count = random.choices(
                    [3, 5, 7, 9, 11, 13, 15],
                    weights=[8, 14, 20, 22, 18, 12, 6],
                    k=1,
                )[0]
            else:
                line_count = random.choices(
                    [4, 6, 8, 10, 12, 16, 20, 24],
                    weights=[8, 12, 18, 20, 18, 12, 8, 4],
                    k=1,
                )[0]
            selected_products = set()
            total = 0

            for _line in range(line_count):
                stock_code = weighted_choice(stock_codes, product_weights)
                if stock_code in selected_products and len(selected_products) < len(stock_codes):
                    continue
                selected_products.add(stock_code)
                unit_price = price_map[stock_code]
                if profile == "2010_growth":
                    quantity = random.choices(
                        [2, 3, 4, 6, 8, 10, 12, 24],
                        weights=[12, 12, 14, 18, 16, 12, 10, 6],
                        k=1,
                    )[0]
                elif profile == "2013_recovery":
                    quantity = random.choices(
                        [1, 2, 3, 4, 6, 8, 10, 12, 24],
                        weights=[10, 16, 12, 14, 15, 10, 8, 10, 5],
                        k=1,
                    )[0]
                elif profile == "2014_black_friday":
                    quantity = random.choices(
                        [1, 2, 3, 4, 6, 8, 10, 12, 18, 24],
                        weights=[12, 18, 13, 15, 14, 10, 7, 6, 3, 2],
                        k=1,
                    )[0]
                else:
                    quantity = random.choices(
                        [1, 2, 3, 4, 6, 8, 10, 12, 24, 36],
                        weights=[8, 13, 10, 13, 14, 9, 9, 14, 7, 3],
                        k=1,
                    )[0]
                detail_id += 1
                total += quantity * unit_price
                details.append(
                    DetailOrder(
                        ID=detail_id,
                        InvoiceNo=invoice_no,
                        StockCode=stock_code,
                        Quantity=quantity,
                        UnitPrice=unit_price,
                    )
                )

            orders.append(
                Orders(
                    ID=order_id,
                    InvoiceNo=invoice_no,
                    InvoiceDate=invoice_date,
                    CustomerID=customer_id,
                    Total=round(total, 2),
                )
            )
            invoice_sequence += 1

    return new_customers, orders, details


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--insert", action="store_true", help="Insert generated data into PostgreSQL.")
    parser.add_argument("--target-year", type=int, help="Year to extend with synthetic orders.")
    parser.add_argument("--target-year-orders", type=int, help="Target total orders for target year.")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.target_year and args.target_year_orders:
            year_start = datetime(args.target_year, 1, 1)
            year_end = datetime(args.target_year, 12, 31, 23, 59, 59)
            current_year_orders = db.execute(
                text(
                    """
                    SELECT COUNT(*)
                    FROM orders
                    WHERE "InvoiceDate" >= :start_date
                      AND "InvoiceDate" < :end_date
                    """
                ),
                {
                    "start_date": year_start,
                    "end_date": datetime(args.target_year + 1, 1, 1),
                },
            ).scalar()
            missing_orders = args.target_year_orders - int(current_year_orders or 0)

            if missing_orders <= 0:
                print(
                    f"Year {args.target_year} already has {current_year_orders:,} orders. "
                    f"No additional data required."
                )
                return

            allocations = allocate_orders(
                start_date=year_start,
                end_date=year_end,
                annual_target=missing_orders,
                monthly_weights=get_trend_weights(db, target_year=args.target_year),
            )
            new_customer_count = max(round(missing_orders * 260 / 2121), 1)
        else:
            existing_synthetic = (
                db.query(func.count(Orders.ID))
                .filter(Orders.InvoiceNo.like(f"{SYNTHETIC_INVOICE_PREFIX}%"))
                .scalar()
            )
            if existing_synthetic:
                raise RuntimeError(
                    f"Found {existing_synthetic} existing synthetic orders with prefix "
                    f"{SYNTHETIC_INVOICE_PREFIX}. Stop to avoid duplicate data."
                )

            latest_date = db.query(func.max(Orders.InvoiceDate)).scalar()
            if not latest_date:
                raise RuntimeError("Cannot find latest InvoiceDate from orders table.")

            start_date = latest_date + timedelta(days=1)
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            if start_date > END_DATE:
                raise RuntimeError("Latest data is already beyond the target end date.")

            allocations = allocate_orders(
                start_date=start_date,
                end_date=END_DATE,
                annual_target=ANNUAL_TRANSACTION_TARGET,
                monthly_weights=get_monthly_weights(db),
            )
            new_customer_count = 260

        if args.target_year == 2010:
            profile = "2010_growth"
        elif args.target_year == 2013:
            profile = "2013_recovery"
        elif args.target_year == 2014:
            profile = "2014_black_friday"
        else:
            profile = None
        new_customers, orders, details = build_orders(
            db,
            allocations,
            new_customer_count=new_customer_count,
            profile=profile,
        )
        total_revenue = sum(order.Total for order in orders)

        print(f"Date range       : {allocations[0]['start'].date()} to {allocations[-1]['end'].date()}")
        print(f"Orders generated : {len(orders):,}")
        print(f"Details generated: {len(details):,}")
        print(f"New customers    : {len(new_customers):,}")
        print(f"Products added   : 0")
        print(f"Revenue generated: ${total_revenue:,.0f}")
        print("Monthly orders   :")
        monthly_counts = Counter(month_key(order.InvoiceDate) for order in orders)
        for key in sorted(monthly_counts):
            print(f"  {key}: {monthly_counts[key]:,}")

        if not args.insert:
            print("Dry run only. Run with --insert to write data.")
            return

        db.add_all(new_customers)
        db.add_all(orders)
        db.flush()
        db.add_all(details)
        db.commit()
        print("Insert completed.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
