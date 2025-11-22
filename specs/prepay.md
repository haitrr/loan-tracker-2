# Prepayment

Prepayment is principal paid ahead of the scheduled payment dates.

## When Does Prepayment Occur?

According to the payment application priority (see payment.md), prepayment occurs when:
1. A payment amount exceeds the sum of **Payable Interest** and **Payable Principal**
2. The remaining amount after paying all due interest and principal is applied as prepayment

## Payment Application Flow

When a payment is made, it is applied in the following order:

1. **Payable Interest**: All interest that has become due but not yet paid
2. **Payable Principal**: All scheduled principal that has become due but not yet paid
3. **Prepayment of Principal + Prepay Fee**: Any remaining amount after steps 1 and 2

## Calculating Prepayment Components

When prepayment occurs:
```
prepaymentAmount = remainingAmount / (1 + prepaymentFeePercentage)
prepaymentFee = remainingAmount - prepaymentAmount
```

Where:
- `remainingAmount` = payment amount after paying all Payable Interest and Payable Principal
- `prepaymentFeePercentage` = the prepayment fee rate (if applicable)

## Payable Principal

Payable Principal accumulates at each scheduled payment date:
- On each scheduled payment date, `PayablePrincipal` increases by the `scheduledPrincipal` amount for that date
- Scheduled principal amounts are stored in the ScheduledPayment table (see scheduled_payments.md)
- Total Payable Principal = sum of all scheduled principal amounts that have reached their payment date minus principal already paid