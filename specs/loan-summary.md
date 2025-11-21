# Loan Summary Specification

## Overview

The Loan Summary provides a comprehensive financial overview of a fixed-to-floating rate loan, including total amounts paid, remaining balances, interest breakdowns, and accrued unpaid interest. It aggregates data from the payment schedule and actual payment records to give borrowers clear visibility into their loan status.

## Purpose

- Provide a high-level financial summary of the loan
- Track total payments made (principal and interest)
- Show remaining outstanding balance
- Break down interest costs by fixed and floating periods
- Display unpaid accrued interest up to the current date
- Help borrowers understand the total cost of their loan

## Data Structure

### LoanSummary Interface

```typescript
interface LoanSummary {
  totalInterestPaid: number; // Total interest paid across all payments
  totalPrincipalPaid: number; // Total principal paid across all payments
  totalAmountPaid: number; // Sum of interest and principal paid
  remainingBalance: number; // Outstanding principal balance
  fixedPeriodInterest: number; // Interest paid during fixed rate period
  floatingPeriodInterest: number; // Interest paid during floating rate period
  numberOfPayments: number; // Total number of scheduled payments
  actualPaymentsMade?: number; // Number of actual payments made (optional)
  totalPrepaymentFees?: number; // Total fees paid for prepayments (optional)
  unpaidAccruedInterest?: number; // Interest accrued but not yet paid (optional)
}
```

## Calculation Logic

### 1. Total Interest Paid

Sum of all interest amounts from **actual payments** recorded in the database:

```
totalInterestPaid = Σ(interestPaid for each actual payment in database)
```

**Note:** This represents the **actual** interest paid based on real payment records, not scheduled interest. If no payments have been made, this will be 0.

### 2. Total Principal Paid

Sum of all principal amounts from **actual payments** recorded in the database:

```
totalPrincipalPaid = Σ(principalPaid for each actual payment in database)
```

**Note:** This represents the **actual** principal paid based on real payment records, not scheduled principal. If no payments have been made, this will be 0.

### 3. Total Amount Paid

Simple sum of principal and interest:

```
totalAmountPaid = totalInterestPaid + totalPrincipalPaid
```

### 4. Remaining Balance

The principal remaining after all actual payments have been applied:

```
remainingBalance = principal - totalPrincipalPaid
```

**Calculation:**

1. Start with original principal
2. Subtract total principal paid from all actual payments
3. Ensure balance is not negative (minimum 0)

If all payments are complete and loan is paid off, this should be 0 or very close to 0 (< 0.01).

### 5. Fixed Period Interest

Sum of interest from **actual payments** made during the fixed rate period:

```
fixedPeriodInterest = Σ(interestPaid for each actual payment where payment date <= end of fixed period)
```

**Calculation:**

1. Find actual payments made during fixed period (before `fixedPeriodMonths` from start date)
2. Sum the `interestPaid` from those payments

### 6. Floating Period Interest

Sum of interest from **actual payments** made during the floating rate period:

```
floatingPeriodInterest = Σ(interestPaid for each actual payment where payment date > end of fixed period)
```

**Calculation:**

1. Find actual payments made during floating period (after `fixedPeriodMonths` from start date)
2. Sum the `interestPaid` from those payments

**Validation:**

```
fixedPeriodInterest + floatingPeriodInterest = totalInterestPaid
```

### 7. Number of Payments

Total count of scheduled payment items:

```
numberOfPayments = schedule.length
```

### 8. Unpaid Accrued Interest

Total unpaid interest accured of the loan.

#### Calculation Steps:

1. Calculate the sum of daily interest since the start of the loan.
2. Substract by the total interest paid to date.

Unpaid Accrued Interest Formula:

```unpaidAccruedInterest = totalAccruedInterest - totalInterestPaid
totalAccruedInterest = Σ(dailyInterest for each day since the start of the loan up to today)
```

#### Daily Interest Formula:

```
anualInterestRate = (current interest rate based on fixed/floating period)
dailyInterestRate = (annualInterestRate / 100) / 365
remainingPricipal_of_the_day = principal - totalPrincipalPaid up to that day
dailyInterest = remainingPricipal_of_the_day × dailyInterestRate
```

## Display Format

The loan summary is typically displayed in a dashboard format with the following sections:

### Primary Metrics (Card Grid)

1. **Total Amount Paid**

   - Value: `formatCurrency(totalAmountPaid)`
   - Subtitle: "Principal + Interest"
   - Color: Blue theme

2. **Total Principal Paid**

   - Value: `formatCurrency(totalPrincipalPaid)`
   - Subtitle: "{numberOfPayments} payments"
   - Color: Green theme

3. **Total Interest Paid**

   - Value: `formatCurrency(totalInterestPaid)`
   - Subtitle: "{percentage}% of principal"
   - Color: Red theme
   - Percentage calculation: `(totalInterestPaid / totalPrincipalPaid) × 100`

4. **Remaining Balance**

   - Value: `formatCurrency(remainingBalance)`
   - Subtitle: "Fully paid" or "Outstanding"
   - Color: Purple theme

5. **Unpaid Accrued Interest** (if > 0)
   - Value: `formatCurrency(unpaidAccruedInterest)`
   - Subtitle: "Accumulated to today"
   - Color: Orange theme
   - Only displayed if `unpaidAccruedInterest > 0`

### Period Breakdown (Two Column Layout)

1. **Fixed Rate Period**

   - Number of Payments: count of payments with `rateType === 'fixed'`
   - Interest Paid: `formatCurrency(fixedPeriodInterest)`

2. **Floating Rate Period**
   - Number of Payments: count of payments with `rateType === 'floating'`
   - Interest Paid: `formatCurrency(floatingPeriodInterest)`

### Visual Interest Breakdown

A horizontal bar chart showing the proportion of interest paid in each period:

- **Fixed Period**: `(fixedPeriodInterest / totalInterestPaid) × 100%`
- **Floating Period**: `(floatingPeriodInterest / totalInterestPaid) × 100%`

## Usage Example

```typescript
import {
  calculateLoanSummary,
  generatePaymentSchedule,
} from "@/lib/loanCalculations";

const params: LoanParams = {
  principal: 100000,
  fixedRate: 5.0,
  floatingRate: 6.5,
  fixedPeriodMonths: 60,
  totalTermMonths: 240,
  startDate: new Date("2024-01-01"),
  paymentFrequency: "monthly",
};

// Generate schedule
const schedule = generatePaymentSchedule(params);

// Calculate summary
const summary = calculateLoanSummary(schedule, params, payments);

// Display summary
console.log(`Total Interest: ${formatCurrency(summary.totalInterestPaid)}`);
console.log(`Remaining Balance: ${formatCurrency(summary.remainingBalance)}`);
console.log(
  `Unpaid Accrued: ${formatCurrency(summary.unpaidAccruedInterest || 0)}`
);
```

## Business Rules

1. **All monetary values are in USD** and formatted with 2 decimal places
2. **Interest is always calculated first** before principal in payment allocation
3. **The summary reflects ACTUAL payments made**, not scheduled payments
4. **Unpaid accrued interest is calculated using daily interest** for precision
5. **Prepayments reduce the principal balance** immediately and affect future interest calculations
6. **The period (fixed vs floating) is determined by the payment date** relative to the fixed period end date

## Edge Cases

### Loan Not Yet Started

- If `startDate > today`: All values should be 0 or initial amounts
- No unpaid accrued interest

### Loan Fully Paid

- `remainingBalance` should be 0 or < 0.01
- `unpaidAccruedInterest` should be 0
- All scheduled payments should have matching actual payments

### No Payments Made

- `totalInterestPaid` and `totalPrincipalPaid` from schedule show what is expected
- `unpaidAccruedInterest` shows interest from start date to today
- `remainingBalance` equals original principal

### Prepayments Made

- Principal paid faster than scheduled
- Future scheduled payments may show as "covered" by prepayments
- Interest is recalculated on lower balances going forward

## Dependencies

- **Payment Schedule**: Must be generated first using `generatePaymentSchedule()`
- **Loan Parameters**: Required for calculating unpaid accrued interest
- **Payment Records**: Optional, used for calculating actual vs scheduled differences
- **Date Functions**: Uses `calculateDailyInterest()` for accrual calculations

## Validation Rules

1. `totalAmountPaid = totalInterestPaid + totalPrincipalPaid`
2. `totalInterestPaid = fixedPeriodInterest + floatingPeriodInterest`
3. `remainingBalance ≥ 0`
4. `unpaidAccruedInterest ≥ 0`
5. `numberOfPayments > 0`
6. All monetary values should be rounded to 2 decimal places for display

## Future Enhancements

- **Actual vs Scheduled Comparison**: Show difference between scheduled and actual payments
- **Prepayment Fee Tracking**: Add `totalPrepaymentFees` to the summary
- **Payment Progress**: Add `actualPaymentsMade` to track completion percentage
- **Interest Rate Impact**: Show how rate changes affected total interest
- **Payoff Date**: Estimated loan payoff date based on current payment behavior
- **Savings from Prepayments**: Calculate interest saved through prepayments
