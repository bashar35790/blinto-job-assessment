import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { api, ApiError, type RewatchPlan } from '@/api/client';
import type { SerializedApiError } from './moviesSlice';

export interface RewatchState {
  targetMovieId: number | null;
  plan: RewatchPlan | null;
  loading: boolean;
  togglingId: number | null;
  error: string | null;
  errorCode: string | null;
}

const initialState: RewatchState = {
  targetMovieId: null,
  plan: null,
  loading: false,
  togglingId: null,
  error: null,
  errorCode: null,
};

export const fetchRewatchPlan = createAsyncThunk<
  RewatchPlan,
  number,
  { rejectValue: SerializedApiError }
>('rewatch/fetchRewatchPlan', async (movieId, { rejectWithValue }) => {
  try {
    return await api.getRewatchOrder(movieId);
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }
    return rejectWithValue({
      message: error instanceof Error ? error.message : 'Failed to fetch rewatch plan',
    });
  }
});

export const toggleWatchedFromPlan = createAsyncThunk<
  RewatchPlan,
  { movieId: number; watched: boolean; targetId: number },
  { rejectValue: SerializedApiError }
>(
  'rewatch/toggleWatchedFromPlan',
  async ({ movieId, watched, targetId }, { rejectWithValue }) => {
    try {
      // Step 1: Update movie watched status (invalidates cached catalog)
      await api.updateMovie(movieId, { watched });
      // Step 2: Refetch rewatch plan with bypassCache to recalculate metrics & topological sequence
      return await api.getRewatchOrder(targetId, { bypassCache: true });
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue({
          status: error.status,
          code: error.code,
          message: error.message,
        });
      }
      return rejectWithValue({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to toggle watched status and update plan',
      });
    }
  }
);

export const rewatchSlice = createSlice({
  name: 'rewatch',
  initialState,
  reducers: {
    setTargetMovieId: (state, action: PayloadAction<number>) => {
      state.targetMovieId = action.payload;
    },
    clearRewatchError: (state) => {
      state.error = null;
      state.errorCode = null;
    },
  },
  extraReducers: (builder) => {
    // fetchRewatchPlan
    builder.addCase(fetchRewatchPlan.pending, (state, action) => {
      state.loading = true;
      state.targetMovieId = action.meta.arg;
      state.error = null;
      state.errorCode = null;
    });
    builder.addCase(fetchRewatchPlan.fulfilled, (state, action: PayloadAction<RewatchPlan>) => {
      state.loading = false;
      state.plan = action.payload;
    });
    builder.addCase(fetchRewatchPlan.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message || 'Failed to fetch plan';
      state.errorCode = action.payload?.code || 'FETCH_PLAN_ERROR';
    });

    // toggleWatchedFromPlan
    builder.addCase(toggleWatchedFromPlan.pending, (state, action) => {
      state.togglingId = action.meta.arg.movieId;
      state.error = null;
      state.errorCode = null;
    });
    builder.addCase(
      toggleWatchedFromPlan.fulfilled,
      (state, action: PayloadAction<RewatchPlan>) => {
        state.togglingId = null;
        state.plan = action.payload;
      }
    );
    builder.addCase(toggleWatchedFromPlan.rejected, (state, action) => {
      state.togglingId = null;
      state.error = action.payload?.message || action.error.message || 'Failed to update watched status';
      state.errorCode = action.payload?.code || 'TOGGLE_ERROR';
    });
  },
});

export const { setTargetMovieId, clearRewatchError } = rewatchSlice.actions;
export default rewatchSlice.reducer;
