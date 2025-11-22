import "dotenv/config";
import { prisma } from "@/lib/prisma";

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
    scheduledPayments.push({
      paymentNumber: i,
      scheduledDate: new Date(currentDate),
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
      paymentAmount: 12_120_000,
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
