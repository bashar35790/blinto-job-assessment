import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { resetAndSeedDatabase } from './setup.js';

interface MovieSummaryDto {
  id: number;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
}

interface MovieDto extends MovieSummaryDto {
  prerequisites: MovieSummaryDto[];
}

interface RewatchOrderDto {
  target: MovieDto;
  order: MovieSummaryDto[];
  watchedCount: number;
  totalCount: number;
  remainingRuntimeMinutes: number;
}

async function fetchMovies(): Promise<MovieDto[]> {
  const response = await request(app).get('/api/movies');
  expect(response.status).toBe(200);
  return response.body as MovieDto[];
}

function findByTitle(movies: MovieDto[], title: string): MovieDto {
  const movie = movies.find((candidate) => candidate.title === title);

  if (!movie) {
    throw new Error(`Movie not found: ${title}`);
  }

  return movie;
}

async function fetchRewatchOrder(id: number): Promise<RewatchOrderDto> {
  const response = await request(app).get(`/api/movies/${id}/rewatch-order`);
  expect(response.status).toBe(200);
  return response.body as RewatchOrderDto;
}

beforeEach(async () => {
  await resetAndSeedDatabase();
});

describe('GET /api/movies', () => {
  it('returns the 8 seeded movies with their prerequisites', async () => {
    const movies = await fetchMovies();

    expect(movies).toHaveLength(8);
    expect(findByTitle(movies, 'Avengers: Doomsday').prerequisites.map((p) => p.title)).toEqual([
      'Avengers: Endgame',
    ]);
    expect(findByTitle(movies, 'The Avengers').prerequisites.map((p) => p.title)).toEqual([
      'Iron Man',
      'Captain America: The First Avenger',
    ]);
  });
});

describe('Rewatch order (PDF scenarios)', () => {
  it('PDF Case 1: Doomsday returns all 7 other movies in a valid order', async () => {
    const movies = await fetchMovies();
    const doomsday = findByTitle(movies, 'Avengers: Doomsday');
    const plan = await fetchRewatchOrder(doomsday.id);

    expect(plan.target.title).toBe('Avengers: Doomsday');
    expect(plan.totalCount).toBe(7);
    expect(plan.order).toHaveLength(7);

    const titles = plan.order.map((movie) => movie.title);
    expect(titles).not.toContain('Avengers: Doomsday');

    expect(titles.indexOf('Iron Man')).toBeLessThan(titles.indexOf('The Avengers'));
    expect(titles.indexOf('Captain America: The First Avenger')).toBeLessThan(
      titles.indexOf('The Avengers')
    );
    expect(titles.indexOf('The Avengers')).toBeLessThan(
      titles.indexOf('Captain America: Civil War')
    );
    expect(titles.indexOf('Captain America: Civil War')).toBeLessThan(
      titles.indexOf('Avengers: Infinity War')
    );
    expect(titles.indexOf('Thor: Ragnarok')).toBeLessThan(
      titles.indexOf('Avengers: Infinity War')
    );
    expect(titles.indexOf('Avengers: Infinity War')).toBeLessThan(
      titles.indexOf('Avengers: Endgame')
    );

    expect(plan.watchedCount).toBe(0);
    expect(plan.remainingRuntimeMinutes).toBe(
      126 + 124 + 143 + 147 + 130 + 149 + 181
    );
  });

  it('PDF Case 2: Civil War returns Iron Man & First Avenger, then The Avengers', async () => {
    const movies = await fetchMovies();
    const civilWar = findByTitle(movies, 'Captain America: Civil War');
    const plan = await fetchRewatchOrder(civilWar.id);

    expect(plan.totalCount).toBe(3);

    const titles = plan.order.map((movie) => movie.title);
    expect(titles).not.toContain('Captain America: Civil War');
    expect(new Set(titles)).toEqual(
      new Set([
        'Iron Man',
        'Captain America: The First Avenger',
        'The Avengers',
      ])
    );
    expect(titles.indexOf('Iron Man')).toBeLessThan(titles.indexOf('The Avengers'));
    expect(titles.indexOf('Captain America: The First Avenger')).toBeLessThan(
      titles.indexOf('The Avengers')
    );
  });

  it('PDF Case 3: Thor: Ragnarok returns an empty list', async () => {
    const movies = await fetchMovies();
    const ragnarok = findByTitle(movies, 'Thor: Ragnarok');
    const plan = await fetchRewatchOrder(ragnarok.id);

    expect(plan.totalCount).toBe(0);
    expect(plan.order).toEqual([]);
    expect(plan.watchedCount).toBe(0);
    expect(plan.remainingRuntimeMinutes).toBe(0);
  });

  it('PDF Case 4: Endgame as a prerequisite of Iron Man is rejected with no write', async () => {
    const movies = await fetchMovies();
    const ironMan = findByTitle(movies, 'Iron Man');
    const endgame = findByTitle(movies, 'Avengers: Endgame');

    const response = await request(app)
      .patch(`/api/movies/${ironMan.id}`)
      .send({ prerequisites: [endgame.id] });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('CIRCULAR_DEPENDENCY');

    const after = findByTitle(await fetchMovies(), 'Iron Man');
    expect(after.prerequisites).toEqual([]);
  });

  it('reflects watched milestones in the rewatch metrics', async () => {
    const movies = await fetchMovies();
    const ironMan = findByTitle(movies, 'Iron Man');
    const civilWar = findByTitle(movies, 'Captain America: Civil War');

    const patch = await request(app)
      .patch(`/api/movies/${ironMan.id}`)
      .send({ watched: true });
    expect(patch.status).toBe(200);

    const plan = await fetchRewatchOrder(civilWar.id);
    expect(plan.watchedCount).toBe(1);
    expect(plan.remainingRuntimeMinutes).toBe(124 + 143);
  });
});

describe('PATCH /api/movies/:id', () => {
  it('updates watched and atomically replaces prerequisites', async () => {
    const movies = await fetchMovies();
    const ragnarok = findByTitle(movies, 'Thor: Ragnarok');
    const ironMan = findByTitle(movies, 'Iron Man');

    const response = await request(app)
      .patch(`/api/movies/${ragnarok.id}`)
      .send({ watched: true, prerequisites: [ironMan.id] });

    expect(response.status).toBe(200);
    expect(response.body.watched).toBe(true);
    expect(response.body.prerequisites.map((p: MovieSummaryDto) => p.title)).toEqual([
      'Iron Man',
    ]);
  });

  it('accepts prerequisites: [] to clear the list', async () => {
    const movies = await fetchMovies();
    const civilWar = findByTitle(movies, 'Captain America: Civil War');

    const response = await request(app)
      .patch(`/api/movies/${civilWar.id}`)
      .send({ prerequisites: [] });

    expect(response.status).toBe(200);
    expect(response.body.prerequisites).toEqual([]);
  });

  it('returns 404 for an unknown movie', async () => {
    const response = await request(app)
      .patch('/api/movies/999999')
      .send({ watched: true });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('NOT_FOUND');
  });

  it('rejects invalid ids, empty bodies, non-boolean watched, duplicate and unknown prerequisites', async () => {
    const movies = await fetchMovies();
    const ironMan = findByTitle(movies, 'Iron Man');

    const responses = [
      await request(app).patch('/api/movies/abc').send({ watched: true }),
      await request(app).patch('/api/movies/1.5').send({ watched: true }),
      await request(app).patch(`/api/movies/${ironMan.id}`).send({}),
      await request(app)
        .patch(`/api/movies/${ironMan.id}`)
        .send({ watched: 'yes' }),
      await request(app)
        .patch(`/api/movies/${ironMan.id}`)
        .send({ prerequisites: [ironMan.id, ironMan.id] }),
      await request(app)
        .patch(`/api/movies/${ironMan.id}`)
        .send({ prerequisites: [999999] }),
    ];

    for (const response of responses) {
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(typeof response.body.message).toBe('string');
    }
  });
});

describe('POST /api/movies', () => {
  it('creates a movie with snake_case aliases and prerequisites', async () => {
    const ironMan = findByTitle(await fetchMovies(), 'Iron Man');

    const response = await request(app).post('/api/movies').send({
      title: '  Iron Man 2  ',
      release_year: 2010,
      runtime_minutes: 124,
      prerequisites: [ironMan.id],
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: 'Iron Man 2',
      releaseYear: 2010,
      runtimeMinutes: 124,
      watched: false,
    });
    expect(response.body.prerequisites.map((p: MovieSummaryDto) => p.title)).toEqual([
      'Iron Man',
    ]);
  });

  it('rejects a duplicate title case-insensitively with 409', async () => {
    const response = await request(app).post('/api/movies').send({
      title: 'iron man',
      releaseYear: 2008,
      runtimeMinutes: 126,
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('DUPLICATE_TITLE');
  });

  it('rejects unknown prerequisite ids with 400', async () => {
    const response = await request(app).post('/api/movies').send({
      title: 'Phantom Movie',
      releaseYear: 2024,
      runtimeMinutes: 100,
      prerequisites: [999999],
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/movies/:id/rewatch-order errors', () => {
  it('returns 400 for an invalid id and 404 for an unknown movie', async () => {
    const invalid = await request(app).get('/api/movies/abc/rewatch-order');
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toBe('VALIDATION_ERROR');

    const missing = await request(app).get('/api/movies/999999/rewatch-order');
    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe('NOT_FOUND');
  });
});
