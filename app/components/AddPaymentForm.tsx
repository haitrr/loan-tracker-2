'use client';

import { useState, useEffect } from 'react';
import { Payment, PaymentScheduleItem } from '@/lib/types';
import { 
  calculatePrepaymentFee, 
  getNextExpectedPayment, 
  formatCurrency,
  enrichPaymentsWithBreakdown,
  calculatePaymentBreakdown,
  calculatePaymentPrepaymentFee
} from '@/lib/loanCalculations';

interface AddPaymentFormProps {
  loanId: string;
  schedule: PaymentScheduleItem[];
  payments: Payment[];
  prepaymentFeePercentage: number;
  onPaymentAdded: () => void;
}

export default function AddPaymentForm({
  loanId,
  schedule,
  payments,
  prepaymentFeePercentage,
  onPaymentAdded,
}: AddPaymentFormProps) {
  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentAmount: '',
    notes: '',
  });
  const [calculatedValues, setCalculatedValues] = useState({
    principalPaid: 0,
    interestPaid: 0,
    prepaymentFee: 0,
    totalWithFee: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const nextPayment = getNextExpectedPayment(schedule, payments);
  
  // Calculate remaining principal balance
  const enrichedPayments = enrichPaymentsWithBreakdown(payments, schedule, prepaymentFeePercentage);
  const totalPrincipalPaid = enrichedPayments.reduce((sum, p) => sum + p.principalPaid, 0);
  const remainingBalance = schedule[0]?.openingBalance - totalPrincipalPaid || 0;

  const calculatePaymentBreakdownLocal = () => {
    const amount = parseFloat(formData.paymentAmount) || 0;
    
    if (amount === 0 || !nextPayment) {
      setCalculatedValues({
        principalPaid: 0,
        interestPaid: 0,
        prepaymentFee: 0,
        totalWithFee: 0,
      });
      return;
    }

    // Calculate breakdown using the utility function
    const breakdown = calculatePaymentBreakdown(
      amount,
      nextPayment.interestAmount,
      remainingBalance
    );
    
    // Calculate prepayment fee
    const prepaymentFee = calculatePaymentPrepaymentFee(
      amount,
      nextPayment.totalPayment,
      prepaymentFeePercentage
    );

    setCalculatedValues({
      principalPaid: breakdown.principalPaid,
      interestPaid: breakdown.interestPaid,
      prepaymentFee,
      totalWithFee: amount + prepaymentFee,
    });
  };

  useEffect(() => {
    calculatePaymentBreakdownLocal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.paymentAmount, nextPayment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    
    // Validate that principal paid doesn't exceed remaining balance
    if (calculatedValues.principalPaid > remainingBalance) {
      alert(`Payment amount exceeds remaining balance. Maximum principal payment: ${formatCurrency(remainingBalance)}`);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/loans/${loanId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentDate: formData.paymentDate,
          paymentAmount: parseFloat(formData.paymentAmount),
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          paymentDate: new Date().toISOString().split('T')[0],
          paymentAmount: '',
          notes: '',
        });
        setShowForm(false);
        onPaymentAdded();
      } else {
        throw new Error('Failed to save payment');
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Failed to save payment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const fillScheduledAmount = () => {
    if (nextPayment) {
      setFormData(prev => ({
        ...prev,
        paymentAmount: nextPayment.totalPayment.toFixed(2),
      }));
    }
  };

  if (!showForm) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Record Payment</h2>
            {nextPayment && (
              <p className="mt-2 text-sm text-gray-400">
                Next scheduled payment: {formatCurrency(nextPayment.totalPayment)} on{' '}
                {new Date(nextPayment.paymentDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            Add Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Record Payment</h2>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>

      {nextPayment && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-100 mb-2">Next Scheduled Payment</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Date</p>
              <p className="text-gray-100 font-medium">
                {new Date(nextPayment.paymentDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Total Payment</p>
              <p className="text-gray-100 font-medium">{formatCurrency(nextPayment.totalPayment)}</p>
            </div>
            <div>
              <p className="text-gray-400">Interest</p>
              <p className="text-red-400 font-medium">{formatCurrency(nextPayment.interestAmount)}</p>
            </div>
            <div>
              <p className="text-gray-400">Principal</p>
              <p className="text-green-400 font-medium">{formatCurrency(nextPayment.principalAmount)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-700">
            <p className="text-sm text-gray-400">
              Remaining Balance: <span className="text-gray-100 font-medium">{formatCurrency(remainingBalance)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={fillScheduledAmount}
            className="mt-3 text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Use scheduled amount
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-300 mb-2">
              Payment Date
            </label>
            <input
              type="date"
              id="paymentDate"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-300 mb-2">
              Payment Amount ($)
            </label>
            <input
              type="number"
              id="paymentAmount"
              name="paymentAmount"
              value={formData.paymentAmount}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes about this payment..."
            />
          </div>
        </div>

        {parseFloat(formData.paymentAmount) > 0 && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-100 mb-3">Payment Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Interest Paid</p>
                <p className="text-red-400 font-medium text-lg">
                  {formatCurrency(calculatedValues.interestPaid)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Principal Paid</p>
                <p className="text-green-400 font-medium text-lg">
                  {formatCurrency(calculatedValues.principalPaid)}
                </p>
              </div>
              {calculatedValues.prepaymentFee > 0 && (
                <div>
                  <p className="text-gray-400">Prepayment Fee</p>
                  <p className="text-yellow-400 font-medium text-lg">
                    {formatCurrency(calculatedValues.prepaymentFee)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-400">
                  {calculatedValues.prepaymentFee > 0
                    ? 'Total with Fee'
                    : 'Total Payment'}
                </p>
                <p className="text-gray-100 font-semibold text-lg">
                  {formatCurrency(calculatedValues.totalWithFee)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Record Payment'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-6 py-3 bg-gray-700 text-gray-100 font-semibold rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
