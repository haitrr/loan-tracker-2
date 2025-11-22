export type PaymentStatus = 'paid' | 'outstanding' | 'partial-paid' | 'pending';

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

export interface Payment {
  id?: string;
  loanId: string;
  paymentDate: Date;
  paymentAmount: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Enriched fields (calculated)
  principalPaid?: number;
  interestPaid?: number;
  prepaymentFee?: number;
  isPrepayment?: boolean;
}

export interface ScheduledPayment {
  id: string;
  loanId: string;
  paymentNumber: number;
  scheduledDate: Date;
  scheduledPrincipalAmount: number;
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

