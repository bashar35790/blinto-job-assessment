import cors from 'cors';
import express from 'express';
import { cinemaRoutes } from './routes/cinemaRoutes.js';
import { movieRoutes } from './routes/movieRoutes.js';
import { ErrorCode, errorHandler } from './utils/errors.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/movies', movieRoutes);
app.use('/api/cinemas', cinemaRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: ErrorCode.NOT_FOUND,
    message: 'Route not found',
  });
});

app.use(errorHandler);

export default app;
