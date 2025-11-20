-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "principal" REAL NOT NULL,
    "fixedRate" REAL NOT NULL,
    "floatingRate" REAL NOT NULL,
    "fixedPeriodMonths" INTEGER NOT NULL,
    "totalTermMonths" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "paymentFrequency" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
