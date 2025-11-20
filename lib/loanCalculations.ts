import { LoanParams, PaymentScheduleItem, LoanSummary, Payment } from './types';

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
 * Calculate daily interest rate from annual rate
 */
export function getDailyInterestRate(annualRate: number): number {
  return annualRate / 100 / 365;
}

/**
 * Calculate interest for a period using daily interest accumulation
 * @param principal - The principal balance
 * @param annualRate - Annual interest rate as percentage
 * @param startDate - Start date of the period
 * @param endDate - End date of the period
 * @param prepayments - Array of prepayments made during the period with {date, amount}
 */
export function calculateDailyInterest(
  principal: number,
  annualRate: number,
  startDate: Date,
  endDate: Date,
  prepayments: Array<{date: Date, amount: number}> = []
): number {
  const dailyRate = getDailyInterestRate(annualRate);
  let totalInterest = 0;
  let currentBalance = principal;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Sort prepayments by date
  const sortedPrepayments = [...prepayments].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  
  let prepaymentIndex = 0;
  
  // Iterate through each day
  for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
    // Apply any prepayments that occurred on this day
    while (
      prepaymentIndex < sortedPrepayments.length &&
      sortedPrepayments[prepaymentIndex].date.setHours(0, 0, 0, 0) <= date.setHours(0, 0, 0, 0)
    ) {
      currentBalance -= sortedPrepayments[prepaymentIndex].amount;
      prepaymentIndex++;
    }
    
    // Calculate interest for this day
    totalInterest += currentBalance * dailyRate;
  }
  
  return totalInterest;
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
 * Calculate loan summary statistics based on ACTUAL payments from database
 */
export function calculateLoanSummary(
  schedule: PaymentScheduleItem[],
  params?: LoanParams,
  payments?: Payment[]
): LoanSummary {
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let fixedPeriodInterest = 0;
  let floatingPeriodInterest = 0;
  
  // If we have actual payments and params, calculate based on actual payments
  if (payments && payments.length > 0 && params) {
    // Enrich payments with breakdown
    const enrichedPayments = enrichPaymentsWithBreakdown(
      payments,
      schedule,
      params.prepaymentFeePercentage || 0
    );
    
    // Calculate end of fixed period date
    const fixedPeriodEndDate = addMonths(
      new Date(params.startDate),
      params.fixedPeriodMonths
    );
    
    // Sum up actual interest and principal paid
    enrichedPayments.forEach((payment) => {
      totalInterestPaid += payment.interestPaid;
      totalPrincipalPaid += payment.principalPaid;
      
      // Determine if payment was made during fixed or floating period
      const paymentDate = new Date(payment.paymentDate);
      if (paymentDate < fixedPeriodEndDate) {
        fixedPeriodInterest += payment.interestPaid;
      } else {
        floatingPeriodInterest += payment.interestPaid;
      }
    });
  }
  
  // Calculate remaining balance
  const remainingBalance = params 
    ? Math.max(0, params.principal - totalPrincipalPaid)
    : (schedule[schedule.length - 1]?.closingBalance || 0);
  
  // Calculate unpaid accrued interest up to today
  let unpaidAccruedInterest: number | undefined;
  if (params && payments) {
    unpaidAccruedInterest = calculateUnpaidAccruedInterest(params, schedule, payments);
  }
  
  return {
    totalInterestPaid,
    totalPrincipalPaid,
    totalAmountPaid: totalInterestPaid + totalPrincipalPaid,
    remainingBalance,
    fixedPeriodInterest,
    floatingPeriodInterest,
    numberOfPayments: schedule.length,
    actualPaymentsMade: payments?.length || 0,
    unpaidAccruedInterest,
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

/**
 * Calculate unpaid accrued interest from the last payment date to today
 */
export function calculateUnpaidAccruedInterest(
  params: LoanParams,
  schedule: PaymentScheduleItem[],
  payments: Payment[]
): number {
  if (payments.length === 0) {
    // If no payments made, calculate from loan start date to today
    const today = new Date();
    const startDate = new Date(params.startDate);
    
    if (today <= startDate) {
      return 0;
    }
    
    // Find the current interest rate based on the period
    const monthsFromStart = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    const currentRate = monthsFromStart < params.fixedPeriodMonths ? params.fixedRate : params.floatingRate;
    
    return calculateDailyInterest(params.principal, currentRate, startDate, today);
  }
  
  // Sort payments by date
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );
  
  const lastPayment = sortedPayments[sortedPayments.length - 1];
  const lastPaymentDate = new Date(lastPayment.paymentDate);
  const today = new Date();
  
  // If last payment is today or in the future, no accrued interest
  if (lastPaymentDate >= today) {
    return 0;
  }
  
  // Find the next scheduled payment after the last payment
  const nextScheduledPayment = schedule.find(item => {
    const scheduleDate = new Date(item.paymentDate);
    return scheduleDate > lastPaymentDate;
  });
  
  if (!nextScheduledPayment) {
    // Loan is paid off or no more scheduled payments
    return 0;
  }
  
  // Calculate remaining balance after last payment
  let remainingBalance = params.principal;
  for (const payment of sortedPayments) {
    // Find corresponding scheduled payment to get interest amount
    const scheduledItem = schedule.find(item => {
      const scheduleDate = new Date(item.paymentDate).setHours(0, 0, 0, 0);
      const paymentDate = new Date(payment.paymentDate).setHours(0, 0, 0, 0);
      const daysDiff = Math.abs(scheduleDate - paymentDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });
    
    const expectedInterest = scheduledItem?.interestAmount || 0;
    const breakdown = calculatePaymentBreakdown(
      payment.paymentAmount,
      expectedInterest,
      remainingBalance
    );
    
    remainingBalance -= breakdown.principalPaid;
  }
  
  if (remainingBalance <= 0) {
    return 0;
  }
  
  // Determine current interest rate
  const currentRate = nextScheduledPayment.interestRate;
  
  // Calculate accrued interest from last payment date to today
  // (but not beyond the next scheduled payment date)
  const nextPaymentDate = new Date(nextScheduledPayment.paymentDate);
  const endDate = today < nextPaymentDate ? today : nextPaymentDate;
  
  return calculateDailyInterest(remainingBalance, currentRate, lastPaymentDate, endDate);
}

/**
 * Calculate prepayment fee based on prepayment amount and fee percentage
 */
export function calculatePrepaymentFee(
  prepaymentAmount: number,
  feePercentage: number
): number {
  return (prepaymentAmount * feePercentage) / 100;
}

/**
 * Recalculate payment schedule after payments have been made
 * This adjusts the schedule based on actual payments and recalculates from the current position
 */
export function recalculateScheduleWithPayments(
  params: LoanParams,
  payments: Payment[]
): PaymentScheduleItem[] {
  // Generate original schedule
  const originalSchedule = generatePaymentSchedule(params);
  
  if (payments.length === 0) {
    return originalSchedule;
  }
  
  // Sort payments by date
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );
  
  // Calculate total prepayment amount (excluding scheduled principal)
  let totalPrepayment = 0;
  let paymentIndex = 0;
  let runningBalance = params.principal;
  
  const adjustedSchedule: PaymentScheduleItem[] = [];
  
  for (let i = 0; i < originalSchedule.length; i++) {
    const scheduledItem = originalSchedule[i];
    const matchingPayment = sortedPayments[paymentIndex];
    
    // Check if this scheduled payment has a matching actual payment
    let actualPayment: Payment | undefined;
    if (matchingPayment && paymentIndex < sortedPayments.length) {
      const scheduleDate = new Date(scheduledItem.paymentDate).setHours(0, 0, 0, 0);
      const paymentDate = new Date(matchingPayment.paymentDate).setHours(0, 0, 0, 0);
      
      // Allow some flexibility in date matching (within 7 days)
      const daysDiff = Math.abs(scheduleDate - paymentDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff <= 7) {
        actualPayment = matchingPayment;
        paymentIndex++;
        
        // Calculate principal paid from payment amount
        const breakdown = calculatePaymentBreakdown(
          matchingPayment.paymentAmount,
          scheduledItem.interestAmount,
          runningBalance
        );
        
        // Calculate prepayment: principal paid minus scheduled principal
        const scheduledPrincipal = scheduledItem.principalAmount;
        const actualPrincipal = breakdown.principalPaid;
        const prepaymentAmount = Math.max(0, actualPrincipal - scheduledPrincipal);
        totalPrepayment += prepaymentAmount;
        
        // Update running balance
        runningBalance -= breakdown.principalPaid;
      }
    }
    
    // Adjust scheduled principal based on accumulated prepayments
    let adjustedPrincipal = scheduledItem.principalAmount;
    if (totalPrepayment > 0) {
      if (totalPrepayment >= scheduledItem.principalAmount) {
        // All principal for this payment covered by prepayment
        totalPrepayment -= scheduledItem.principalAmount;
        adjustedPrincipal = 0;
      } else {
        // Partial coverage
        adjustedPrincipal = scheduledItem.principalAmount - totalPrepayment;
        totalPrepayment = 0;
      }
    }
    
    const adjustedTotal = scheduledItem.interestAmount + adjustedPrincipal;
    
    adjustedSchedule.push({
      ...scheduledItem,
      principalAmount: adjustedPrincipal,
      totalPayment: adjustedTotal,
      actualPayment,
    });
    
    // If all future principals are 0, loan is paid off
    if (adjustedPrincipal === 0 && totalPrepayment === 0 && actualPayment) {
      break;
    }
  }
  
  return adjustedSchedule;
}

/**
 * Calculate remaining balance after payments
 */
export function calculateRemainingBalance(
  principal: number,
  payments: Payment[]
): number {
  const totalPrincipalPaid = payments.reduce(
    (sum, payment) => {
      const breakdown = calculatePaymentBreakdown(payment.paymentAmount, 0, principal - sum);
      return sum + breakdown.principalPaid;
    },
    0
  );
  return Math.max(0, principal - totalPrincipalPaid);
}

/**
 * Calculate payment breakdown (principal, interest, prepayment fee) based on payment amount,
 * expected interest, and remaining balance
 */
export function calculatePaymentBreakdown(
  paymentAmount: number,
  expectedInterest: number,
  remainingBalance: number
): {
  principalPaid: number;
  interestPaid: number;
  prepaymentFee: number;
} {
  if (paymentAmount <= 0) {
    return { principalPaid: 0, interestPaid: 0, prepaymentFee: 0 };
  }

  // Allocate to interest first
  const interestPaid = Math.min(paymentAmount, expectedInterest);
  
  // Remaining amount goes to principal
  let principalPaid = paymentAmount - interestPaid;
  
  // Ensure principal doesn't exceed remaining balance
  principalPaid = Math.min(principalPaid, remainingBalance);

  return {
    principalPaid,
    interestPaid,
    prepaymentFee: 0, // Will be calculated separately if needed
  };
}

/**
 * Calculate prepayment fee for a payment
 */
export function calculatePaymentPrepaymentFee(
  paymentAmount: number,
  scheduledPaymentAmount: number,
  prepaymentFeePercentage: number
): number {
  if (paymentAmount <= scheduledPaymentAmount) {
    return 0;
  }
  
  const prepaymentAmount = paymentAmount - scheduledPaymentAmount;
  return calculatePrepaymentFee(prepaymentAmount, prepaymentFeePercentage);
}

/**
 * Get the next expected payment details based on current schedule and payments
 */
export function getNextExpectedPayment(
  schedule: PaymentScheduleItem[],
  payments: Payment[]
): PaymentScheduleItem | null {
  const scheduleWithPayments = schedule.map(item => {
    const matchingPayment = payments.find(payment => {
      const scheduleDate = new Date(item.paymentDate).setHours(0, 0, 0, 0);
      const paymentDate = new Date(payment.paymentDate).setHours(0, 0, 0, 0);
      const daysDiff = Math.abs(scheduleDate - paymentDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });
    
    return {
      ...item,
      actualPayment: matchingPayment,
    };
  });
  
  // Find first unpaid scheduled payment
  const nextPayment = scheduleWithPayments.find(item => !item.actualPayment);
  return nextPayment || null;
}

/**
 * Calculate enriched payment data with breakdown
 * This adds principalPaid, interestPaid, and prepaymentFee to payment objects
 */
export function enrichPaymentsWithBreakdown(
  payments: Payment[],
  schedule: PaymentScheduleItem[],
  prepaymentFeePercentage: number
): Array<Payment & { principalPaid: number; interestPaid: number; prepaymentFee: number }> {
  // Sort payments by date
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );
  
  let runningBalance = schedule[0]?.openingBalance || 0;
  let scheduleIndex = 0;
  
  return sortedPayments.map(payment => {
    // Find the corresponding scheduled payment
    let scheduledPayment = schedule[scheduleIndex];
    while (scheduledPayment && scheduleIndex < schedule.length) {
      const scheduleDate = new Date(scheduledPayment.paymentDate).setHours(0, 0, 0, 0);
      const paymentDate = new Date(payment.paymentDate).setHours(0, 0, 0, 0);
      const daysDiff = Math.abs(scheduleDate - paymentDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff <= 7) {
        break;
      }
      scheduleIndex++;
      scheduledPayment = schedule[scheduleIndex];
    }
    
    const expectedInterest = scheduledPayment?.interestAmount || 0;
    const scheduledPaymentAmount = scheduledPayment?.totalPayment || 0;
    
    // Calculate breakdown
    const breakdown = calculatePaymentBreakdown(
      payment.paymentAmount,
      expectedInterest,
      runningBalance
    );
    
    // Calculate prepayment fee
    const prepaymentFee = calculatePaymentPrepaymentFee(
      payment.paymentAmount,
      scheduledPaymentAmount,
      prepaymentFeePercentage
    );
    
    // Update running balance
    runningBalance -= breakdown.principalPaid;
    scheduleIndex++;
    
    return {
      ...payment,
      principalPaid: breakdown.principalPaid,
      interestPaid: breakdown.interestPaid,
      prepaymentFee,
    };
  });
}
