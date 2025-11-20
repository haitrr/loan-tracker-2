-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanId" TEXT NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "paymentAmount" REAL NOT NULL,
    "principalPaid" REAL NOT NULL,
    "interestPaid" REAL NOT NULL,
    "isPrepayment" BOOLEAN NOT NULL DEFAULT false,
    "prepaymentFee" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "principal" REAL NOT NULL,
    "fixedRate" REAL NOT NULL,
    "floatingRate" REAL NOT NULL,
    "fixedPeriodMonths" INTEGER NOT NULL,
    "totalTermMonths" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "paymentFrequency" TEXT NOT NULL,
    "prepaymentFeePercentage" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Loan" ("createdAt", "fixedPeriodMonths", "fixedRate", "floatingRate", "id", "name", "paymentFrequency", "principal", "startDate", "totalTermMonths", "updatedAt") SELECT "createdAt", "fixedPeriodMonths", "fixedRate", "floatingRate", "id", "name", "paymentFrequency", "principal", "startDate", "totalTermMonths", "updatedAt" FROM "Loan";
DROP TABLE "Loan";
ALTER TABLE "new_Loan" RENAME TO "Loan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
