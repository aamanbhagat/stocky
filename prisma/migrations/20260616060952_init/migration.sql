-- CreateTable
CREATE TABLE "Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cin" TEXT,
    "isin" TEXT,
    "exchange" TEXT NOT NULL,
    "sector" TEXT,
    "industry" TEXT,
    "marketCap" REAL,
    "currentPrice" REAL,
    "high52" REAL,
    "low52" REAL,
    "peRatio" REAL,
    "pbRatio" REAL,
    "dividendYield" REAL,
    "promoterHolding" REAL,
    "fiHolding" REAL,
    "diHolding" REAL,
    "publicHolding" REAL,
    "description" TEXT,
    "foundedYear" INTEGER,
    "headquarters" TEXT,
    "website" TEXT,
    "listingDate" DATETIME,
    "faceValue" REAL,
    "series" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UpdateLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "job" TEXT NOT NULL,
    "ok" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "notes" TEXT,
    "runAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Company_isin_key" ON "Company"("isin");

-- CreateIndex
CREATE INDEX "Company_sector_idx" ON "Company"("sector");

-- CreateIndex
CREATE INDEX "Company_exchange_idx" ON "Company"("exchange");

-- CreateIndex
CREATE INDEX "Company_symbol_idx" ON "Company"("symbol");

-- CreateIndex
CREATE INDEX "Company_marketCap_idx" ON "Company"("marketCap");
