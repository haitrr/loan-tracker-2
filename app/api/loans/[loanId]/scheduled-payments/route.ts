import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ loanId: string }>;
}

interface ScheduledPaymentUpdate {
  id: string;
  scheduledDate?: string;
  scheduledPrincipalAmount?: number;
}

/**
 * GET /api/loans/[loanId]/scheduled-payments
 * Fetch all scheduled payments for a specific loan
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { loanId } = await context.params;

    const scheduledPayments = await prisma.scheduledPayment.findMany({
      where: { loanId },
      orderBy: { paymentNumber: 'asc' }
    });

    return NextResponse.json(scheduledPayments);
  } catch (error) {
    console.error('Error fetching scheduled payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled payments' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/loans/[loanId]/scheduled-payments
 * Update scheduled payments for a specific loan
 * Accepts an array of scheduled payment updates
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { loanId } = await context.params;
    const body = await request.json();
    const { scheduledPayments } = body;

    if (!Array.isArray(scheduledPayments)) {
      return NextResponse.json(
        { error: 'scheduledPayments must be an array' },
        { status: 400 }
      );
    }

    // Verify loan exists
    const loan = await prisma.loan.findUnique({
      where: { id: loanId }
    });

    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    // Update scheduled payments in a transaction
    const updates = await prisma.$transaction(
      scheduledPayments.map((payment: ScheduledPaymentUpdate) => {
        const { id, scheduledDate, scheduledPrincipalAmount } = payment;
        
        if (!id) {
          throw new Error('Payment id is required for updates');
        }

        const updateData: {
          scheduledDate?: Date;
          scheduledPrincipalAmount?: number;
        } = {};
        if (scheduledDate !== undefined) {
          updateData.scheduledDate = new Date(scheduledDate);
        }
        if (scheduledPrincipalAmount !== undefined) {
          updateData.scheduledPrincipalAmount = parseFloat(scheduledPrincipalAmount.toString());
        }

        return prisma.scheduledPayment.update({
          where: { id, loanId },
          data: updateData
        });
      })
    );

    return NextResponse.json(updates);
  } catch (error) {
    console.error('Error updating scheduled payments:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled payments' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/loans/[loanId]/scheduled-payments
 * Delete a specific scheduled payment
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { loanId } = await context.params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId is required' },
        { status: 400 }
      );
    }

    await prisma.scheduledPayment.delete({
      where: { 
        id: paymentId,
        loanId 
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled payment:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled payment' },
      { status: 500 }
    );
  }
}
