import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

function parseCsv(filePath: string) {
  const buf = readFileSync(filePath);
  const content = new TextDecoder("euc-kr").decode(buf);
  const lines = content.trim().replace(/\r/g, "").split("\n");
  const headers = lines[0].split(";").map((h) => h.replace(/"/g, ""));

  return lines.slice(1).map((line) => {
    const values = line.split(";").map((v) => v.replace(/"/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}

async function main() {
  const banksPath = resolve(__dirname, "../../data/banks.csv");
  const prefixesPath = resolve(__dirname, "../../data/banks_prefixes.csv");

  const banksData = parseCsv(banksPath);
  const prefixesData = parseCsv(prefixesPath);

  await prisma.bank.createMany({
    data: banksData.map((row) => ({
      id: Number(row.id),
      bankCode: row.bank_code,
      bankName: row.bank_name,
    })),
    skipDuplicates: true,
  });

  await prisma.bankPrefix.createMany({
    data: prefixesData.map((row) => ({
      id: Number(row.id),
      bankId: Number(row.bank_id),
      prefix: row.prefix,
    })),
    skipDuplicates: true,
  });

  const bankCount = await prisma.bank.count();
  const prefixCount = await prisma.bankPrefix.count();
  console.log(`Seeded: ${bankCount} banks, ${prefixCount} bank prefixes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
