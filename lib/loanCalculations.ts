import { LoanParams, PaymentScheduleItem, LoanSummary } from './types';

/**
 * Get the number of payments per year based on frequency
 */
export function getPaymentsPerYear(frequency: string): number {
  switch (frequency) {
    case 'monthly':
      return 12;
    case 'quarterly':
      return 4;
    case 'semi-annual':
      return 2;
    case 'annual':
      return 1;
    default:
      return 12;
  }
}

/**
 * Calculate the periodic interest rate from annual rate
 */
export function getPeriodicRate(annualRate: number, paymentsPerYear: number): number {
  return annualRate / 100 / paymentsPerYear;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Calculate the months between payments based on frequency
 */
export function getMonthsBetweenPayments(frequency: string): number {
  return 12 / getPaymentsPerYear(frequency);
}

/**
 * Calculate EMI (Equated Monthly Installment) for a given principal, rate, and term
 * This uses the standard EMI formula for reducing balance loans
 */
export function calculateEMI(
  principal: number,
  periodicRate: number,
  numberOfPayments: number
): number {
  if (periodicRate === 0) {
    return principal / numberOfPayments;
  }
  
  const emi =
    (principal * periodicRate * Math.pow(1 + periodicRate, numberOfPayments)) /
    (Math.pow(1 + periodicRate, numberOfPayments) - 1);
  
  return emi;
}

/**
 * Generate complete payment schedule for a fixed-to-floating rate loan
 */
export function generatePaymentSchedule(params: LoanParams): PaymentScheduleItem[] {
  const schedule: PaymentScheduleItem[] = [];
  const paymentsPerYear = getPaymentsPerYear(params.paymentFrequency);
  const monthsBetweenPayments = getMonthsBetweenPayments(params.paymentFrequency);
  
  // Calculate total number of payments
  const totalPayments = Math.ceil(params.totalTermMonths / monthsBetweenPayments);
  
  // Calculate when the rate switches from fixed to floating
  const fixedPeriodPayments = Math.floor(params.fixedPeriodMonths / monthsBetweenPayments);
  
  let currentBalance = params.principal;
  let currentDate = new Date(params.startDate);
  
  // Calculate EMI for fixed period
  const fixedPeriodicRate = getPeriodicRate(params.fixedRate, paymentsPerYear);
  const fixedEMI = calculateEMI(params.principal, fixedPeriodicRate, totalPayments);
  
  for (let i = 0; i < totalPayments && currentBalance > 0.01; i++) {
    const isFixedPeriod = i < fixedPeriodPayments;
    const currentRate = isFixedPeriod ? params.fixedRate : params.floatingRate;
    const periodicRate = getPeriodicRate(currentRate, paymentsPerYear);
    
    // For floating period, recalculate EMI with remaining balance and payments
    let emi: number;
    if (isFixedPeriod) {
      emi = fixedEMI;
    } else {
      // Recalculate EMI at the start of floating period
      if (i === fixedPeriodPayments) {
        const remainingPayments = totalPayments - i;
        emi = calculateEMI(currentBalance, periodicRate, remainingPayments);
      } else {
        // Use the EMI calculated at the start of floating period
        const remainingPayments = totalPayments - fixedPeriodPayments;
        const balanceAtFloatingStart = schedule[fixedPeriodPayments - 1]?.closingBalance || currentBalance;
        emi = calculateEMI(balanceAtFloatingStart, periodicRate, remainingPayments);
      }
    }
    
    // Calculate interest for this period
    const interestAmount = currentBalance * periodicRate;
    
    // Calculate principal payment
    let principalAmount = emi - interestAmount;
    
    // Adjust for final payment
    if (principalAmount > currentBalance) {
      principalAmount = currentBalance;
    }
    
    const totalPayment = interestAmount + principalAmount;
    const closingBalance = currentBalance - principalAmount;
    
    schedule.push({
      paymentNumber: i + 1,
      paymentDate: new Date(currentDate),
      openingBalance: currentBalance,
      interestAmount,
      principalAmount,
      totalPayment,
      closingBalance: Math.max(0, closingBalance),
      interestRate: currentRate,
      rateType: isFixedPeriod ? 'fixed' : 'floating',
    });
    
    currentBalance = closingBalance;
    currentDate = addMonths(currentDate, monthsBetweenPayments);
  }
  
  return schedule;
}

/**
 * Calculate loan summary statistics
 */
export function calculateLoanSummary(schedule: PaymentScheduleItem[]): LoanSummary {
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let fixedPeriodInterest = 0;
  let floatingPeriodInterest = 0;
  
  schedule.forEach((payment) => {
    totalInterestPaid += payment.interestAmount;
    totalPrincipalPaid += payment.principalAmount;
    
    if (payment.rateType === 'fixed') {
      fixedPeriodInterest += payment.interestAmount;
    } else {
      floatingPeriodInterest += payment.interestAmount;
    }
  });
  
  const lastPayment = schedule[schedule.length - 1];
  
  return {
    totalInterestPaid,
    totalPrincipalPaid,
    totalAmountPaid: totalInterestPaid + totalPrincipalPaid,
    remainingBalance: lastPayment?.closingBalance || 0,
    fixedPeriodInterest,
    floatingPeriodInterest,
    numberOfPayments: schedule.length,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Format percentage for display
 */
export function formatPercentage(rate: number): string {
  return `${rate.toFixed(2)}%`;
}
