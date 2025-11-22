'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoanSummaryDashboard from './components/LoanSummaryDashboard';
import PaymentScheduleTable from './components/PaymentScheduleTable';
import AddPaymentForm from './components/AddPaymentForm';
import PaymentHistory from './components/PaymentHistory';
import { LoanParams, LoanSummary, Payment, ScheduledPayment } from '@/lib/types';
import { calculateLoanSummary } from '@/lib/loanCalculations';

interface SavedLoan {
  id: string;
  name: string;
  principal: number;
  fixedRate: number;
  floatingRate: number;
  fixedPeriodMonths: number;
  totalTermMonths: number;
  startDate: string;
  paymentFrequency: string;
  prepaymentFeePercentage: number;
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduledPayment[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [savedLoans, setSavedLoans] = useState<SavedLoan[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<SavedLoan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([]);

  useEffect(() => {
    loadSavedLoans();
  }, []);

  const loadSavedLoans = async () => {
    try {
      const response = await fetch('/api/loans');
      if (response.ok) {
        const loans = await response.json();
        setSavedLoans(loans);
      }
    } catch (error) {
      console.error('Error loading loans:', error);
    }
  };

  const handleCalculate = (params: LoanParams, existingPayments: Payment[] = [], scheduledPayments: ScheduledPayment[] = []) => {
    const loanSummary = calculateLoanSummary(scheduledPayments, params, existingPayments);
    
    setSchedule(scheduledPayments);
    setSummary(loanSummary);
  };

  const handleLoadLoan = async (loanId: string) => {
    const loan = savedLoans.find(l => l.id === loanId);
    if (loan) {
      setSelectedLoanId(loanId);
      setSelectedLoan(loan);
      
      const params: LoanParams = {
        principal: loan.principal,
        fixedRate: loan.fixedRate,
        floatingRate: loan.floatingRate,
        fixedPeriodMonths: loan.fixedPeriodMonths,
        totalTermMonths: loan.totalTermMonths,
        startDate: new Date(loan.startDate),
        paymentFrequency: loan.paymentFrequency as 'monthly' | 'quarterly' | 'semi-annual' | 'annual',
        prepaymentFeePercentage: loan.prepaymentFeePercentage || 0,
      };
      
      // Fetch payments and scheduled payments
      const loanPayments = await loadPayments(loanId);
      const scheduled = await loadScheduledPayments(loanId);
      
      handleCalculate(params, loanPayments, scheduled);
    }
  };
  
  const loadPayments = async (loanId: string) => {
    try {
      const response = await fetch(`/api/loans/${loanId}/payments`);
      if (response.ok) {
        const loanPayments = await response.json();
        setPayments(loanPayments);
        return loanPayments;
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
    return [];
  };

  const loadScheduledPayments = async (loanId: string) => {
    try {
      const response = await fetch(`/api/loans/${loanId}/scheduled-payments`);
      if (response.ok) {
        const scheduled = await response.json();
        setScheduledPayments(scheduled);
        return scheduled;
      }
    } catch (error) {
      console.error('Error loading scheduled payments:', error);
    }
    return [];
  };
  
  const handlePaymentAdded = async () => {
    if (selectedLoan) {
      await handleLoadLoan(selectedLoan.id);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/loans/${selectedLoan?.id}/payments?paymentId=${paymentId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        if (selectedLoan) {
          await handleLoadLoan(selectedLoan.id);
        }
      } else {
        throw new Error('Failed to delete payment');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment. Please try again.');
    }
  };

  const handleDeleteLoan = async (loanId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this loan?')) {
      return;
    }

    try {
      const response = await fetch(`/api/loans?id=${loanId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (selectedLoanId === loanId) {
          setSelectedLoanId(null);
          setSchedule([]);
          setSummary(null);
        }
        await loadSavedLoans();
      } else {
        throw new Error('Failed to delete loan');
      }
    } catch (error) {
      console.error('Error deleting loan:', error);
      alert('Failed to delete loan. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-100">
                Fixed-to-Floating Loan Tracker
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Track your loan with reducing-balance interest calculation
              </p>
            </div>
            <button
              onClick={() => router.push('/loans/new')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Create New Loan
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {savedLoans.length > 0 && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-100">Saved Loans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedLoans.map((loan) => (
                <div
                  key={loan.id}
                  className={`relative p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                    selectedLoanId === loan.id
                      ? 'border-blue-500 bg-gray-700'
                      : 'border-gray-600 bg-gray-750 hover:border-gray-500'
                  }`}
                  onClick={() => handleLoadLoan(loan.id)}
                >
                  <button
                    onClick={(e) => handleDeleteLoan(loan.id, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                    title="Delete loan"
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
                  <h3 className="font-semibold text-gray-100 mb-2 pr-8">{loan.name}</h3>
                  <div className="text-sm text-gray-400">
                    <p>Principal: ${loan.principal.toLocaleString()}</p>
                    <p>Rate: {loan.fixedRate}% → {loan.floatingRate}%</p>
                    <p>Term: {loan.totalTermMonths} months</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {summary && schedule.length > 0 && selectedLoan && (() => {
          const loanParams: LoanParams = {
            principal: selectedLoan.principal,
            fixedRate: selectedLoan.fixedRate,
            floatingRate: selectedLoan.floatingRate,
            fixedPeriodMonths: selectedLoan.fixedPeriodMonths,
            totalTermMonths: selectedLoan.totalTermMonths,
            startDate: new Date(selectedLoan.startDate),
            paymentFrequency: selectedLoan.paymentFrequency as 'monthly' | 'quarterly' | 'semi-annual' | 'annual',
            prepaymentFeePercentage: selectedLoan.prepaymentFeePercentage || 0,
          };
          
          return (
            <>
              <AddPaymentForm
                loanId={selectedLoan.id}
                payments={payments}
                prepaymentFeePercentage={selectedLoan.prepaymentFeePercentage || 0}
                loanParams={loanParams}
                onPaymentAdded={handlePaymentAdded}
              />
              {payments.length > 0 && (
                <PaymentHistory 
                  payments={payments} 
                  prepaymentFeePercentage={selectedLoan.prepaymentFeePercentage || 0}
                  loanParams={loanParams}
                  onDeletePayment={handleDeletePayment} 
                />
              )}
              <LoanSummaryDashboard 
                summary={summary} 
                scheduledPayments={scheduledPayments}
              />
              <PaymentScheduleTable schedule={schedule} />
            </>
          );
        })()}

        {schedule.length === 0 && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-12 w-12 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-100">
                {savedLoans.length === 0 ? 'No Loans Yet' : 'Select a Loan'}
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                {savedLoans.length === 0
                  ? 'Create your first loan to start tracking payments and schedules.'
                  : 'Click on a saved loan above to view its amortization schedule and payment details.'}
              </p>
              {savedLoans.length === 0 && (
                <button
                  onClick={() => router.push('/loans/new')}
                  className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Create Your First Loan
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-400">
            Loan calculations use reducing-balance method with fixed-to-floating rate transitions
          </p>
        </div>
      </footer>
    </div>
  );
}
