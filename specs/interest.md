# Interest Calculation Specification

## Overview

Interest is calculated on a **daily accrual basis** and accumulated monthly. This means interest accrues every day based on the current principal balance, and the total accrued interest for the month is charged at the end of each payment period.

## Calculation Method

### Daily Interest Rate

The daily interest rate is derived from the annual interest rate:

```
daily_rate = annual_interest_rate / 365
```

- `annual_interest_rate`: The APR (Annual Percentage Rate) expressed as a decimal (e.g., 5% = 0.05)
- Division by 365 assumes a standard calendar year (not a banking year of 360 days)

### Monthly Interest Accumulation

Interest for a payment period is the sum of daily interest charges across all days in that period:

```
monthly_interest = Σ(daily_rate × principal_balance_on_that_day)
```

Where:
- The sum is calculated for each day from the start of the period to the payment due date
- `principal_balance_on_that_day` is the outstanding principal balance at the beginning of that day
- If the principal balance changes mid-period (due to prepayment), the new balance is used for subsequent days

### Example

**Loan Details:**
- Principal: $10,000
- Annual Interest Rate: 6% (0.06)
- Payment Period: 30 days

**Calculation:**
```
daily_rate = 0.06 / 365 = 0.000164384

monthly_interest = 0.000164384 × $10,000 × 30 days
                 = $49.32 (rounded to nearest cent)
```

## Impact of Prepayments

When a prepayment is made during a payment period:

1. **Interest accrues on the original principal** for all days **up to and including** the prepayment date
2. **Interest accrues on the reduced principal** for all days **after** the prepayment date through the end of the period
3. The reduced principal balance is used for calculating interest in all **future periods**

### Prepayment Example

**Loan Details:**
- Principal: $10,000
- Annual Interest Rate: 6% (0.06)
- Payment Period: 30 days
- Prepayment: $2,000 made on day 15

**Calculation:**
```
daily_rate = 0.06 / 365 = 0.000164384

Interest for days 1-15:
  = 0.000164384 × $10,000 × 15 days
  = $24.66

Interest for days 16-30:
  = 0.000164384 × $8,000 × 15 days
  = $19.73

Total monthly interest = $24.66 + $19.73 = $44.39
```

## Payment Application Order

When a payment is received, it is applied in the following order:

1. **Interest** (accrued interest for the period)
2. **Prepayment Fee** (if applicable, calculated on prepayment amount only)
3. **Principal** (scheduled principal + any prepayment amount)

This ensures that interest charges are always satisfied first before reducing the principal balance.

## Interest on Outstanding Balances

If a borrower misses a payment or pays less than the scheduled amount:

- Interest continues to accrue daily on the full outstanding principal balance
- Unpaid interest from previous periods does **not** compound (no interest on interest)
- Interest is always calculated as: `daily_rate × current_principal_balance`

## Rounding

All interest calculations should be rounded to **two decimal places** (nearest cent) using standard rounding rules (0.5 rounds up).
