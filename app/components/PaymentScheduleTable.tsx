'use client';

import { ScheduledPayment } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/loanCalculations';

interface PaymentScheduleTableProps {
  schedule: ScheduledPayment[];
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
              <th className="px-4 py-3 text-left font-semibold text-gray-200">Scheduled Date</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-200">Scheduled Principal</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((payment, index) => {
              return (
                <tr
                  key={payment.paymentNumber}
                  className={`border-b border-gray-700 ${
                    index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-900/30'
                  } hover:bg-gray-700/50 transition-colors`}
                >
                  <td className="px-4 py-3 text-gray-200">{payment.paymentNumber}</td>
                  <td className="px-4 py-3 text-gray-300">{formatDate(new Date(payment.scheduledDate))}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(payment.scheduledPrincipalAmount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
