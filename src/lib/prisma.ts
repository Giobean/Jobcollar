import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDbPath(): string {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return path.join("/tmp", "jobcollar.db");
  }
  return path.join(process.cwd(), "prisma", "dev.db");
}

function ensureDatabase(dbPath: string): void {
  if (!fs.existsSync(dbPath)) {
    const schemaPath = path.join(process.cwd(), "prisma", "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const Database = require("better-sqlite3");
      const db = new Database(dbPath);
      db.exec(fs.readFileSync(schemaPath, "utf-8"));
      db.close();
    }
  }
}

function createPrismaClient(): PrismaClient {
  const dbPath = getDbPath();
  ensureDatabase(dbPath);
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
