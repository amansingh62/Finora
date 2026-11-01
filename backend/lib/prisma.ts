
import "dotenv/config";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
  connectionString,

  // Maximum connections in this application instance.
  max: 5,

  // Wait up to 15 seconds for a connection.
  connectionTimeoutMillis: 15_000,

  // Close unused connections after 10 seconds.
  // Helps avoid keeping stale connections during Neon inactivity.
  idleTimeoutMillis: 10_000,

  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
});

// Capture unexpected errors from idle connections.
pool.on("error", (error) => {
  console.error("PostgreSQL idle pool error:", error);
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  transactionOptions: {
    maxWait: 10_000,
    timeout: 15_000,
  },
});

export { prisma };
