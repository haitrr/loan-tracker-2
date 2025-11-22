import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMonthsBetweenPayments, addMonths, getPaymentsPerYear } from '@/lib/loanCalculations';

export async function GET() {
  try {
    const loans = await prisma.loan.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loans' },
      { status: 500 }
    );
  }
}

/**
 * Generate scheduled payments based on loan parameters
 */
function generateScheduledPayments(
  principal: number,
  startDate: Date,
  totalTermMonths: number,
  paymentFrequency: string
) {
  const monthsBetweenPayments = getMonthsBetweenPayments(paymentFrequency);
  const paymentsPerYear = getPaymentsPerYear(paymentFrequency);
  const totalPayments = Math.ceil((totalTermMonths / 12) * paymentsPerYear);
  const scheduledPrincipalAmount = principal / totalPayments;

  const scheduledPayments = [];
  let currentDate = addMonths(startDate, monthsBetweenPayments);

  for (let i = 1; i <= totalPayments; i++) {
    scheduledPayments.push({
      paymentNumber: i,
      scheduledDate: new Date(currentDate),
      scheduledPrincipalAmount: scheduledPrincipalAmount,
    });
    currentDate = addMonths(currentDate, monthsBetweenPayments);
  }

  return scheduledPayments;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      principal,
      fixedRate,
      floatingRate,
      fixedPeriodMonths,
      totalTermMonths,
      startDate,
      paymentFrequency,
      prepaymentFeePercentage
    } = body;

    const parsedPrincipal = parseFloat(principal);
    const parsedStartDate = new Date(startDate);
    const parsedTotalTermMonths = parseInt(totalTermMonths);

    // Generate scheduled payments
    const scheduledPayments = generateScheduledPayments(
      parsedPrincipal,
      parsedStartDate,
      parsedTotalTermMonths,
      paymentFrequency
    );

    // Create loan with scheduled payments in a transaction
    const loan = await prisma.loan.create({
      data: {
        name,
        principal: parsedPrincipal,
        fixedRate: parseFloat(fixedRate),
        floatingRate: parseFloat(floatingRate),
        fixedPeriodMonths: parseInt(fixedPeriodMonths),
        totalTermMonths: parsedTotalTermMonths,
        startDate: parsedStartDate,
        paymentFrequency,
        prepaymentFeePercentage: parseFloat(prepaymentFeePercentage) || 0,
        scheduledPayments: {
          create: scheduledPayments
        }
      },
      include: {
        scheduledPayments: true
      }
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    return NextResponse.json(
      { error: 'Failed to create loan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Loan ID is required' },
        { status: 400 }
      );
    }

    await prisma.loan.delete({
      where: { id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json(
      { error: 'Failed to delete loan' },
      { status: 500 }
    );
  }
}
