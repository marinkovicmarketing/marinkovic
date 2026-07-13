import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { generateDailySlate } from "@/lib/runGeneration";

generateDailySlate()
  .then((summary) => {
    for (const line of summary.messages) console.log(line);
  })
  .catch((err) => {
    console.error("Greška pri generisanju tipova:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
