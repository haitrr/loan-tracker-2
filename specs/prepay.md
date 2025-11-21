Prepay is principal paid ahead of schedule.

**Key Points:**

Scheduled pricipal pay up to a day:
```
schedulePrincipalPayPerMonth = totalPrincipal / loanTermMonths
scheduledPrincipalToDate = schedulePrincipalPayPerMonth × numberOfMonthsElapsed (round down)
amountOfScheduledPrincipalPayable = scheduledPrincipalToDate - Σ(principalPaid for all payments made up to today)
```
for each payment made:
```
interestPaid = min(payment.amount, accruedInterestToDate) // see: Unpaid Accrued Interest in loan-summary.md
remainingAmount = payment.amount - interestPaid
principalPaid = remainingAmount / (1 + prepaymentFeePercentage)
prepayFee = remainingAmount - principalPaid
```