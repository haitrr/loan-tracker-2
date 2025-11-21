import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Seeding database...");

  const loanId = "69080e46-5aab-4162-9795-eb4fc3ccf383";
  const loanData = {
    name: "House Loan",
    id: loanId,
    principal: 2000000000,
    fixedRate: 6.6,
    floatingRate: 7.5,
    fixedPeriodMonths: 24,
    totalTermMonths: 360,
    startDate: new Date("2024-02-26"),
    paymentFrequency: "monthly",
  };

  const loan = await prisma.loan.upsert({
    where: { id: loanId },
    update: loanData,
    create: loanData,
  });

  const paymentsData = [
    {
      id: "69080e46-5aab-4162-9795-eb4fc3ccf383",
      loanId: loanId,
      paymentDate: new Date("2025-11-19"),
      paymentAmount: 50_000_000,
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
