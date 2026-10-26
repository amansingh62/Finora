import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
  max: 10,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 10_000,
});

const prisma = new PrismaClient({
  adapter,
  transactionOptions: {
    maxWait: 10_000,
    timeout: 15_000,
  },
});

export { prisma };