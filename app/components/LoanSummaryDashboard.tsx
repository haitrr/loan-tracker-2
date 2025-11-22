'use client';

import { LoanSummary, ScheduledPayment } from '@/lib/types';
import { formatCurrency } from '@/lib/loanCalculations';

interface LoanSummaryDashboardProps {
  summary: LoanSummary;
  scheduledPayments?: ScheduledPayment[];
}

export default function LoanSummaryDashboard({ 
  summary, 
  scheduledPayments = [] 
}: LoanSummaryDashboardProps) {
  // Calculate scheduled payments statistics
  const totalScheduledPayments = scheduledPayments.length;
  const totalScheduledPrincipal = scheduledPayments.reduce(
    (sum, sp) => sum + sp.scheduledPrincipalAmount, 
    0
  );
  const upcomingPayments = scheduledPayments.filter(
    sp => new Date(sp.scheduledDate) > new Date()
  );
  const nextScheduledPayment = upcomingPayments.length > 0 ? upcomingPayments[0] : null;
  console.log('Scheduled Payments:', summary.totalInterestPaid, summary.scheduledTotalInterest, summary.totalPrepaymentFees);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-100">Loan Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-linear-to-br from-blue-900 to-blue-800 rounded-lg p-4 border border-blue-700">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Total Amount Paid</h3>
          <p className="text-2xl font-bold text-blue-300">{formatCurrency(summary.totalAmountPaid)}</p>
          <p className="text-xs text-gray-400 mt-1">Principal + Interest</p>
        </div>

        <div className="bg-linear-to-br from-green-900 to-green-800 rounded-lg p-4 border border-green-700">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Total Principal Paid</h3>
          <p className="text-2xl font-bold text-green-300">{formatCurrency(summary.totalPrincipalPaid)}</p>
          <p className="text-xs text-gray-400 mt-1">{summary.numberOfPayments} payments</p>
        </div>

        <div className="bg-linear-to-br from-red-900 to-red-800 rounded-lg p-4 border border-red-700">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Total Interest Paid</h3>
          <p className="text-2xl font-bold text-red-300">{formatCurrency(summary.totalInterestPaid)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {summary.totalPrincipalPaid > 0 
              ? `${((summary.totalInterestPaid / summary.totalPrincipalPaid) * 100).toFixed(1)}% of principal`
              : 'No principal paid yet'}
          </p>
        </div>

        <div className="bg-linear-to-br from-purple-900 to-purple-800 rounded-lg p-4 border border-purple-700">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Remaining Balance</h3>
          <p className="text-2xl font-bold text-purple-300">{formatCurrency(summary.remainingBalance)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {summary.remainingBalance < 1 ? 'Fully paid' : 'Outstanding'}
          </p>
        </div>

        {summary.unpaidAccruedInterest !== undefined && summary.unpaidAccruedInterest > 0 && (
          <div className="bg-linear-to-br from-orange-900 to-orange-800 rounded-lg p-4 border border-orange-700">
            <h3 className="text-sm font-medium text-gray-300 mb-1">Unpaid Accrued Interest</h3>
            <p className="text-2xl font-bold text-orange-300">{formatCurrency(summary.unpaidAccruedInterest)}</p>
            <p className="text-xs text-gray-400 mt-1">
              Accumulated to today
            </p>
          </div>
        )}

        {summary.scheduledTotalInterest !== undefined && summary.scheduledTotalInterest > 0 && (
          <div className={`bg-linear-to-br rounded-lg p-4 border ${
            summary.totalInterestPaid + (summary.totalPrepaymentFees || 0) < summary.scheduledTotalInterest
              ? 'from-cyan-900 to-cyan-800 border-cyan-700'
              : 'from-amber-900 to-amber-800 border-amber-700'
          }`}>
            <h3 className="text-sm font-medium text-gray-300 mb-1">Interest vs Schedule</h3>
            <p className={`text-2xl font-bold ${
              summary.totalInterestPaid + (summary.totalPrepaymentFees || 0) < summary.scheduledTotalInterest
                ? 'text-cyan-300'
                : 'text-amber-300'
            }`}>
              {summary.totalInterestPaid + (summary.totalPrepaymentFees || 0) < summary.scheduledTotalInterest ? '-' : '+'}
              {formatCurrency(Math.abs(summary.totalInterestPaid - summary.scheduledTotalInterest + (summary.totalPrepaymentFees || 0)))}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {summary.totalInterestPaid + (summary.totalPrepaymentFees || 0) < summary.scheduledTotalInterest
                ? 'Saved by early payments'
                : 'Extra from late payments'}
            </p>
          </div>
        )}
      </div>

      {scheduledPayments.length > 0 && (
        <div className="mt-6 bg-indigo-900/30 rounded-lg p-4 border border-indigo-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Scheduled Payments Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-300">Total Scheduled Payments:</span>
              <p className="text-xl font-bold text-indigo-300">{totalScheduledPayments}</p>
            </div>
            <div>
              <span className="text-sm text-gray-300">Total Scheduled Principal:</span>
              <p className="text-xl font-bold text-indigo-300">{formatCurrency(totalScheduledPrincipal)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-300">Upcoming Payments:</span>
              <p className="text-xl font-bold text-indigo-300">{upcomingPayments.length}</p>
            </div>
          </div>
          {nextScheduledPayment && (
            <div className="mt-4 pt-4 border-t border-indigo-600">
              <p className="text-sm text-gray-300 mb-2">Next Scheduled Payment:</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-100">
                  Payment #{nextScheduledPayment.paymentNumber} - {new Date(nextScheduledPayment.scheduledDate).toLocaleDateString()}
                </span>
                <span className="font-semibold text-indigo-300">
                  {formatCurrency(nextScheduledPayment.scheduledPrincipalAmount)} (principal)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Fixed Rate Period Interest</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Interest Paid:</span>
              <span className="font-semibold text-red-400">
                {formatCurrency(summary.fixedPeriodInterest)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-green-900/30 rounded-lg p-4 border border-green-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Floating Rate Period Interest</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Interest Paid:</span>
              <span className="font-semibold text-red-400">
                {formatCurrency(summary.floatingPeriodInterest)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {summary.totalInterestPaid > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Interest Breakdown</h3>
          <div className="flex h-8 rounded-lg overflow-hidden">
            <div
              className="bg-blue-500 flex items-center justify-center text-white text-sm font-medium"
              style={{
                width: `${(summary.fixedPeriodInterest / summary.totalInterestPaid) * 100}%`,
              }}
            >
              {summary.fixedPeriodInterest > 0 && (
                <span className="px-2">
                  {((summary.fixedPeriodInterest / summary.totalInterestPaid) * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <div
              className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
              style={{
                width: `${(summary.floatingPeriodInterest / summary.totalInterestPaid) * 100}%`,
              }}
            >
              {summary.floatingPeriodInterest > 0 && (
                <span className="px-2">
                  {((summary.floatingPeriodInterest / summary.totalInterestPaid) * 100).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>Fixed Period Interest</span>
            <span>Floating Period Interest</span>
          </div>
        </div>
      )}
    </div>
  );
}
