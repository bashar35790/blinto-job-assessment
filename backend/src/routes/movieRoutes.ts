import { Router } from 'express';
import * as movieService from '../services/movieService.js';
import {
  createMovieSchema,
  idParamSchema,
  updateMovieSchema,
} from '../types/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const movieRoutes = Router();

movieRoutes.get(
  '/',
  asyncHandler(async (_req, res) => {
    const movies = await movieService.listMovies();
    res.json(movies);
  })
);

movieRoutes.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createMovieSchema.parse(req.body);
    const movie = await movieService.createMovie(input);
    res.status(201).json(movie);
  })
);

movieRoutes.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const input = updateMovieSchema.parse(req.body);
    const movie = await movieService.updateMovie(id, input);
    res.json(movie);
  })
);

movieRoutes.get(
  '/:id/rewatch-order',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const result = await movieService.getRewatchOrder(id);
    res.json(result);
  })
);

export default movieRoutes;
