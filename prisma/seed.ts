import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { PaymentType } from "@/lib/types";

/**
 * Generate scheduled payments based on loan parameters
 */
function generateScheduledPayments(
  principal: number,
  startDate: Date,
  totalTermMonths: number,
  paymentFrequency: string
) {
  const paymentsPerYear = paymentFrequency === 'monthly' ? 12 :
    paymentFrequency === 'quarterly' ? 4 :
      paymentFrequency === 'semi-annual' ? 2 : 1;
  const monthsBetweenPayments = 12 / paymentsPerYear;
  const totalPayments = Math.ceil((totalTermMonths / 12) * paymentsPerYear);
  const scheduledPrincipalAmount = principal / totalPayments;

  const scheduledPayments = [];
  const currentDate = new Date(startDate);

  for (let i = 1; i <= totalPayments; i++) {
    currentDate.setMonth(currentDate.getMonth() + monthsBetweenPayments);
    const scheduledDate = new Date(currentDate);
    if( i == 4) {
      // 2025-05-27
      scheduledDate.setDate(27);
    }
    scheduledPayments.push({
      paymentNumber: i,
      scheduledDate: new Date(scheduledDate),
      scheduledPrincipalAmount: scheduledPrincipalAmount,
    });
  }

  return scheduledPayments;
}

async function main() {
  console.log("Seeding database...");
  // clean up db
  await prisma.scheduledPayment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.loan.deleteMany();

  const loanId = "69080e46-5aab-4162-9795-eb4fc3ccf383";
  const loanData = {
    name: "House Loan",
    id: loanId,
    principal: 2000000000,
    fixedRate: 6.6,
    floatingRate: 7.5,
    fixedPeriodMonths: 24,
    totalTermMonths: 360,
    startDate: new Date("2024-01-26"),
    paymentFrequency: "monthly",
    prepaymentFeePercentage: 1.0
  };

  // Generate scheduled payments
  const scheduledPayments = generateScheduledPayments(
    loanData.principal,
    loanData.startDate,
    loanData.totalTermMonths,
    loanData.paymentFrequency
  );

  const loan = await prisma.loan.upsert({
    where: { id: loanId },
    update: loanData,
    create: {
      ...loanData,
      scheduledPayments: {
        create: scheduledPayments
      }
    },
  });

  console.log(`Created loan with ${scheduledPayments.length} scheduled payments`);

  const paymentsData = [
    {
      id: "19080e46-5aab-4162-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-02-02"),
      paymentAmount: 10_100_000,
    },
    {
      id: "29080e46-5aab-4162-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-02-27"),
      paymentAmount: 0,
      type: PaymentType.INTEREST_COLLECTION,
    },
    {
      id: "69080e46-5aab-4162-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-02-28"),
      paymentAmount: 12_120_000,
    },
    {
      id: "69080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-03-24"),
      paymentAmount: 10_100_000,
    },
    {
      id: "21080e46-5aab-4162-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-03-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "79080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-04-05"),
      paymentAmount: 12_120_000,
    },
    {
      id: "89080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-04-19"),
      paymentAmount: 10_100_000,
    },
    {
      id: "22080e46-5aab-4162-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-04-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "83080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-05-09"),
      paymentAmount: 10_100_000,
    },
    {
      id: "ic-2024-05-27",
      loanId: loanId,
      paymentDate: new Date("2024-05-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "84080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-05-31"),
      paymentAmount: 10_100_000,
    },
    {
      id: "ic-2024-06-27",
      loanId: loanId,
      paymentDate: new Date("2024-06-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "85080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-06-03"),
      paymentAmount: 10_100_000,
    },
    {
      id: "86080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-06-19"),
      paymentAmount: 20_200_000,
    },
    {
      id: "ic-2024-07-27",
      loanId: loanId,
      paymentDate: new Date("2024-07-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "87080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-07-20"),
      paymentAmount: 10_100_000,
    },
    {
      id: "ic-2024-08-27",
      loanId: loanId,
      paymentDate: new Date("2024-08-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "88080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-08-19"),
      paymentAmount: 10_100_000,
    },
    {
      id: "ic-2024-09-27",
      loanId: loanId,
      paymentDate: new Date("2024-09-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "ic-2024-10-27",
      loanId: loanId,
      paymentDate: new Date("2024-10-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "89180f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2024-11-20"),
      paymentAmount: 10_100_000,
    },
    {
      id: "ic-2024-11-27",
      loanId: loanId,
      paymentDate: new Date("2024-11-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "ic-2024-12-27",
      loanId: loanId,
      paymentDate: new Date("2024-12-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "91080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2025-01-03"),
      paymentAmount: 30_300_000,
    },
    {
      id: "ic-2025-01-27",
      loanId: loanId,
      paymentDate: new Date("2025-01-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "92080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2025-02-05"),
      paymentAmount: 36_360_000,
    },
    {
      id: "ic-2025-02-27",
      loanId: loanId,
      paymentDate: new Date("2025-02-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "ic-2025-03-27",
      loanId: loanId,
      paymentDate: new Date("2025-03-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "ic-2025-04-27",
      loanId: loanId,
      paymentDate: new Date("2025-04-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "93080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2025-05-10"),
      paymentAmount: 25_250_000,
    },
    {
      id: "94080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2025-05-14"),
      paymentAmount: 30_300_000,
    },
    {
      id: "ic-2025-05-27",
      loanId: loanId,
      paymentDate: new Date("2025-05-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "95080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2025-06-04"),
      paymentAmount: 45_450_000,
    },
    {
      id: "ic-2025-06-27",
      loanId: loanId,
      paymentDate: new Date("2025-06-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "96080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2025-07-30"),
      paymentAmount: 20_200_000,
    },
    {
      id: "ic-2025-07-27",
      loanId: loanId,
      paymentDate: new Date("2025-07-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "97080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2025-08-24"),
      paymentAmount: 30_300_000,
    },
    {
      id: "ic-2025-08-27",
      loanId: loanId,
      paymentDate: new Date("2025-08-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "98080f46-5aab-4132-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2025-09-25"),
      paymentAmount: 50_500_000,
    },
    {
      id: "ic-2025-09-27",
      loanId: loanId,
      paymentDate: new Date("2025-09-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "ic-2025-10-27",
      loanId: loanId,
      paymentDate: new Date("2025-10-27"),
      paymentAmount: 0,
      type: "INTEREST_COLLECTION",
    },
    {
      id: "69090e46-5aab-4162-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2025-11-10"),
      paymentAmount: 50_500_000,
    },
    {
      id: "69080f46-5aab-4162-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2025-11-20"),
      paymentAmount: 50_500_000,
    },
    {
      id: "69080f46-5aab-a162-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2025-11-23"),
      paymentAmount: 202_000_000,
    },
  ];

  for (const paymentData of paymentsData) {
    const payment = await prisma.payment.upsert({
      where: {
        id: paymentData.id!,
      },
      update: paymentData,
      create: paymentData,
    });
    console.log("Upserted payment:", payment);
  }

  console.log("Created loan:", loan);
}

console.log("Starting seeding script...");
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
