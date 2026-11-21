import { Router } from 'express';
import * as cinemaService from '../services/cinemaService.js';
import {
  bookingQuerySchema,
  createCinemaSchema,
  idParamSchema,
} from '../types/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const cinemaRoutes = Router();

cinemaRoutes.get(
  '/',
  asyncHandler(async (_req, res) => {
    const cinemas = await cinemaService.listCinemas();
    res.json(cinemas);
  })
);

cinemaRoutes.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createCinemaSchema.parse(req.body);
    const cinema = await cinemaService.createCinema(input);
    res.status(201).json(cinema);
  })
);

cinemaRoutes.get(
  '/:id/booking',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const { groupSize } = bookingQuerySchema.parse(req.query);
    const quote = await cinemaService.getBookingQuote(id, groupSize);
    res.json(quote);
  })
);

export default cinemaRoutes;
