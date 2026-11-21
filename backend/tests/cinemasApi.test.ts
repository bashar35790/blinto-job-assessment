import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { resetAndSeedDatabase } from './setup.js';

interface CinemaDto {
  id: number;
  name: string;
  bundleSizes: number[];
}

interface BreakdownItemDto {
  size: number;
  count: number;
}

interface BookingQuoteDto {
  cinema: CinemaDto;
  groupSize: number;
  possible: boolean;
  totalBundles?: number;
  breakdown?: BreakdownItemDto[];
  message?: string;
}

async function fetchCinemas(): Promise<CinemaDto[]> {
  const response = await request(app).get('/api/cinemas');
  expect(response.status).toBe(200);
  return response.body as CinemaDto[];
}

function findByName(cinemas: CinemaDto[], name: string): CinemaDto {
  const cinema = cinemas.find((candidate) => candidate.name === name);

  if (!cinema) {
    throw new Error(`Cinema not found: ${name}`);
  }

  return cinema;
}

async function fetchQuote(id: number, groupSize: number): Promise<BookingQuoteDto> {
  const response = await request(app).get(
    `/api/cinemas/${id}/booking?groupSize=${groupSize}`
  );
  expect(response.status).toBe(200);
  return response.body as BookingQuoteDto;
}

beforeEach(async () => {
  await resetAndSeedDatabase();
});

describe('GET /api/cinemas', () => {
  it('returns the 4 seeded cinemas with sorted bundle sizes', async () => {
    const cinemas = await fetchCinemas();

    expect(cinemas).toHaveLength(4);
    expect(findByName(cinemas, 'Stark IMAX').bundleSizes).toEqual([6, 9, 20]);
    expect(findByName(cinemas, 'Avengers Megaplex').bundleSizes).toEqual([1, 3, 4]);
    expect(findByName(cinemas, 'Wakanda Royal Cinema').bundleSizes).toEqual([2, 5]);
    expect(findByName(cinemas, 'Retro Cinema 4-6').bundleSizes).toEqual([4, 6]);
  });
});

describe('Booking quotes (PDF scenarios)', () => {
  it('PDF Case 1: {1,3,4} for 6 -> 2 bundles (3 x 2)', async () => {
    const megaplex = findByName(await fetchCinemas(), 'Avengers Megaplex');
    const quote = await fetchQuote(megaplex.id, 6);

    expect(quote.possible).toBe(true);
    expect(quote.totalBundles).toBe(2);
    expect(quote.breakdown).toEqual([{ size: 3, count: 2 }]);
    expect(quote.cinema.name).toBe('Avengers Megaplex');
    expect(quote.groupSize).toBe(6);
  });

  it('PDF Case 2: {2,5} for 11 -> 4 bundles (5 x 1, 2 x 3)', async () => {
    const wakanda = findByName(await fetchCinemas(), 'Wakanda Royal Cinema');
    const quote = await fetchQuote(wakanda.id, 11);

    expect(quote.possible).toBe(true);
    expect(quote.totalBundles).toBe(4);
    expect(quote.breakdown).toEqual([
      { size: 5, count: 1 },
      { size: 2, count: 3 },
    ]);
  });

  it('PDF Case 3: {6,9,20} for 44 -> 4 bundles (20 x 1, 9 x 2, 6 x 1)', async () => {
    const stark = findByName(await fetchCinemas(), 'Stark IMAX');
    const quote = await fetchQuote(stark.id, 44);

    expect(quote.possible).toBe(true);
    expect(quote.totalBundles).toBe(4);
    expect(quote.breakdown).toEqual([
      { size: 20, count: 1 },
      { size: 9, count: 2 },
      { size: 6, count: 1 },
    ]);
  });

  it('PDF Case 4: {4,6} for 7 -> impossible', async () => {
    const retro = findByName(await fetchCinemas(), 'Retro Cinema 4-6');
    const quote = await fetchQuote(retro.id, 7);

    expect(quote.possible).toBe(false);
    expect(quote.message).toBe('No exact combination');
    expect(quote.totalBundles).toBeUndefined();
    expect(quote.breakdown).toBeUndefined();
  });

  it('accepts the snake_case group_size query alias', async () => {
    const stark = findByName(await fetchCinemas(), 'Stark IMAX');
    const response = await request(app).get(
      `/api/cinemas/${stark.id}/booking?group_size=44`
    );

    expect(response.status).toBe(200);
    expect(response.body.totalBundles).toBe(4);
  });
});

describe('Booking validation', () => {
  it('rejects missing, non-integer, and out-of-range group sizes', async () => {
    const stark = findByName(await fetchCinemas(), 'Stark IMAX');

    const queries = ['groupSize=0', 'groupSize=10001', 'groupSize=5.5', ''];

    for (const query of queries) {
      const response = await request(app).get(
        `/api/cinemas/${stark.id}/booking?${query}`
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    }
  });

  it('returns 400 for an invalid id and 404 for an unknown cinema', async () => {
    const invalid = await request(app).get('/api/cinemas/abc/booking?groupSize=10');
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toBe('VALIDATION_ERROR');

    const missing = await request(app).get(
      '/api/cinemas/999999/booking?groupSize=10'
    );
    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe('NOT_FOUND');
  });
});

describe('POST /api/cinemas', () => {
  it('creates a cinema with snake_case bundle sizes and uses it for quotes', async () => {
    const response = await request(app).post('/api/cinemas').send({
      name: 'Smoke Cinema',
      bundle_sizes: [13, 7],
    });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Smoke Cinema');
    expect(response.body.bundleSizes).toEqual([7, 13]);

    const quote = await fetchQuote(response.body.id, 20);
    expect(quote.possible).toBe(true);
    expect(quote.totalBundles).toBe(2);
    expect(quote.breakdown).toEqual([
      { size: 13, count: 1 },
      { size: 7, count: 1 },
    ]);
  });

  it('rejects a duplicate name case-insensitively with 409', async () => {
    const response = await request(app).post('/api/cinemas').send({
      name: 'stark imax',
      bundleSizes: [2],
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('DUPLICATE_NAME');
  });

  it('rejects invalid bundle configurations', async () => {
    const payloads = [
      { name: 'Empty Bundles', bundleSizes: [] },
      { name: 'Duplicate Sizes', bundleSizes: [6, 6] },
      { name: 'Too Many', bundleSizes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
      { name: 'Size Zero', bundleSizes: [0] },
      { name: 'Size Too Large', bundleSizes: [501] },
      { name: 'Non Integer', bundleSizes: [2.5] },
    ];

    for (const payload of payloads) {
      const response = await request(app).post('/api/cinemas').send(payload);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    }
  });
});
