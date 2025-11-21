import { LoanParams, PaymentScheduleItem, LoanSummary, Payment, PaymentStatus } from './types';

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
 * Calculate total accrued interest from loan start up to a specific date
 * Accounts for principal reductions from payments
 * @param upToDate - The date up to which to calculate accrued interest
 * @param loanParams - Loan parameters including start date and rates
 * @param enrichedPayments - Array of payments with breakdown information
 * @param schedule - Payment schedule (first item contains opening balance)
 */
export function calculateTotalAccruedInterest(
  upToDate: Date,
  loanParams: LoanParams,
  enrichedPayments: Array<Payment & { principalPaid: number; interestPaid: number }>,
  schedule: PaymentScheduleItem[]
): number {
  if (enrichedPayments.length === 0) {
    // No payments made yet, calculate from loan start to date
    const startDate = new Date(loanParams.startDate);
    
    if (upToDate <= startDate) {
      return 0;
    }
    
    // Determine current interest rate based on period
    const monthsFromStart = (upToDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    const currentRate = monthsFromStart < loanParams.fixedPeriodMonths ? loanParams.fixedRate : loanParams.floatingRate;
    
    return calculateDailyInterest(loanParams.principal, currentRate, startDate, upToDate);
  }
  
  // Calculate total interest accrued from loan start, accounting for principal reductions
  let totalAccrued = 0;
  let currentBalance = schedule[0]?.openingBalance || 0;
  let lastDate = new Date(loanParams.startDate);
  
  // Add interest accrued during each period between payments
  for (const payment of enrichedPayments) {
    const paymentDate = new Date(payment.paymentDate);
    const fixedPeriodEndDate = addMonths(new Date(loanParams.startDate), loanParams.fixedPeriodMonths);
    const currentRate = paymentDate < fixedPeriodEndDate ? loanParams.fixedRate : loanParams.floatingRate;
    
    // Accrued interest for this period
    const periodInterest = calculateDailyInterest(currentBalance, currentRate, lastDate, paymentDate);
    totalAccrued += periodInterest;
    
    // Reduce balance by principal paid
    currentBalance -= payment.principalPaid;
    lastDate = paymentDate;
  }
  
  // Add interest accrued from last payment to the specified date
  if (upToDate > lastDate) {
    const fixedPeriodEndDate = addMonths(new Date(loanParams.startDate), loanParams.fixedPeriodMonths);
    const currentRate = upToDate < fixedPeriodEndDate ? loanParams.fixedRate : loanParams.floatingRate;
    
    const remainingPeriodInterest = calculateDailyInterest(currentBalance, currentRate, lastDate, upToDate);
    totalAccrued += remainingPeriodInterest;
  }
  
  return totalAccrued;
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
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  // Sort prepayments by date
  const sortedPrepayments = [...prepayments].map(p => {
    const date = new Date(p.date);
    date.setHours(0, 0, 0, 0);
    return { date, amount: p.amount };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
  
  let prepaymentIndex = 0;
  
  // Iterate through each day
  const currentDate = new Date(start);
  while (currentDate < end) {
    const currentDateTimestamp = currentDate.getTime();
    
    // Apply any prepayments that occurred on this day
    while (
      prepaymentIndex < sortedPrepayments.length &&
      sortedPrepayments[prepaymentIndex].date.getTime() <= currentDateTimestamp
    ) {
      currentBalance -= sortedPrepayments[prepaymentIndex].amount;
      prepaymentIndex++;
    }
    
    // Calculate interest for this day
    totalInterest += currentBalance * dailyRate;
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
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
  params: LoanParams,
  payments: Payment[]
): LoanSummary {
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let fixedPeriodInterest = 0;
  let floatingPeriodInterest = 0;
  const toDay = new Date();
  
  // Enrich payments with breakdown
  const enrichedPayments = enrichPaymentsWithBreakdown(
    payments,
    params.prepaymentFeePercentage || 0,
    params
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
  
  // Calculate remaining balance
  const remainingBalance = Math.max(0, params.principal - totalPrincipalPaid);
  
  // Calculate unpaid accrued interest up to today
  const unpaidAccruedInterest = calculateUnpaidInterestUpToDate(toDay, params, enrichedPayments);
  
  return {
    totalInterestPaid,
    totalPrincipalPaid,
    totalAmountPaid: totalInterestPaid + totalPrincipalPaid,
    remainingBalance,
    fixedPeriodInterest,
    floatingPeriodInterest,
    numberOfPayments: schedule.length,
    actualPaymentsMade: payments.length,
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
 * Calculate prepayment fee based on prepayment amount and fee percentage
 */
export function calculatePrepaymentFee(
  prepaymentAmount: number,
  feePercentage: number
): number {
  return (prepaymentAmount * feePercentage) / 100;
}

/**
 * Calculate payment status for each scheduled payment
 * Logic:
 * - "paid": All interest and principal of all prior payments and itself are paid
 * - "outstanding": Any interest or principal from prior payments or itself is unpaid
 * - "partial-paid": For future payments where part or all of principal is prepaid
 * - "pending": Future payment with no payments made
 */
export function calculatePaymentStatus(
  scheduleItem: PaymentScheduleItem,
  allScheduleItems: PaymentScheduleItem[],
  enrichedPayments: Array<Payment & { principalPaid: number; interestPaid: number }>
): PaymentStatus {
  const itemIndex = allScheduleItems.findIndex(s => s.paymentNumber === scheduleItem.paymentNumber);
  const today = new Date();
  const scheduleDate = new Date(scheduleItem.paymentDate);
  const isFuturePayment = scheduleDate > today;
  
  // Get all payments up to this scheduled payment
  const paymentsUpToThis = enrichedPayments.filter(p => {
    return new Date(p.paymentDate) <= scheduleDate;
  });
  
  // Calculate total interest and principal expected up to this payment
  let totalExpectedInterest = 0;
  let totalExpectedPrincipal = 0;
  
  for (let i = 0; i <= itemIndex; i++) {
    totalExpectedInterest += allScheduleItems[i].interestAmount;
    totalExpectedPrincipal += allScheduleItems[i].principalAmount;
  }
  
  // Calculate total interest and principal actually paid
  let totalPaidInterest = 0;
  let totalPaidPrincipal = 0;
  
  paymentsUpToThis.forEach(p => {
    totalPaidInterest += p.interestPaid;
    totalPaidPrincipal += p.principalPaid;
  });
  
  // Check if all interest and principal are paid
  const interestFullyPaid = totalPaidInterest >= totalExpectedInterest - 0.01; // Allow small rounding errors
  const principalFullyPaid = totalPaidPrincipal >= totalExpectedPrincipal - 0.01;
  
  if (interestFullyPaid && principalFullyPaid) {
    return 'paid';
  }
  
  // For future payments, check if partial principal is paid
  if (isFuturePayment) {
    // Check if any principal for this specific payment is prepaid
    const principalPaidForThis = totalPaidPrincipal - (allScheduleItems
      .slice(0, itemIndex)
      .reduce((sum, s) => sum + s.principalAmount, 0));
    
    if (principalPaidForThis > 0.01) {
      return 'partial-paid';
    }
    
    return 'pending';
  }
  
  // Past or current payment that is not fully paid
  return 'outstanding';
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
    return originalSchedule.map(item => ({
      ...item,
      status: 'pending' as PaymentStatus
    }));
  }
  
  // Sort payments by date
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );
  
  // Enrich payments with breakdown
  const enrichedPayments = enrichPaymentsWithBreakdown(
    sortedPayments,
    params.prepaymentFeePercentage || 0,
    params
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
          runningBalance,
          0 // No prepayment fee in this context
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
  
  // Calculate statuses for all schedule items
  const scheduleWithStatus = adjustedSchedule.map((item) => ({
    ...item,
    status: calculatePaymentStatus(item, adjustedSchedule, enrichedPayments)
  }));
  
  return scheduleWithStatus;
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
      const breakdown = calculatePaymentBreakdown(
        payment.paymentAmount,
        0,
        principal - sum,
        0
      );
      return sum + breakdown.principalPaid;
    },
    0
  );
  return Math.max(0, principal - totalPrincipalPaid);
}

/**
 * Calculate payment breakdown (principal, interest, prepayment fee) based on payment amount,
 * expected interest, and remaining balance.
 * Applies payment in order: 1) Interest, 2) Prepayment Fee, 3) Principal
 */
export function calculatePaymentBreakdown(
  paymentAmount: number,
  accruedInterest: number,
  remainingBalance: number,
  prepaymentFeePercentage: number = 0
): {
  principalPaid: number;
  interestPaid: number;
  prepaymentFee: number;
} {
  if (paymentAmount <= 0) {
    return { principalPaid: 0, interestPaid: 0, prepaymentFee: 0 };
  }

  // Step 1: Allocate to accrued interest first
  // interestPaid = min(payment.amount, accruedInterestToDate)
  const interestPaid = Math.min(paymentAmount, accruedInterest);
  
  // Step 2: Calculate remaining amount after interest
  // remainingAmount = payment.amount - interestPaid
  const remainingAmount = paymentAmount - interestPaid;
  
  // Step 3: Calculate principal and prepayment fee from remaining amount
  // principalPaid = remainingAmount / (1 + prepaymentFeePercentage)
  // prepayFee = remainingAmount - principalPaid
  let principalPaid: number;
  let prepaymentFee: number;
  
  if (prepaymentFeePercentage > 0 && remainingAmount > 0) {
    principalPaid = remainingAmount / (1 + prepaymentFeePercentage / 100);
    prepaymentFee = remainingAmount - principalPaid;
  } else {
    principalPaid = remainingAmount;
    prepaymentFee = 0;
  }
  
  // Ensure principal doesn't exceed remaining balance
  if (principalPaid > remainingBalance) {
    principalPaid = remainingBalance;
    // Recalculate prepayment fee if principal was capped
    prepaymentFee = remainingAmount - principalPaid;
  }

  return {
    principalPaid,
    interestPaid,
    prepaymentFee,
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
 * Uses actual accrued interest calculation based on daily interest accumulation
 */
export function enrichPaymentsWithBreakdown(
  payments: Payment[],
  prepaymentFeePercentage: number,
  params: LoanParams
): Array<Payment & { principalPaid: number; interestPaid: number; prepaymentFee: number }> {
  // Sort payments by date
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );

  const enrichedPayments: Array<Payment & { principalPaid: number; interestPaid: number; prepaymentFee: number }> = [];
  
  for (let i = 0; i < sortedPayments.length; i++) {
    const payment = sortedPayments[i];
    const paymentDate = new Date(payment.paymentDate);
    const startDate = i === 0 ? new Date(params.startDate) : new Date(sortedPayments[i - 1].paymentDate);
    
    // Calculate remaining principal at the start of this period
    const totalPrincipalPaidBefore = enrichedPayments.reduce((sum, p) => sum + p.principalPaid, 0);
    const remainingPrincipal = params.principal - totalPrincipalPaidBefore;
    
    console.log(`\n=== Payment ${i + 1} on ${payment.paymentDate} ===`);
    console.log(`Period: ${startDate.toISOString().split('T')[0]} to ${paymentDate.toISOString().split('T')[0]}`);
    console.log(`Total principal paid before: ${totalPrincipalPaidBefore.toFixed(2)}`);
    console.log(`Remaining principal at start: ${remainingPrincipal.toFixed(2)}`);
    console.log(`Payment amount: ${payment.paymentAmount.toFixed(2)}`);
    
    // Determine the interest rate based on fixed/floating period
    const fixedPeriodEndDate = addMonths(new Date(params.startDate), params.fixedPeriodMonths);
    const currentRate = paymentDate < fixedPeriodEndDate ? params.fixedRate : params.floatingRate;
    
    console.log(`Interest rate: ${currentRate}% (${paymentDate < fixedPeriodEndDate ? 'fixed' : 'floating'})`);
    
    // Calculate accrued interest using daily interest calculation
    // No prepayments within this period since we process payments sequentially
    const accruedInterest = calculateUnpaidInterestUpToDate(
      new Date(payment.paymentDate),
      params,
      enrichedPayments
    );
    
    console.log(`Accrued interest for period: ${accruedInterest.toFixed(2)}`);
    
    // Calculate breakdown with proper payment application order
    const breakdown = calculatePaymentBreakdown(
      payment.paymentAmount,
      accruedInterest,
      remainingPrincipal,
      prepaymentFeePercentage
    );
    
    console.log(`Breakdown - Interest: ${breakdown.interestPaid.toFixed(2)}, Principal: ${breakdown.principalPaid.toFixed(2)}, Fee: ${breakdown.prepaymentFee.toFixed(2)}`);
    
    enrichedPayments.push({
      ...payment,
      principalPaid: breakdown.principalPaid,
      interestPaid: breakdown.interestPaid,
      prepaymentFee: breakdown.prepaymentFee,
    });
  }
  
  return enrichedPayments;
}

/**
 * Calculate unpaid accrued interest up to a specific date according to interest.md spec
 * @param upToDate - The date up to which to calculate unpaid interest
 * @param loanParams - Loan parameters including start date and rates
 * @param payments - Array of actual payments made
 * @returns The unpaid accrued interest amount
 */
export function calculateUnpaidInterestUpToDate(
  upToDate: Date,
  loanParams: LoanParams,
  payments: Payment[]
): number {
  console.log(`\nCalculating unpaid accrued interest up to `, upToDate, payments);
  // Calculate total interest paid up to current date
  const totalInterestPaidUpToCurrentDate = payments
    .filter(payment => new Date(payment.paymentDate) <= upToDate)
    .reduce((sum, payment) => sum + (payment.interestPaid || 0), 0);
  
  // Calculate total accrued interest from loan start to current date
  const startDate = new Date(loanParams.startDate);
  const fixedPeriodEndDate = addMonths(startDate, loanParams.fixedPeriodMonths);
  
  let totalAccruedInterestUpToCurrentDate = 0;
  let remainingPrincipal = loanParams.principal;
  const currentDate = startDate;
  
  // Sort payments by date to process principal reductions in order
  const sortedPayments = [...payments]
    .filter(payment => new Date(payment.paymentDate) <= upToDate)
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
  
  let paymentIndex = 0;
  
  console.log(`Starting principal: ${remainingPrincipal.toFixed(2)}`, upToDate, startDate);
  // Calculate daily interest from start date to upToDate
  while (currentDate < upToDate) {
    // Process any payments that occurred on or before current date
    while (
      paymentIndex < sortedPayments.length &&
      new Date(sortedPayments[paymentIndex].paymentDate) <= currentDate
    ) {
      remainingPrincipal -= sortedPayments[paymentIndex].principalPaid || 0;
      paymentIndex++;
    }
    
    // Determine annual interest rate based on current date
    const annualInterestRate = currentDate < fixedPeriodEndDate 
      ? loanParams.fixedRate 
      : loanParams.floatingRate;
    
    // Calculate daily interest rate
    const dailyInterestRate = (annualInterestRate / 100) / 365;
    
    // Calculate day interest
    const dayInterest = remainingPrincipal * dailyInterestRate;
    totalAccruedInterestUpToCurrentDate += dayInterest;
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Calculate unpaid accrued interest
  const unpaidAccruedInterest = totalAccruedInterestUpToCurrentDate - totalInterestPaidUpToCurrentDate;
  
  return unpaidAccruedInterest;
}

