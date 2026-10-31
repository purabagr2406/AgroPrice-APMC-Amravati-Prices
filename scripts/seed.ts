import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/mongodb";
import { Crop } from "../src/lib/models";
import { defaultCrops } from "../src/lib/crops";

loadEnvConfig(process.cwd());

async function seed() {
  await connectToDatabase();
  for (const crop of defaultCrops) {
    await Crop.updateOne({ nameEn: crop.nameEn }, { $setOnInsert: crop }, { upsert: true });
  }
  console.log(`Seeded ${defaultCrops.length} default crop records (existing crops were preserved).`);
}

seed()
  .catch((error: unknown) => {
    console.error("Crop seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
