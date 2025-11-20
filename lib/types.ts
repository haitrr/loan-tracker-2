export interface LoanParams {
  principal: number;
  fixedRate: number; // Annual rate as percentage
  floatingRate: number; // Annual rate as percentage
  fixedPeriodMonths: number;
  totalTermMonths: number;
  startDate: Date;
  paymentFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  prepaymentFeePercentage?: number; // Percentage fee for prepayments (e.g., 2 means 2%)
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
  actualPayment?: Payment; // Track if this payment was actually made
}

export interface Payment {
  id?: string;
  loanId: string;
  paymentDate: Date;
  paymentAmount: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoanSummary {
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  totalAmountPaid: number;
  remainingBalance: number;
  fixedPeriodInterest: number;
  floatingPeriodInterest: number;
  numberOfPayments: number;
  actualPaymentsMade?: number;
  totalPrepaymentFees?: number;
  unpaidAccruedInterest?: number;
}
