import { PrismaClient } from "@prisma/client";
import { env, isProduction } from "../config/env";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isProduction ? ["error", "warn"] : ["error", "warn"],
  });

if (!isProduction) {
  global.__prisma = prisma;
}

void env; // ensures env is validated before prisma is first used
