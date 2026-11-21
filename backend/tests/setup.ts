import { execSync } from 'node:child_process';

const DEFAULT_TEST_DATABASE_URL =
  'postgresql://doomsday_user:doomsday_password@127.0.0.1:5433/doomsday_test?schema=public';

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL;

process.env.DATABASE_URL = testDatabaseUrl;

execSync('npx prisma migrate deploy', {
  stdio: 'ignore',
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
});

export async function resetDatabase(): Promise<void> {
  const { prisma } = await import('../src/db/prisma.js');

  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "movies", "cinemas", "movie_prerequisites", "cinema_bundles" RESTART IDENTITY CASCADE;'
  );
}

export async function resetAndSeedDatabase(): Promise<void> {
  await resetDatabase();

  const { seedDatabase } = await import('../prisma/seed.js');
  await seedDatabase();
}
