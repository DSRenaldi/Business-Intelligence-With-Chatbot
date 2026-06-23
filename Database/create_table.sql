CREATE TABLE customer(
"ID" INT PRIMARY KEY,
"CustomerID" VARCHAR(10) UNIQUE,
"Country" VARCHAR(255)
);

CREATE TABLE product(
"ID" INT PRIMARY KEY,
"StockCode" VARCHAR(20) UNIQUE,
"Description" VARCHAR(255),
"UnitPrice" REAL
);

CREATE TABLE orders(
"ID" INT PRIMARY KEY,
"InvoiceNo" VARCHAR(20) UNIQUE,
"InvoiceDate" TIMESTAMP,
"CustomerID" VARCHAR(10),
"Total" REAL,
FOREIGN KEY ("CustomerID") REFERENCES customer("CustomerID") ON DELETE CASCADE
);

CREATE TABLE detail_order(
"ID" INT PRIMARY KEY,
"InvoiceNo" VARCHAR(20),
"StockCode" VARCHAR(20),
"Quantity" INT,
"UnitPrice" REAL,
FOREIGN KEY ("InvoiceNo") REFERENCES orders("InvoiceNo") ON DELETE CASCADE,
FOREIGN KEY ("StockCode") REFERENCES product("StockCode") ON DELETE CASCADE
);