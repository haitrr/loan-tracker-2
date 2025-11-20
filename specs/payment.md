# Payment

A payment is an amount of money paid towards a loan.

## Payment Application Priority

When a payment is made, it is applied in the following order:

1. **Interest** - Accrued interest is paid first
2. **Prepayment Fee** - Any applicable prepayment fees (if applicable)
3. **Principal** - Remaining amount goes towards principal (scheduled principal + any prepayment amount)



## Properties
- `amount`: Total payment amount
- `date`: Date of payment
- `loanId`: Identifier of the loan the payment is applied to
- `notes`: Optional notes about the payment