import { Prisma } from '@prisma/client';
import { executeWithRetry, prisma } from '../db/prisma.js';
import type { CreateMovieInput, UpdateMovieInput } from '../types/index.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import { computeRewatchOrder, hasCycle, type MovieNode } from './graphService.js';

const movieInclude = {
  prerequisites: {
    include: { prerequisite: true },
    orderBy: { prerequisiteId: 'asc' },
  },
} satisfies Prisma.MovieInclude;

type MovieWithPrerequisites = Prisma.MovieGetPayload<{
  include: typeof movieInclude;
}>;

interface MovieSummarySource {
  id: number;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
}

function toMovieSummary(movie: MovieSummarySource) {
  return {
    id: movie.id,
    title: movie.title,
    releaseYear: movie.releaseYear,
    runtimeMinutes: movie.runtimeMinutes,
    watched: movie.watched,
  };
}

function toMovieResponse(movie: MovieWithPrerequisites) {
  return {
    ...toMovieSummary(movie),
    prerequisites: movie.prerequisites.map((link) =>
      toMovieSummary(link.prerequisite)
    ),
  };
}

function isPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

async function runSerializable<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  try {
    return await executeWithRetry(() =>
      prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    );
  } catch (error) {
    if (isPrismaErrorCode(error, 'P2002')) {
      throw new AppError(
        409,
        ErrorCode.DUPLICATE_TITLE,
        'A movie with this title already exists'
      );
    }

    throw error;
  }
}

function assertUniquePrerequisites(ids: number[]): void {
  if (new Set(ids).size !== ids.length) {
    throw new AppError(
      400,
      ErrorCode.VALIDATION_ERROR,
      'Prerequisite IDs must be unique'
    );
  }
}

async function assertPrerequisitesExist(
  tx: Prisma.TransactionClient,
  ids: number[]
): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  const found = await tx.movie.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  const foundIds = new Set(found.map((movie) => movie.id));
  const missing = ids.filter((id) => !foundIds.has(id));

  if (missing.length > 0) {
    throw new AppError(
      400,
      ErrorCode.VALIDATION_ERROR,
      `Unknown prerequisite IDs: ${missing.join(', ')}`
    );
  }
}

async function loadGraph(
  tx: Prisma.TransactionClient
): Promise<Map<number, number[]>> {
  const [movies, links] = await Promise.all([
    tx.movie.findMany({ select: { id: true } }),
    tx.moviePrerequisite.findMany({
      select: { movieId: true, prerequisiteId: true },
    }),
  ]);

  const graph = new Map<number, number[]>();

  for (const movie of movies) {
    graph.set(movie.id, []);
  }

  for (const link of links) {
    const neighbors = graph.get(link.movieId);

    if (neighbors) {
      neighbors.push(link.prerequisiteId);
    } else {
      graph.set(link.movieId, [link.prerequisiteId]);
    }
  }

  return graph;
}

export async function listMovies() {
  const movies = await prisma.movie.findMany({
    include: movieInclude,
    orderBy: { id: 'asc' },
  });

  return movies.map(toMovieResponse);
}

export async function createMovie(input: CreateMovieInput) {
  const prerequisiteIds = input.prerequisites ?? [];
  assertUniquePrerequisites(prerequisiteIds);

  return runSerializable(async (tx) => {
    await assertPrerequisitesExist(tx, prerequisiteIds);

    const movie = await tx.movie.create({
      data: {
        title: input.title,
        releaseYear: input.releaseYear,
        runtimeMinutes: input.runtimeMinutes,
        ...(prerequisiteIds.length > 0
          ? {
              prerequisites: {
                create: prerequisiteIds.map((prerequisiteId) => ({
                  prerequisiteId,
                })),
              },
            }
          : {}),
      },
      include: movieInclude,
    });

    return toMovieResponse(movie);
  });
}

export async function updateMovie(id: number, input: UpdateMovieInput) {
  const prerequisiteIds = input.prerequisites;

  if (prerequisiteIds !== undefined) {
    assertUniquePrerequisites(prerequisiteIds);
  }

  return runSerializable(async (tx) => {
    const existing = await tx.movie.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError(404, ErrorCode.NOT_FOUND, `Movie with id ${id} not found`);
    }

    if (prerequisiteIds !== undefined) {
      await assertPrerequisitesExist(tx, prerequisiteIds);

      const graph = await loadGraph(tx);

      if (hasCycle(graph, id, prerequisiteIds)) {
        throw new AppError(
          409,
          ErrorCode.CIRCULAR_DEPENDENCY,
          'The requested prerequisites would create a circular dependency'
        );
      }
    }

    const data: Prisma.MovieUpdateInput = {};

    if (input.title !== undefined) {
      data.title = input.title;
    }
    if (input.releaseYear !== undefined) {
      data.releaseYear = input.releaseYear;
    }
    if (input.runtimeMinutes !== undefined) {
      data.runtimeMinutes = input.runtimeMinutes;
    }
    if (input.watched !== undefined) {
      data.watched = input.watched;
    }
    if (prerequisiteIds !== undefined) {
      data.prerequisites = {
        deleteMany: {},
        create: prerequisiteIds.map((prerequisiteId) => ({ prerequisiteId })),
      };
    }

    const movie = await tx.movie.update({
      where: { id },
      data,
      include: movieInclude,
    });

    return toMovieResponse(movie);
  });
}

export async function getRewatchOrder(id: number) {
  const [target, movies, links] = await Promise.all([
    prisma.movie.findUnique({ where: { id }, include: movieInclude }),
    prisma.movie.findMany(),
    prisma.moviePrerequisite.findMany(),
  ]);

  if (!target) {
    throw new AppError(404, ErrorCode.NOT_FOUND, `Movie with id ${id} not found`);
  }

  const graph = new Map<number, number[]>();
  const moviesMap = new Map<number, MovieNode>();

  for (const movie of movies) {
    graph.set(movie.id, []);
    moviesMap.set(movie.id, {
      id: movie.id,
      title: movie.title,
      runtimeMinutes: movie.runtimeMinutes,
      watched: movie.watched,
      releaseYear: movie.releaseYear,
    });
  }

  for (const link of links) {
    const neighbors = graph.get(link.movieId);

    if (neighbors) {
      neighbors.push(link.prerequisiteId);
    } else {
      graph.set(link.movieId, [link.prerequisiteId]);
    }
  }

  const plan = computeRewatchOrder(id, graph, moviesMap);

  return {
    target: toMovieResponse(target),
    ...plan,
  };
}
