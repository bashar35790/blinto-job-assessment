import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  api,
  ApiError,
  type CreateMoviePayload,
  type Movie,
  type UpdateMoviePayload,
} from '@/api/client';

export interface SerializedApiError {
  status?: number;
  code?: string;
  message: string;
}

export interface MoviesState {
  items: Movie[];
  rollbackItems: Movie[] | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  errorCode: string | null;
}

const initialState: MoviesState = {
  items: [],
  rollbackItems: null,
  loading: false,
  submitting: false,
  error: null,
  errorCode: null,
};

export const fetchMovies = createAsyncThunk<
  Movie[],
  { force?: boolean } | void,
  { rejectValue: SerializedApiError }
>('movies/fetchMovies', async (args, { rejectWithValue }) => {
  try {
    return await api.getMovies({ bypassCache: args?.force });
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }
    return rejectWithValue({
      message: error instanceof Error ? error.message : 'Failed to fetch movies',
    });
  }
});

export const addMovie = createAsyncThunk<
  Movie,
  CreateMoviePayload,
  { rejectValue: SerializedApiError }
>('movies/addMovie', async (payload, { rejectWithValue }) => {
  try {
    return await api.createMovie(payload);
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }
    return rejectWithValue({
      message: error instanceof Error ? error.message : 'Failed to create movie',
    });
  }
});

export const updateMovie = createAsyncThunk<
  Movie,
  { id: number; data: UpdateMoviePayload },
  { rejectValue: SerializedApiError }
>('movies/updateMovie', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await api.updateMovie(id, data);
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }
    return rejectWithValue({
      message: error instanceof Error ? error.message : 'Failed to update movie',
    });
  }
});

export const moviesSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    clearMovieError: (state) => {
      state.error = null;
      state.errorCode = null;
    },
  },
  extraReducers: (builder) => {
    // fetchMovies
    builder.addCase(fetchMovies.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.errorCode = null;
    });
    builder.addCase(fetchMovies.fulfilled, (state, action: PayloadAction<Movie[]>) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchMovies.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message || 'Failed to fetch movies';
      state.errorCode = action.payload?.code || 'FETCH_ERROR';
    });

    // addMovie
    builder.addCase(addMovie.pending, (state) => {
      state.submitting = true;
      state.error = null;
      state.errorCode = null;
    });
    builder.addCase(addMovie.fulfilled, (state, action: PayloadAction<Movie>) => {
      state.submitting = false;
      state.items.push(action.payload);
    });
    builder.addCase(addMovie.rejected, (state, action) => {
      state.submitting = false;
      state.error = action.payload?.message || action.error.message || 'Failed to add movie';
      state.errorCode = action.payload?.code || 'CREATE_ERROR';
    });

    // updateMovie (with optimistic updates and rollback on failure)
    builder.addCase(updateMovie.pending, (state, action) => {
      state.error = null;
      state.errorCode = null;
      // Save snapshot for rollback
      state.rollbackItems = JSON.parse(JSON.stringify(state.items));

      const { id, data } = action.meta.arg;
      const index = state.items.findIndex((m) => m.id === id);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.releaseYear !== undefined ? { releaseYear: data.releaseYear } : {}),
          ...(data.runtimeMinutes !== undefined ? { runtimeMinutes: data.runtimeMinutes } : {}),
          ...(data.watched !== undefined ? { watched: data.watched } : {}),
        };
      }
    });
    builder.addCase(updateMovie.fulfilled, (state, action: PayloadAction<Movie>) => {
      state.rollbackItems = null;
      const index = state.items.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    });
    builder.addCase(updateMovie.rejected, (state, action) => {
      // Revert optimistic update
      if (state.rollbackItems) {
        state.items = state.rollbackItems;
        state.rollbackItems = null;
      }
      state.error = action.payload?.message || action.error.message || 'Failed to update movie';
      state.errorCode = action.payload?.code || 'UPDATE_ERROR';
    });
    // Listen to rewatch plan toggle to keep movie catalog synchronized without extra network round-trips
    builder.addCase('rewatch/toggleWatchedFromPlan/fulfilled', (state, action: any) => {
      const arg = action.meta?.arg;
      if (arg?.movieId !== undefined) {
        const movie = state.items.find((m) => m.id === arg.movieId);
        if (movie) {
          movie.watched = arg.watched;
        }
      }
    });
  },
});

export const { clearMovieError } = moviesSlice.actions;
export default moviesSlice.reducer;
