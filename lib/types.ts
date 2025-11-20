export interface LoanParams {
  principal: number;
  fixedRate: number; // Annual rate as percentage
  floatingRate: number; // Annual rate as percentage
  fixedPeriodMonths: number;
  totalTermMonths: number;
  startDate: Date;
  paymentFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
}

export interface PaymentScheduleItem {
  paymentNumber: number;
  paymentDate: Date;
  openingBalance: number;
  interestAmount: number;
  principalAmount: number;
  totalPayment: number;
  closingBalance: number;
  interestRate: number;
  rateType: 'fixed' | 'floating';
}

export interface LoanSummary {
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  totalAmountPaid: number;
  remainingBalance: number;
  fixedPeriodInterest: number;
  floatingPeriodInterest: number;
  numberOfPayments: number;
}
