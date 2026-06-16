import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const url = process.env.DATABASE_URL ?? "file:./dev.db";
// Use the libSQL/Turso driver adapter for remote databases (libsql:// or
// http(s)://). Vercel's filesystem is read-only, so writes — the weekly price
// cron and the enrich scripts — need a remote libSQL/Turso DB. Local dev keeps
// the plain SQLite file.
const isRemote = /^(libsql:|wss?:|https?:)/.test(url);

function createClient(): PrismaClient {
  const log: ("warn" | "error")[] =
    process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

  if (isRemote) {
    const adapter = new PrismaLibSQL({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
