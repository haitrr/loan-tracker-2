# Payment

A payment is an amount of money paid towards a loan.

## Payment Application Priority

When a payment is made, it is applied in the following order:

1. **Payable Interest**
2. **Payable Principal**
3. **Prepayment of Principal + prepay fee** (if any amount remains after paying interest and principal)


## Properties
- `amount`: Total payment amount
- `date`: Date of payment
- `loanId`: Identifier of the loan the payment is applied to
- `notes`: Optional notes about the payment