import { NextRequest, NextResponse } from 'next/server';
import { calculateLoanSummaryFromDB } from '@/lib/loanCalculationsServer';

export async function GET(
  request: NextRequest,
  { params }: { params: { loanId: string } }
) {
  try {
    const loanId = params.loanId;
    const summary = await calculateLoanSummaryFromDB(loanId);
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error calculating loan summary:', error);
    return NextResponse.json(
      { error: 'Failed to calculate loan summary' },
      { status: 500 }
    );
  }
}
