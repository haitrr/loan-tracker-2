'use client';

import { Payment, LoanParams, ScheduledPayment } from '@/lib/types';
import { enrichPaymentsWithBreakdownUpTo, formatCurrency, formatDate } from '@/lib/loanCalculations';

interface PaymentHistoryProps {
  payments: Payment[];
  loanParams: LoanParams;
  scheduledPayments: ScheduledPayment[];
  onDeletePayment?: (paymentId: string) => void;
}

export default function PaymentHistory({ 
  payments, 
  loanParams,
  scheduledPayments,
  onDeletePayment 
}: PaymentHistoryProps) {
  if (payments.length === 0) {
    return null;
  }

  // Enrich payments with calculated breakdown
  const enrichedPayments = enrichPaymentsWithBreakdownUpTo(new Date(), payments, loanParams, scheduledPayments);

  const totalPaid = enrichedPayments.reduce((sum, p) => sum + p.paymentAmount, 0);
  const totalPrepaymentFees = enrichedPayments.reduce((sum, p) => sum + p.prepaymentFee, 0);
  const totalPrincipalPaid = enrichedPayments.reduce((sum, p) => sum + p.principalPaid, 0);
  const totalInterestPaid = enrichedPayments.reduce((sum, p) => sum + p.interestPaid, 0);
  const totalInterestSaved = enrichedPayments.reduce((sum, p) => sum + (p.interestSaved || 0), 0);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Payment History</h2>
        <div className="text-sm text-gray-400">
          {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-700 rounded-lg">
        <div>
          <p className="text-xs text-gray-400 mb-1">Total Paid</p>
          <p className="text-lg font-semibold text-gray-100">{formatCurrency(totalPaid)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Principal Paid</p>
          <p className="text-lg font-semibold text-green-400">{formatCurrency(totalPrincipalPaid)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Interest Paid</p>
          <p className="text-lg font-semibold text-red-400">{formatCurrency(totalInterestPaid)}</p>
        </div>
        {totalPrepaymentFees > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Prepayment Fees</p>
            <p className="text-lg font-semibold text-yellow-400">{formatCurrency(totalPrepaymentFees)}</p>
          </div>
        )}
        {totalInterestSaved > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Interest Saved</p>
            <p className="text-lg font-semibold text-blue-400">{formatCurrency(totalInterestSaved)}</p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700 border-b-2 border-gray-600">
              <th className="px-4 py-3 text-left font-semibold text-gray-200">Date</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-200">Amount</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-200">Principal</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-200">Interest</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-200">Prepay Fee</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-200">Interest Saved</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-200">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-200">Notes</th>
              {onDeletePayment && (
                <th className="px-4 py-3 text-center font-semibold text-gray-200">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {enrichedPayments
              .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
              .map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-200 whitespace-nowrap">
                    {formatDate(new Date(payment.paymentDate))}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-100 font-semibold">
                    {formatCurrency(payment.paymentAmount)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-400">
                    {formatCurrency(payment.principalPaid)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400">
                    {formatCurrency(payment.interestPaid)}
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-400">
                    {payment.prepaymentFee > 0 ? formatCurrency(payment.prepaymentFee) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-400">
                    {payment.interestSaved && payment.interestSaved  ? formatCurrency(payment.interestSaved) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.prepaymentFee > 0
                          ? 'bg-yellow-900/30 text-yellow-400'
                          : 'bg-blue-900/30 text-blue-400'
                      }`}
                    >
                      {payment.prepaymentFee > 0 ? 'Prepayment' : 'Regular'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {payment.notes || '-'}
                  </td>
                  {onDeletePayment && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => payment.id && onDeletePayment(payment.id)}
                        className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                        title="Delete payment"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
