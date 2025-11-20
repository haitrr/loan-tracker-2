'use client';

import { useState } from 'react';
import { LoanParams } from '@/lib/types';

interface LoanInputFormProps {
  onCalculate: (params: LoanParams) => void;
  onSave?: (params: LoanParams & { name: string }) => Promise<void>;
}

export default function LoanInputForm({ onCalculate, onSave }: LoanInputFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    principal: '100000',
    fixedRate: '5.5',
    floatingRate: '6.5',
    fixedPeriodMonths: '36',
    totalTermMonths: '240',
    startDate: new Date().toISOString().split('T')[0],
    paymentFrequency: 'monthly' as const,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params: LoanParams = {
      principal: parseFloat(formData.principal),
      fixedRate: parseFloat(formData.fixedRate),
      floatingRate: parseFloat(formData.floatingRate),
      fixedPeriodMonths: parseInt(formData.fixedPeriodMonths),
      totalTermMonths: parseInt(formData.totalTermMonths),
      startDate: new Date(formData.startDate),
      paymentFrequency: formData.paymentFrequency,
    };
    
    onCalculate(params);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a loan name');
      return;
    }

    setIsSaving(true);
    try {
      const params: LoanParams & { name: string } = {
        name: formData.name,
        principal: parseFloat(formData.principal),
        fixedRate: parseFloat(formData.fixedRate),
        floatingRate: parseFloat(formData.floatingRate),
        fixedPeriodMonths: parseInt(formData.fixedPeriodMonths),
        totalTermMonths: parseInt(formData.totalTermMonths),
        startDate: new Date(formData.startDate),
        paymentFrequency: formData.paymentFrequency,
      };
      
      if (onSave) {
        await onSave(params);
        alert('Loan saved successfully!');
      }
    } catch (error) {
      console.error('Error saving loan:', error);
      alert('Failed to save loan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-100">Loan Parameters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Loan Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Home Loan, Car Loan"
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label htmlFor="principal" className="block text-sm font-medium text-gray-300 mb-2">
            Principal Amount ($)
          </label>
          <input
            type="number"
            id="principal"
            name="principal"
            value={formData.principal}
            onChange={handleChange}
            min="1000"
            step="1000"
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="fixedRate" className="block text-sm font-medium text-gray-300 mb-2">
            Fixed Interest Rate (% p.a.)
          </label>
          <input
            type="number"
            id="fixedRate"
            name="fixedRate"
            value={formData.fixedRate}
            onChange={handleChange}
            min="0"
            max="30"
            step="0.01"
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="floatingRate" className="block text-sm font-medium text-gray-300 mb-2">
            Floating Interest Rate (% p.a.)
          </label>
          <input
            type="number"
            id="floatingRate"
            name="floatingRate"
            value={formData.floatingRate}
            onChange={handleChange}
            min="0"
            max="30"
            step="0.01"
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="fixedPeriodMonths" className="block text-sm font-medium text-gray-300 mb-2">
            Fixed Period (months)
          </label>
          <input
            type="number"
            id="fixedPeriodMonths"
            name="fixedPeriodMonths"
            value={formData.fixedPeriodMonths}
            onChange={handleChange}
            min="1"
            step="1"
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="totalTermMonths" className="block text-sm font-medium text-gray-300 mb-2">
            Total Term (months)
          </label>
          <input
            type="number"
            id="totalTermMonths"
            name="totalTermMonths"
            value={formData.totalTermMonths}
            onChange={handleChange}
            min="1"
            step="1"
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="paymentFrequency" className="block text-sm font-medium text-gray-300 mb-2">
            Payment Frequency
          </label>
          <select
            id="paymentFrequency"
            name="paymentFrequency"
            value={formData.paymentFrequency}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="semi-annual">Semi-Annual</option>
            <option value="annual">Annual</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Calculate Loan Schedule
        </button>
        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Loan'}
          </button>
        )}
      </div>
    </form>
  );
}
