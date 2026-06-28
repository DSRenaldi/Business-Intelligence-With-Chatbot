from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Float
from sqlalchemy import DateTime

from database.database import Base


class Customer(Base):
    __tablename__ = "customer"

    ID = Column(Integer, primary_key=True)

    CustomerID = Column(String)
    Country = Column(String)


class Orders(Base):
    __tablename__ = "orders"

    ID = Column(Integer, primary_key=True)

    InvoiceNo = Column(String)
    InvoiceDate = Column(DateTime)
    CustomerID = Column(String)
    Total = Column(Float)


class Product(Base):
    __tablename__ = "product"

    ID = Column(Integer, primary_key=True)

    StockCode = Column(String)
    Description = Column(String)
    UnitPrice = Column(Float)


class DetailOrder(Base):
    __tablename__ = "detail_order"

    ID = Column(Integer, primary_key=True)

    InvoiceNo = Column(String)
    StockCode = Column(String)

    Quantity = Column(Integer)
    UnitPrice = Column(Float)