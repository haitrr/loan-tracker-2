-- CreateTable
CREATE TABLE "ScheduledPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanId" TEXT NOT NULL,
    "paymentNumber" INTEGER NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "scheduledPrincipalAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduledPayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledPayment_loanId_paymentNumber_key" ON "ScheduledPayment"("loanId", "paymentNumber");
