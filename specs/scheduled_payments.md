## Scheduled Payment Structure

A scheduled payment includes:
- **Scheduled payment date**: Same day each month as the start date
- **Scheduled principal amount**: Principal ÷ number of payments

These are stored in the database and can be adjusted later.

## What Happens at the Scheduled Payment Date?

- `PayablePrincipal` += `scheduledPrincipal`
- `PayableInterest` += accrued interest since last scheduled payment date