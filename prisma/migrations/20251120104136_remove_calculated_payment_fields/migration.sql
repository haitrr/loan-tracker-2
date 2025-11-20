/*
  Warnings:

  - You are about to drop the column `interestPaid` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `prepaymentFee` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `principalPaid` on the `Payment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanId" TEXT NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "paymentAmount" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("createdAt", "id", "loanId", "notes", "paymentAmount", "paymentDate", "updatedAt") SELECT "createdAt", "id", "loanId", "notes", "paymentAmount", "paymentDate", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
