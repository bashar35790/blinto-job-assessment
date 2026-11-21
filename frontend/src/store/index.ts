import { configureStore } from '@reduxjs/toolkit';
import bookingReducer from './slices/bookingSlice';
import moviesReducer from './slices/moviesSlice';
import rewatchReducer from './slices/rewatchSlice';

export const store = configureStore({
  reducer: {
    movies: moviesReducer,
    rewatch: rewatchReducer,
    booking: bookingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
