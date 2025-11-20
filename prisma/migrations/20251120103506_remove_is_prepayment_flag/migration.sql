/*
  Warnings:

  - You are about to drop the column `isPrepayment` on the `Payment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanId" TEXT NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "paymentAmount" REAL NOT NULL,
    "principalPaid" REAL NOT NULL,
    "interestPaid" REAL NOT NULL,
    "prepaymentFee" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("createdAt", "id", "interestPaid", "loanId", "notes", "paymentAmount", "paymentDate", "prepaymentFee", "principalPaid", "updatedAt") SELECT "createdAt", "id", "interestPaid", "loanId", "notes", "paymentAmount", "paymentDate", "prepaymentFee", "principalPaid", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
