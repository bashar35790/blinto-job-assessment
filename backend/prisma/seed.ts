import { pathToFileURL } from 'node:url';
import { prisma } from '../src/db/prisma.js';

interface SeedMovie {
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  prerequisites: string[];
}

interface SeedCinema {
  name: string;
  bundleSizes: number[];
}

const movies: SeedMovie[] = [
  {
    title: 'Iron Man',
    releaseYear: 2008,
    runtimeMinutes: 126,
    prerequisites: [],
  },
  {
    title: 'Captain America: The First Avenger',
    releaseYear: 2011,
    runtimeMinutes: 124,
    prerequisites: [],
  },
  {
    title: 'The Avengers',
    releaseYear: 2012,
    runtimeMinutes: 143,
    prerequisites: ['Iron Man', 'Captain America: The First Avenger'],
  },
  {
    title: 'Captain America: Civil War',
    releaseYear: 2016,
    runtimeMinutes: 147,
    prerequisites: ['The Avengers'],
  },
  {
    title: 'Thor: Ragnarok',
    releaseYear: 2017,
    runtimeMinutes: 130,
    prerequisites: [],
  },
  {
    title: 'Avengers: Infinity War',
    releaseYear: 2018,
    runtimeMinutes: 149,
    prerequisites: ['Captain America: Civil War', 'Thor: Ragnarok'],
  },
  {
    title: 'Avengers: Endgame',
    releaseYear: 2019,
    runtimeMinutes: 181,
    prerequisites: ['Avengers: Infinity War'],
  },
  {
    title: 'Avengers: Doomsday',
    releaseYear: 2026,
    runtimeMinutes: 180,
    prerequisites: ['Avengers: Endgame'],
  },
];

const cinemas: SeedCinema[] = [
  { name: 'Stark IMAX', bundleSizes: [6, 9, 20] },
  { name: 'Avengers Megaplex', bundleSizes: [1, 3, 4] },
  { name: 'Wakanda Royal Cinema', bundleSizes: [2, 5] },
  { name: 'Retro Cinema 4-6', bundleSizes: [4, 6] },
];

async function upsertMovie(movie: SeedMovie) {
  const existing = await prisma.movie.findFirst({
    where: { title: { equals: movie.title, mode: 'insensitive' } },
  });

  const data = {
    title: movie.title,
    releaseYear: movie.releaseYear,
    runtimeMinutes: movie.runtimeMinutes,
  };

  if (existing) {
    return prisma.movie.update({ where: { id: existing.id }, data });
  }

  return prisma.movie.create({ data });
}

async function upsertCinema(cinema: SeedCinema) {
  const existing = await prisma.cinema.findFirst({
    where: { name: { equals: cinema.name, mode: 'insensitive' } },
  });

  const data = { name: cinema.name };

  if (existing) {
    return prisma.cinema.update({ where: { id: existing.id }, data });
  }

  return prisma.cinema.create({ data });
}

async function seedMovies() {
  const movieIds = new Map<string, number>();

  for (const movie of movies) {
    const record = await upsertMovie(movie);
    movieIds.set(movie.title, record.id);
  }

  for (const movie of movies) {
    const movieId = movieIds.get(movie.title);

    if (movieId === undefined) {
      continue;
    }

    for (const prerequisiteTitle of movie.prerequisites) {
      const prerequisiteId = movieIds.get(prerequisiteTitle);

      if (prerequisiteId === undefined) {
        continue;
      }

      await prisma.moviePrerequisite.upsert({
        where: {
          movieId_prerequisiteId: { movieId, prerequisiteId },
        },
        update: {},
        create: { movieId, prerequisiteId },
      });
    }
  }
}

async function seedCinemas() {
  for (const cinema of cinemas) {
    const record = await upsertCinema(cinema);

    await prisma.cinemaBundle.deleteMany({
      where: {
        cinemaId: record.id,
        size: { notIn: cinema.bundleSizes },
      },
    });

    for (const size of cinema.bundleSizes) {
      await prisma.cinemaBundle.upsert({
        where: { cinemaId_size: { cinemaId: record.id, size } },
        update: {},
        create: { cinemaId: record.id, size },
      });
    }
  }
}

export async function seedDatabase(): Promise<void> {
  await seedMovies();
  await seedCinemas();
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exitCode = 1;
    });
}
