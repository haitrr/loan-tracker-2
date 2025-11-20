'use client';

import { useRouter } from 'next/navigation';
import LoanInputForm from '@/app/components/LoanInputForm';
import { LoanParams } from '@/lib/types';

export default function NewLoanPage() {
  const router = useRouter();

  const handleSaveLoan = async (params: LoanParams & { name: string }) => {
    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        router.push('/');
      } else {
        throw new Error('Failed to save loan');
      }
    } catch (error) {
      console.error('Error saving loan:', error);
      throw error;
    }
  };

  const handleCalculate = (params: LoanParams) => {
    // Just for preview, no action needed
    console.log('Loan calculated:', params);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-100">
                Create New Loan
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Enter your loan details and save for tracking
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors"
            >
              Back to Loans
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <LoanInputForm onCalculate={handleCalculate} onSave={handleSaveLoan} />
      </main>
    </div>
  );
}
