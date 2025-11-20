/**
 * Server-side loan calculation functions that query the database
 * These functions are async and use Prisma to fetch data
 */

import { prisma } from './prisma';
import {
  calculateTotalAccruedInterest,
  calculateUnpaidAccruedInterest,
  calculateLoanSummary,
  generatePaymentSchedule,
  enrichPaymentsWithBreakdown,
} from './loanCalculations';
import { LoanParams, LoanSummary } from './types';

/**
 * Calculate total accrued interest from loan start up to a specific date
 * Server-side version that queries database
 * @param loanId - The ID of the loan
 * @param upToDate - The date up to which to calculate accrued interest
 */
export async function calculateTotalAccruedInterestFromDB(
  loanId: string,
  upToDate: Date
): Promise<number> {
  // Query loan and payments from database
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { payments: true },
  });

  if (!loan) {
    throw new Error(`Loan with ID ${loanId} not found`);
  }

  // Convert loan to LoanParams
  const loanParams: LoanParams = {
    principal: loan.principal,
    fixedRate: loan.fixedRate,
    floatingRate: loan.floatingRate,
    fixedPeriodMonths: loan.fixedPeriodMonths,
    totalTermMonths: loan.totalTermMonths,
    startDate: loan.startDate,
    paymentFrequency: loan.paymentFrequency as
      | 'monthly'
      | 'quarterly'
      | 'semi-annual'
      | 'annual',
    prepaymentFeePercentage: loan.prepaymentFeePercentage,
  };

  // Generate schedule
  const schedule = generatePaymentSchedule(loanParams);

  // Enrich payments with breakdown
  const enrichedPayments = enrichPaymentsWithBreakdown(
    loan.payments.map((p) => ({ ...p, notes: p.notes || undefined })),
    schedule,
    loan.prepaymentFeePercentage,
    loanParams
  );

  return calculateTotalAccruedInterest(upToDate, loanParams, enrichedPayments, schedule);
}

/**
 * Calculate unpaid accrued interest from the last payment date to today
 * Server-side version that queries database
 * @param loanId - The ID of the loan
 */
export async function calculateUnpaidAccruedInterestFromDB(
  loanId: string
): Promise<number> {
  // Query loan and payments from database
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { payments: true },
  });

  if (!loan) {
    throw new Error(`Loan with ID ${loanId} not found`);
  }

  // Convert loan to LoanParams
  const params: LoanParams = {
    principal: loan.principal,
    fixedRate: loan.fixedRate,
    floatingRate: loan.floatingRate,
    fixedPeriodMonths: loan.fixedPeriodMonths,
    totalTermMonths: loan.totalTermMonths,
    startDate: loan.startDate,
    paymentFrequency: loan.paymentFrequency as
      | 'monthly'
      | 'quarterly'
      | 'semi-annual'
      | 'annual',
    prepaymentFeePercentage: loan.prepaymentFeePercentage,
  };

  // Generate schedule
  const schedule = generatePaymentSchedule(params);

  // Convert payments
  const payments = loan.payments.map((p) => ({ ...p, notes: p.notes || undefined }));

  return calculateUnpaidAccruedInterest(params, schedule, payments);
}

/**
 * Calculate loan summary statistics based on ACTUAL payments from database
 * Server-side version that queries database
 * @param loanId - The ID of the loan
 */
export async function calculateLoanSummaryFromDB(loanId: string): Promise<LoanSummary> {
  // Query loan and payments from database
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { payments: true },
  });

  if (!loan) {
    throw new Error(`Loan with ID ${loanId} not found`);
  }

  // Convert loan to LoanParams
  const params: LoanParams = {
    principal: loan.principal,
    fixedRate: loan.fixedRate,
    floatingRate: loan.floatingRate,
    fixedPeriodMonths: loan.fixedPeriodMonths,
    totalTermMonths: loan.totalTermMonths,
    startDate: loan.startDate,
    paymentFrequency: loan.paymentFrequency as
      | 'monthly'
      | 'quarterly'
      | 'semi-annual'
      | 'annual',
    prepaymentFeePercentage: loan.prepaymentFeePercentage,
  };

  // Generate schedule
  const schedule = generatePaymentSchedule(params);

  // Convert payments
  const payments = loan.payments.map((p) => ({ ...p, notes: p.notes || undefined }));

  return calculateLoanSummary(schedule, params, payments);
}
