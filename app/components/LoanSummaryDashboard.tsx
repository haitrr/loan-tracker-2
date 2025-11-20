'use client';

import { LoanSummary, PaymentScheduleItem } from '@/lib/types';
import { formatCurrency } from '@/lib/loanCalculations';

interface LoanSummaryDashboardProps {
  summary: LoanSummary;
  schedule: PaymentScheduleItem[];
}

export default function LoanSummaryDashboard({ summary, schedule }: LoanSummaryDashboardProps) {
  const fixedPeriodPayments = schedule.filter((p) => p.rateType === 'fixed').length;
  const floatingPeriodPayments = schedule.filter((p) => p.rateType === 'floating').length;

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
            {((summary.totalInterestPaid / summary.totalPrincipalPaid) * 100).toFixed(1)}% of principal
          </p>
        </div>

        <div className="bg-linear-to-br from-purple-900 to-purple-800 rounded-lg p-4 border border-purple-700">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Remaining Balance</h3>
          <p className="text-2xl font-bold text-purple-300">{formatCurrency(summary.remainingBalance)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {summary.remainingBalance < 1 ? 'Fully paid' : 'Outstanding'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Fixed Rate Period</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Number of Payments:</span>
              <span className="font-semibold text-gray-100">{fixedPeriodPayments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Interest Paid:</span>
              <span className="font-semibold text-red-400">
                {formatCurrency(summary.fixedPeriodInterest)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-green-900/30 rounded-lg p-4 border border-green-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Floating Rate Period</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Number of Payments:</span>
              <span className="font-semibold text-gray-100">{floatingPeriodPayments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Interest Paid:</span>
              <span className="font-semibold text-red-400">
                {formatCurrency(summary.floatingPeriodInterest)}
              </span>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
