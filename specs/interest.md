Total unpaid interest accured of the loan.

#### Calculation Steps:

1. Calculate the sum of daily interest since the start of the loan.
2. Substract by the total interest paid to date.

Unpaid Accrued Interest Formula:
Unpaid Accrued Interest up to currentDate

```
totalInterestPaidUpToCurrentDate = Σ(payment.interestPaid for each actual payment where payment date <= currentDate)
totalAccruedInterestUpToCurrentDate = Σ(dayInterest for each day since the start of the loan up to today)
unpaidAccruedInterest = totalAccruedInterestUpToCurrentDate - totalInterestPaidUpToCurrentDate
```

#### Day Interest Formula:
How to calculate interest of currentDate:
```
anualInterestRate = loanParams.fixedRate if currentDate <= end else loanParams.floatingRate
dailyInterestRate = (annualInterestRate / 100) / 365
remainingPricipalUpToCurrentDate = loanParams.principal - totalPrincipalPaidUpToCurrentDate
dayInterest = remainingPricipalUpToCurrentDate × dailyInterestRate
```
