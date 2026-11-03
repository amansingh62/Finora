-- CreateEnum
CREATE TYPE "StockCategoryKey" AS ENUM ('NIFTY_50', 'SENSEX', 'BANK_NIFTY', 'MID_CAP', 'SMALL_CAP', 'LARGE_CAP');

-- AlterEnum
ALTER TYPE "BankName" ADD VALUE 'PNB';

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange" TEXT NOT NULL DEFAULT 'NSE',
    "sector" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketQuote" (
    "id" TEXT NOT NULL,
    "currentPrice" DECIMAL(20,6) NOT NULL,
    "open" DECIMAL(20,6) NOT NULL,
    "high" DECIMAL(20,6) NOT NULL,
    "low" DECIMAL(20,6) NOT NULL,
    "previousClose" DECIMAL(20,6) NOT NULL,
    "volume" BIGINT NOT NULL,
    "marketCapt" DECIMAL(24,2),
    "peRatio" DECIMAL(12,4),
    "eps" DECIMAL(12,4),
    "dividendYeild" DECIMAL(12,4),
    "asOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stockId" TEXT NOT NULL,

    CONSTRAINT "MarketQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockCategory" (
    "id" TEXT NOT NULL,
    "key" "StockCategoryKey" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockCategoryMembership" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockCategoryMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stock_symbol_key" ON "Stock"("symbol");

-- CreateIndex
CREATE INDEX "Stock_name_idx" ON "Stock"("name");

-- CreateIndex
CREATE INDEX "Stock_sector_idx" ON "Stock"("sector");

-- CreateIndex
CREATE INDEX "Stock_exchange_isActive_idx" ON "Stock"("exchange", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MarketQuote_stockId_key" ON "MarketQuote"("stockId");

-- CreateIndex
CREATE INDEX "MarketQuote_updatedAt_idx" ON "MarketQuote"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockCategory_key_key" ON "StockCategory"("key");

-- CreateIndex
CREATE INDEX "StockCategoryMembership_categoryId_idx" ON "StockCategoryMembership"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "StockCategoryMembership_stockId_categoryId_key" ON "StockCategoryMembership"("stockId", "categoryId");

-- AddForeignKey
ALTER TABLE "MarketQuote" ADD CONSTRAINT "MarketQuote_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCategoryMembership" ADD CONSTRAINT "StockCategoryMembership_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCategoryMembership" ADD CONSTRAINT "StockCategoryMembership_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "StockCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
