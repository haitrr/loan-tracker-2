import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const loan = await prisma.loan.create({
      data: {
        name,
        principal: parseFloat(principal),
        fixedRate: parseFloat(fixedRate),
        floatingRate: parseFloat(floatingRate),
        fixedPeriodMonths: parseInt(fixedPeriodMonths),
        totalTermMonths: parseInt(totalTermMonths),
        startDate: new Date(startDate),
        paymentFrequency,
        prepaymentFeePercentage: parseFloat(prepaymentFeePercentage) || 0
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
