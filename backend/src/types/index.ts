import { z } from 'zod';

const snakeToCamelKeys: Record<string, string> = {
  release_year: 'releaseYear',
  runtime_minutes: 'runtimeMinutes',
  bundle_sizes: 'bundleSizes',
  group_size: 'groupSize',
};

function normalizeKeys(input: unknown): unknown {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return input;
  }

  const source = { ...(input as Record<string, unknown>) };

  for (const [snakeKey, camelKey] of Object.entries(snakeToCamelKeys)) {
    if (snakeKey in source) {
      if (!(camelKey in source)) {
        source[camelKey] = source[snakeKey];
      }
      delete source[snakeKey];
    }
  }

  return source;
}

const uniqueIdListSchema = z
  .array(z.number().int().positive())
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'Prerequisite IDs must be unique',
  });

const uniqueBundleSizesSchema = z
  .array(z.number().int().min(1).max(500))
  .min(1)
  .max(10)
  .refine((sizes) => new Set(sizes).size === sizes.length, {
    message: 'Bundle sizes must be unique',
  });

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createMovieSchema = z.preprocess(
  normalizeKeys,
  z.object({
    title: z.string().trim().min(1).max(255),
    releaseYear: z.number().int().min(1888).max(2100),
    runtimeMinutes: z.number().int().min(1).max(300),
    prerequisites: uniqueIdListSchema.optional(),
  })
);

export const updateMovieSchema = z.preprocess(
  normalizeKeys,
  z
    .object({
      title: z.string().trim().min(1).max(255).optional(),
      releaseYear: z.number().int().min(1888).max(2100).optional(),
      runtimeMinutes: z.number().int().min(1).max(300).optional(),
      watched: z.boolean().optional(),
      prerequisites: uniqueIdListSchema.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Request body must not be empty',
    })
);

export const createCinemaSchema = z.preprocess(
  normalizeKeys,
  z.object({
    name: z.string().trim().min(1).max(255),
    bundleSizes: uniqueBundleSizesSchema,
  })
);

export const bookingQuerySchema = z.preprocess(
  normalizeKeys,
  z.object({
    groupSize: z.coerce.number().int().min(1).max(10000),
  })
);

export type IdParamInput = z.infer<typeof idParamSchema>;
export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
export type CreateCinemaInput = z.infer<typeof createCinemaSchema>;
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
