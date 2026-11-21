import { Prisma, PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

const MAX_TRIES = 3;
const BASE_DELAY_MS = 100;

function isWriteConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  );
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isLastAttempt = attempt === MAX_TRIES - 1;

      if (!isWriteConflict(error) || isLastAttempt) {
        throw error;
      }

      const delayMs = BASE_DELAY_MS * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Unreachable: retry loop exhausted without result');
}
