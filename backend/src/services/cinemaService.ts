import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import type { CreateCinemaInput } from '../types/index.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import { calculateBookingQuote } from './bookingService.js';

const cinemaInclude = {
  bundles: { orderBy: { size: 'asc' } },
} satisfies Prisma.CinemaInclude;

type CinemaWithBundles = Prisma.CinemaGetPayload<{
  include: typeof cinemaInclude;
}>;

function toCinemaResponse(cinema: CinemaWithBundles) {
  return {
    id: cinema.id,
    name: cinema.name,
    bundleSizes: cinema.bundles.map((bundle) => bundle.size),
  };
}

function isPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

function assertUniqueBundleSizes(sizes: number[]): void {
  if (new Set(sizes).size !== sizes.length) {
    throw new AppError(
      400,
      ErrorCode.VALIDATION_ERROR,
      'Bundle sizes must be unique'
    );
  }
}

export async function listCinemas() {
  const cinemas = await prisma.cinema.findMany({
    include: cinemaInclude,
    orderBy: { id: 'asc' },
  });

  return cinemas.map(toCinemaResponse);
}

export async function createCinema(input: CreateCinemaInput) {
  assertUniqueBundleSizes(input.bundleSizes);

  try {
    const cinema = await prisma.cinema.create({
      data: {
        name: input.name,
        bundles: {
          create: input.bundleSizes.map((size) => ({ size })),
        },
      },
      include: cinemaInclude,
    });

    return toCinemaResponse(cinema);
  } catch (error) {
    if (isPrismaErrorCode(error, 'P2002')) {
      throw new AppError(
        409,
        ErrorCode.DUPLICATE_NAME,
        'A cinema with this name already exists'
      );
    }

    throw error;
  }
}

export async function getBookingQuote(cinemaId: number, groupSize: number) {
  const cinema = await prisma.cinema.findUnique({
    where: { id: cinemaId },
    include: cinemaInclude,
  });

  if (!cinema) {
    throw new AppError(
      404,
      ErrorCode.NOT_FOUND,
      `Cinema with id ${cinemaId} not found`
    );
  }

  const quote = calculateBookingQuote(
    cinema.bundles.map((bundle) => bundle.size),
    groupSize
  );

  return {
    cinema: toCinemaResponse(cinema),
    groupSize,
    ...quote,
  };
}
