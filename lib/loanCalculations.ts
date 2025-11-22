import { LoanParams, LoanSummary, Payment, ScheduledPayment, EnrichedPayment, EnrichedPaymentInfo, PaymentType } from './types';
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
 */
export function calculateTotalAccruedInterest(
  upToDate: Date,
  loanParams: LoanParams,
  enrichedPayments: EnrichedPayment[]
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
  let currentBalance = loanParams.principal;
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
 * @param payments - Array of payments made during the period with {date, amount}
 */
export function calculateDailyInterest(
  principal: number,
  annualRate: number,
  startDate: Date,
  endDate: Date,
  payments: Array<{ date: Date, amount: number }> = []
): number {
  const dailyRate = getDailyInterestRate(annualRate);
  let totalInterest = 0;
  let currentBalance = principal;

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const sortedPayments = [...payments].map(p => {
    const date = new Date(p.date);
    date.setHours(0, 0, 0, 0);
    return { date, amount: p.amount };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());

  let payment = 0;

  // Iterate through each day
  const currentDate = new Date(start);
  while (currentDate < end) {
    const currentDateTimestamp = currentDate.getTime();

    // Apply any payments that occurred on this day
    while (
      payment < sortedPayments.length &&
      sortedPayments[payment].date.getTime() <= currentDateTimestamp
    ) {
      currentBalance -= sortedPayments[payment].amount;
      payment++;
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
 * Calculate loan summary statistics based on ACTUAL payments from database
 */
export function calculateLoanSummary(
  schedule: ScheduledPayment[],
  params: LoanParams,
  payments: Payment[]
): LoanSummary {
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let fixedPeriodInterest = 0;
  let floatingPeriodInterest = 0;
  const toDay = new Date();

  // Enrich payments with breakdown
  const enrichedPayments = enrichPaymentsWithBreakdownUpTo(
    new Date(),
    payments,
    params,
    schedule
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
  const unpaidAccruedInterest = calculatePayableInterestUpTo(toDay, params, enrichedPayments, schedule);

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
 * Calculate total payable interest up to a specific date
 * 
 * Payable interest is the cumulative total of all interest that has become due 
 * (reached scheduled payment dates) but has not yet been paid.
 * 
 * @param upToDate - The date up to which to calculate payable interest
 * @param loanParams - Loan parameters
 * @param enrichedPayments - Array of payments already made (with breakdown)
 * @param schedule - Payment schedule to determine when interest becomes payable
 * @returns The total payable interest amount
 */
export function calculatePayableInterestUpToDate(
  upToDate: Date,
  loanParams: LoanParams,
  enrichedPayments: EnrichedPayment[],
  schedule: ScheduledPayment[] = []
): number {
  console.log(`\nCalculating payable interest up to ${upToDate.toISOString().split('T')[0]}`);

  // Calculate total interest that has become payable (reached scheduled payment dates)
  let totalPayableInterest = 0;
  let remainingPrincipal = loanParams.principal;
  let lastDate = new Date(loanParams.startDate);

  const fixedPeriodEndDate = addMonths(new Date(loanParams.startDate), loanParams.fixedPeriodMonths);

  // Sort payments by date
  const sortedPayments = [...enrichedPayments].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );
  let paymentIndex = 0;

  // Process each scheduled payment date that has passed
  for (const scheduleItem of schedule) {
    const scheduledDate = new Date(scheduleItem.scheduledDate);

    // Only process scheduled dates up to upToDate
    if (scheduledDate > upToDate) {
      break;
    }

    // Process any payments made between lastDate and scheduledDate
    // to reduce the principal before calculating interest
    while (
      paymentIndex < sortedPayments.length &&
      new Date(sortedPayments[paymentIndex].paymentDate) <= scheduledDate
    ) {
      remainingPrincipal -= sortedPayments[paymentIndex].principalPaid;
      paymentIndex++;
    }

    // Calculate interest accrued from lastDate to scheduledDate
    // This interest becomes payable at scheduledDate
    const currentDate = new Date(lastDate);
    let periodInterest = 0;

    while (currentDate < scheduledDate) {
      const annualInterestRate = currentDate < fixedPeriodEndDate
        ? loanParams.fixedRate
        : loanParams.floatingRate;

      const dailyInterestRate = (annualInterestRate / 100) / 365;
      periodInterest += remainingPrincipal * dailyInterestRate;

      currentDate.setDate(currentDate.getDate() + 1);
    }

    totalPayableInterest += periodInterest;
    console.log(`Interest became payable on ${scheduledDate.toISOString().split('T')[0]}: ${periodInterest.toFixed(2)}`);

    lastDate = scheduledDate;
  }

  // Subtract all interest already paid
  const totalInterestPaid = enrichedPayments.reduce((sum, p) => sum + p.interestPaid, 0);
  const unpaidPayableInterest = totalPayableInterest - totalInterestPaid;

  console.log(`Total payable interest: ${totalPayableInterest.toFixed(2)}, Paid: ${totalInterestPaid.toFixed(2)}, Unpaid: ${unpaidPayableInterest.toFixed(2)}`);

  return Math.max(0, unpaidPayableInterest);
}

/**
 * Calculate unpaid accrued interest up to a specific date according to interest.md spec
 * 
 * "Accrued unpaid interest" is interest that has accumulated but is NOT YET DUE for payment
 * (has not reached the next scheduled payment date).
 * 
 * This calculates interest accrued from the last scheduled payment date up to the given date.
 * 
 * @param upToDate - The date up to which to calculate unpaid interest
 * @param loanParams - Loan parameters including start date and rates
 * @param payments - Array of actual payments made (with principalPaid breakdown)
 * @param schedule - Payment schedule items to determine when interest becomes due
 * @returns The unpaid accrued interest amount
 */
export function calculatePayableInterestUpTo(
  upToDate: Date,
  loanParams: LoanParams,
  payments: EnrichedPayment[],
  schedule: ScheduledPayment[] = []
): number {
  console.log(`\nCalculating unpaid accrued interest up to `, upToDate);

  // Find the last scheduled payment date that has passed (on or before upToDate)
  const scheduledDates = schedule
    .map((s: ScheduledPayment) => new Date(s.scheduledDate))
    .filter((date: Date) => date <= upToDate)
    .sort((a: Date, b: Date) => b.getTime() - a.getTime()); // Sort descending

  const lastScheduledDate = scheduledDates.length > 0
    ? scheduledDates[0]
    : new Date(loanParams.startDate);

  console.log(`Last scheduled date on or before ${upToDate.toISOString().split('T')[0]}: ${lastScheduledDate.toISOString().split('T')[0]}`);

  // If upToDate is on or before the last scheduled date, no unpaid accrued interest
  // (all accrued interest up to that point became payable)
  if (upToDate <= lastScheduledDate) {
    return 0;
  }

  // Calculate remaining principal at the lastScheduledDate
  // This is the principal after all payments made up to that date
  const sortedPayments = [...payments]
    .filter(payment => new Date(payment.paymentDate) <= lastScheduledDate)
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());

  const totalPrincipalPaidByLastScheduled = sortedPayments.reduce(
    (sum, payment) => sum + (payment.principalPaid || 0),
    0
  );
  const remainingPrincipal = loanParams.principal - totalPrincipalPaidByLastScheduled;

  console.log(`Remaining principal at last scheduled date: ${remainingPrincipal.toFixed(2)}`);

  // Calculate accrued interest from lastScheduledDate to upToDate
  // Interest accrues daily on the remaining principal
  const startDate = new Date(loanParams.startDate);
  const fixedPeriodEndDate = addMonths(startDate, loanParams.fixedPeriodMonths);

  let accruedInterest = 0;
  const currentDate = new Date(lastScheduledDate);

  while (currentDate < upToDate) {
    // Determine annual interest rate based on current date
    const annualInterestRate = currentDate < fixedPeriodEndDate
      ? loanParams.fixedRate
      : loanParams.floatingRate;

    // Calculate daily interest rate
    const dailyInterestRate = (annualInterestRate / 100) / 365;

    // Calculate day interest (on the remaining principal, which doesn't change in this period)
    const dayInterest = remainingPrincipal * dailyInterestRate;
    accruedInterest += dayInterest;

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`Accrued unpaid interest from ${lastScheduledDate.toISOString().split('T')[0]} to ${upToDate.toISOString().split('T')[0]}: ${accruedInterest.toFixed(2)}`);

  return accruedInterest;
}


export function enrichPaymentsWithBreakdownUpTo(
  upToDate: Date,
  payments: Payment[],
  params: LoanParams,
  schedule: ScheduledPayment[]
): EnrichedPayment[] {
  let payablePrincipal = 0;
  let payableInterest = 0;
  let accuredInterestThisSchedule = 0
  const currentDate = new Date(params.startDate);
  currentDate.setDate(currentDate.getDate() + 1);
  const enrichedPayments: EnrichedPayment[] = [];

  while (currentDate <= upToDate) {
    const paymentsToDay = payments.filter(p => {
      const paymentDate = new Date(p.paymentDate);
      return paymentDate.getTime() === currentDate.getTime();
    });
    const scheduledPaymentToDay = schedule.find(s => {
      const scheduledDate = new Date(s.scheduledDate);
      return scheduledDate.getTime() === currentDate.getTime();
    });
    const annualInterestRate = currentDate < addMonths(new Date(params.startDate), params.fixedPeriodMonths)
      ? params.fixedRate
      : params.floatingRate;
    const dailyInterestRate = (annualInterestRate / 100) / 365;
    const dayInterest = (params.principal - enrichedPayments.reduce((sum, p) => sum + (p.principalPaid || 0), 0)) * dailyInterestRate;
    accuredInterestThisSchedule += dayInterest;

    if (scheduledPaymentToDay) {
      // Calculate payable interest up to this scheduled date
      payableInterest += accuredInterestThisSchedule;
      accuredInterestThisSchedule = 0;
      // Add scheduled principal
      payablePrincipal += scheduledPaymentToDay.scheduledPrincipalAmount;
    }


    if (paymentsToDay.length > 0) {
      console.log(`-----On ${currentDate.toISOString().split('T')[0]}, Payable Principal: ${payablePrincipal.toFixed(2)}, Payable Interest: ${payableInterest.toFixed(2)}`);
    }
    for (const payment of paymentsToDay) {
      let enrichedPayment = { ...payment } as EnrichedPayment;
      let breakdown;
      if (payment.type === PaymentType.INTEREST_COLLECTION) {
        breakdown = {
          principalPaid: 0,
          interestPaid: payableInterest,
          prepaymentFee: 0,
          prepaymentAmount: 0
        }
        enrichedPayment.paymentAmount  = payableInterest;
      } else {
        breakdown = getPaymentBreakdown(
          payment.paymentAmount,
          payablePrincipal,
          payableInterest,
          params.prepaymentFeePercentage || 0
        );
      }
      enrichedPayment = {
        ...enrichedPayment,
        principalPaid: breakdown.principalPaid,
        interestPaid: breakdown.interestPaid,
        prepaymentFee: breakdown.prepaymentFee,
      }
      enrichedPayments.push(enrichedPayment);
      // Reduce payable amounts
      payablePrincipal -= breakdown.principalPaid;
      payableInterest -= breakdown.interestPaid;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return enrichedPayments;
}


const getPaymentBreakdown = (
  paymentAmount: number,
  payablePrincipal: number,
  payableInterest: number,
  prepaymentFeePercentage: number = 0
): EnrichedPaymentInfo => {
  // Step 1: Apply to Payable Interest first
  const interestPaid = Math.min(paymentAmount, payableInterest);
  let remainingPayment = paymentAmount - interestPaid;

  // Step 2: Apply to Payable Principal
  const payablePrincipalPaid = Math.max(Math.min(remainingPayment, payablePrincipal), 0);
  remainingPayment -= payablePrincipalPaid;

  // Step 3: Any remaining amount is prepayment (principal + fee)
  let prepaymentPrincipal = 0;
  let prepaymentFee = 0;

  if (remainingPayment > 0) {
    // Calculate prepayment components according to prepay.md
    prepaymentPrincipal = remainingPayment / (1 + prepaymentFeePercentage / 100);
    prepaymentFee = remainingPayment - prepaymentPrincipal;
  }

  const totalPrincipalPaid = payablePrincipalPaid + prepaymentPrincipal;

  return {
    principalPaid: totalPrincipalPaid,
    interestPaid,
    prepaymentFee,
    prepaymentAmount: prepaymentPrincipal
  };
};