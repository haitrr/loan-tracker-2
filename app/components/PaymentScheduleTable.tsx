'use client';

import { ScheduledPayment } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/loanCalculations';
import { useState } from 'react';

interface PaymentScheduleTableProps {
  schedule: ScheduledPayment[];
  loanId?: string;
  onScheduleUpdated?: (updatedSchedule: ScheduledPayment[]) => void;
}

export default function PaymentScheduleTable({ schedule, loanId, onScheduleUpdated }: PaymentScheduleTableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSchedule, setEditedSchedule] = useState<ScheduledPayment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditClick = () => {
    setEditedSchedule(JSON.parse(JSON.stringify(schedule)));
    setIsEditing(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedSchedule([]);
    setError(null);
  };

  const handleDateChange = (index: number, newDate: string) => {
    const updated = [...editedSchedule];
    updated[index] = {
      ...updated[index],
      scheduledDate: new Date(newDate)
    };
    setEditedSchedule(updated);
  };

  const handlePrincipalChange = (index: number, newPrincipal: string) => {
    const updated = [...editedSchedule];
    const value = parseFloat(newPrincipal);
    if (!isNaN(value) && value >= 0) {
      updated[index] = {
        ...updated[index],
        scheduledPrincipalAmount: value
      };
      setEditedSchedule(updated);
    }
  };

  const validateSchedule = (): string | null => {
    // Check that dates are in ascending order
    for (let i = 1; i < editedSchedule.length; i++) {
      const prevDate = new Date(editedSchedule[i - 1].scheduledDate);
      const currDate = new Date(editedSchedule[i].scheduledDate);
      if (currDate <= prevDate) {
        return `Payment ${i + 1} date must be after payment ${i} date`;
      }
    }

    // Check that all principal amounts are positive
    for (let i = 0; i < editedSchedule.length; i++) {
      if (editedSchedule[i].scheduledPrincipalAmount <= 0) {
        return `Payment ${i + 1} principal must be greater than 0`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    if (!loanId) {
      setError('Cannot save: Loan ID is missing');
      return;
    }

    const validationError = validateSchedule();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/loans/${loanId}/scheduled-payments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledPayments: editedSchedule.map(payment => ({
            id: payment.id,
            scheduledDate: new Date(payment.scheduledDate).toISOString(),
            scheduledPrincipalAmount: payment.scheduledPrincipalAmount
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update scheduled payments');
      }

      const updatedPayments = await response.json();
      setIsEditing(false);
      setEditedSchedule([]);
      
      if (onScheduleUpdated) {
        onScheduleUpdated(updatedPayments);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const displaySchedule = isEditing ? editedSchedule : schedule;
  const totalScheduledPrincipal = displaySchedule.reduce((sum, p) => sum + p.scheduledPrincipalAmount, 0);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Payment Schedule</h2>
        {loanId && !isEditing && (
          <button
            onClick={handleEditClick}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Adjust Schedule
          </button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200">
          {error}
        </div>
      )}
      
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
            {displaySchedule.map((payment, index) => {
              return (
                <tr
                  key={payment.paymentNumber}
                  className={`border-b border-gray-700 ${
                    index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-900/30'
                  } hover:bg-gray-700/50 transition-colors`}
                >
                  <td className="px-4 py-3 text-gray-200">{payment.paymentNumber}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {isEditing ? (
                      <input
                        type="date"
                        value={new Date(payment.scheduledDate).toISOString().split('T')[0]}
                        onChange={(e) => handleDateChange(index, e.target.value)}
                        className="bg-gray-700 text-gray-200 px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                    ) : (
                      formatDate(new Date(payment.scheduledDate))
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={payment.scheduledPrincipalAmount}
                        onChange={(e) => handlePrincipalChange(index, e.target.value)}
                        className="bg-gray-700 text-gray-200 px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-right w-32 ml-auto"
                      />
                    ) : (
                      formatCurrency(payment.scheduledPrincipalAmount)
                    )}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-700 font-bold">
              <td colSpan={2} className="px-4 py-3 text-right text-gray-200">Total Scheduled Principal:</td>
              <td className="px-4 py-3 text-right text-gray-200">{formatCurrency(totalScheduledPrincipal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
