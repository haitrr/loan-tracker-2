import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log('Seeding database...');

  const loan = await prisma.loan.create({
    data: {
      name: 'Corporate Loan',
      principal: 2000000000,
      fixedRate: 6.6,
      floatingRate: 7.5,
      fixedPeriodMonths: 24,
      totalTermMonths: 360,
      startDate: new Date('2024-01-26'),
      paymentFrequency: 'monthly',
    },
  });

  console.log('Created loan:', loan);
}

console.log('Starting seeding script...');
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
