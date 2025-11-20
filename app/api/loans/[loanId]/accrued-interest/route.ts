import { NextRequest, NextResponse } from 'next/server';
import { calculateTotalAccruedInterestFromDB } from '@/lib/loanCalculationsServer';

export async function GET(
  request: NextRequest,
  { params }: { params: { loanId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const upToDateParam = searchParams.get('upToDate');
    
    if (!upToDateParam) {
      return NextResponse.json(
        { error: 'upToDate parameter is required' },
        { status: 400 }
      );
    }
    
    const upToDate = new Date(upToDateParam);
    const loanId = params.loanId;
    
    const totalAccruedInterest = await calculateTotalAccruedInterestFromDB(loanId, upToDate);
    
    return NextResponse.json({ totalAccruedInterest });
  } catch (error) {
    console.error('Error calculating accrued interest:', error);
    return NextResponse.json(
      { error: 'Failed to calculate accrued interest' },
      { status: 500 }
    );
  }
}
