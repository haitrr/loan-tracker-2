'use client';

import { PaymentScheduleItem } from '@/lib/types';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/loanCalculations';

interface PaymentScheduleTableProps {
  schedule: PaymentScheduleItem[];
}

export default function PaymentScheduleTable({ schedule }: PaymentScheduleTableProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-100">Payment Schedule</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700 border-b-2 border-gray-600">
              <th className="px-4 py-3 text-left font-semibold text-gray-200">#</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-200">Date</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-200">Opening Balance</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-200">Rate</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-200">Interest</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-200">Principal</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-200">Total Payment</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-200">Closing Balance</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-200">Status</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((payment, index) => {
              const isPaid = !!payment.actualPayment;
              const isPrepayment = payment.actualPayment?.isPrepayment;
              
              return (
                <tr
                  key={payment.paymentNumber}
                  className={`border-b border-gray-700 ${
                    isPaid
                      ? 'bg-green-900/30'
                      : payment.rateType === 'fixed'
                      ? 'bg-blue-900/20'
                      : 'bg-green-900/20'
                  } ${index % 2 === 0 ? 'bg-opacity-50' : 'bg-opacity-30'} hover:bg-opacity-70 transition-colors`}
                >
                  <td className="px-4 py-3 text-gray-200">{payment.paymentNumber}</td>
                  <td className="px-4 py-3 text-gray-200 whitespace-nowrap">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-200">
                    {formatCurrency(payment.openingBalance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        payment.rateType === 'fixed'
                          ? 'bg-blue-700 text-blue-200'
                          : 'bg-green-700 text-green-200'
                      }`}
                    >
                      {formatPercentage(payment.interestRate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-red-400 font-medium">
                    {formatCurrency(
                      isPaid ? payment.actualPayment!.interestPaid : payment.interestAmount
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-green-400 font-medium">
                    {formatCurrency(
                      isPaid ? payment.actualPayment!.principalPaid : payment.principalAmount
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-200 font-semibold">
                    {formatCurrency(
                      isPaid ? payment.actualPayment!.paymentAmount : payment.totalPayment
                    )}
                    {isPaid && payment.actualPayment!.prepaymentFee > 0 && (
                      <div className="text-xs text-yellow-400">
                        +{formatCurrency(payment.actualPayment!.prepaymentFee)} fee
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-200">
                    {formatCurrency(payment.closingBalance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isPaid ? (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          isPrepayment
                            ? 'bg-yellow-700 text-yellow-200'
                            : 'bg-green-700 text-green-200'
                        }`}
                      >
                        {isPrepayment ? 'Prepaid' : 'Paid'}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-gray-700 text-gray-400">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-700 rounded"></div>
          <span className="text-gray-300">Fixed Rate Period</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-700 rounded"></div>
          <span className="text-gray-300">Floating Rate Period</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-900/30 border border-green-600 rounded"></div>
          <span className="text-gray-300">Payment Made</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-700 rounded"></div>
          <span className="text-gray-300">Prepayment</span>
        </div>
      </div>
    </div>
  );
}
