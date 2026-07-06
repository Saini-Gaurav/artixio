import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Avoid spinning up multiple PrismaClient instances when nodemon hot-reloads in dev - keep one on the global object.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: env.isProduction ? ["error", "warn"] : ["query", "error", "warn"],
  });

if (!env.isProduction) {
  global.__prisma = prisma;
}
