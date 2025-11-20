Prepay is principal paid ahead of schedule.

**Key Points:**

1. **Reduces Principal**: Prepayments reduce outstanding principal, lowering future interest calculations. Future scheduled payment principals are reduced by the prepaid amount.
   - Example: Scheduled principal is $1000. If borrower pays $1500, next scheduled principal becomes $500. If they pay $500, next scheduled principal is $0, then $500 the following month.
   - **Loan Completion**: When all future scheduled principals reach $0, the loan is considered paid off.

2. **Prepayment Limits**: The maximum prepayment amount is the remaining principal balance. Borrowers cannot overpay beyond the outstanding principal.

3. **Prepayment Fee**: Applied only to the prepayment portion, not the full payment. Fee is calculated as `prepayment_amount × fee_rate`, independent of principal balance before or after the payment.
   - Example: $2000 payment when scheduled is $1500 with 2% fee = $10 fee on $500 prepayment ($500 × 2%).

4. **Interest Calculation**: Interest is calculated daily and accumulated monthly.
   - Daily rate = annual_interest_rate / 365
   - Monthly interest = Σ(daily_rate × principal_balance_on_that_day) for all days in the month
   - Prepayments reduce principal immediately, affecting daily interest calculations from the next day forward through the remainder of the current period and all future periods.

5. **Loan Term**: Unchanged. Prepayments apply to future scheduled payments, potentially finishing the loan early but not shortening the term.
   - Example: $3000 remaining, 3 payments of $1500 each (Principal: $1000 each).
     - Pay $1500 now → Next payment principal: $0, following payment: $500, final payment: $1000