import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  api,
  ApiError,
  type BookingQuote,
  type Cinema,
  type CreateCinemaPayload,
} from '@/api/client';
import type { SerializedApiError } from './moviesSlice';

export interface BookingState {
  cinemas: Cinema[];
  selectedCinemaId: number | null;
  groupSize: number;
  quote: BookingQuote | null;
  loadingCinemas: boolean;
  loadingQuote: boolean;
  creatingCinema: boolean;
  error: string | null;
  errorCode: string | null;
}

const initialState: BookingState = {
  cinemas: [],
  selectedCinemaId: null,
  groupSize: 6,
  quote: null,
  loadingCinemas: false,
  loadingQuote: false,
  creatingCinema: false,
  error: null,
  errorCode: null,
};

export const fetchCinemas = createAsyncThunk<
  Cinema[],
  { force?: boolean } | void,
  { rejectValue: SerializedApiError }
>('booking/fetchCinemas', async (args, { rejectWithValue }) => {
  try {
    return await api.getCinemas({ bypassCache: args?.force });
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }
    return rejectWithValue({
      message: error instanceof Error ? error.message : 'Failed to fetch cinemas',
    });
  }
});

export const createCinema = createAsyncThunk<
  Cinema,
  CreateCinemaPayload,
  { rejectValue: SerializedApiError }
>('booking/createCinema', async (payload, { rejectWithValue }) => {
  try {
    return await api.createCinema(payload);
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }
    return rejectWithValue({
      message: error instanceof Error ? error.message : 'Failed to create cinema',
    });
  }
});

export const getBookingQuote = createAsyncThunk<
  BookingQuote,
  { cinemaId: number; groupSize: number },
  { rejectValue: SerializedApiError }
>('booking/getBookingQuote', async ({ cinemaId, groupSize }, { rejectWithValue }) => {
  try {
    return await api.getBookingQuote(cinemaId, groupSize);
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }
    return rejectWithValue({
      message: error instanceof Error ? error.message : 'Failed to calculate quote',
    });
  }
});

export const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setSelectedCinemaId: (state, action: PayloadAction<number>) => {
      state.selectedCinemaId = action.payload;
      state.quote = null;
    },
    setGroupSize: (state, action: PayloadAction<number>) => {
      state.groupSize = action.payload;
    },
    clearBookingError: (state) => {
      state.error = null;
      state.errorCode = null;
    },
    clearQuote: (state) => {
      state.quote = null;
    },
  },
  extraReducers: (builder) => {
    // fetchCinemas
    builder.addCase(fetchCinemas.pending, (state) => {
      state.loadingCinemas = true;
      state.error = null;
      state.errorCode = null;
    });
    builder.addCase(
      fetchCinemas.fulfilled,
      (state, action: PayloadAction<Cinema[]>) => {
        state.loadingCinemas = false;
        state.cinemas = action.payload;
        if (state.selectedCinemaId === null && action.payload.length > 0) {
          state.selectedCinemaId = action.payload[0].id;
        }
      }
    );
    builder.addCase(fetchCinemas.rejected, (state, action) => {
      state.loadingCinemas = false;
      state.error = action.payload?.message || action.error.message || 'Failed to fetch cinemas';
      state.errorCode = action.payload?.code || 'FETCH_CINEMAS_ERROR';
    });

    // createCinema
    builder.addCase(createCinema.pending, (state) => {
      state.creatingCinema = true;
      state.error = null;
      state.errorCode = null;
    });
    builder.addCase(
      createCinema.fulfilled,
      (state, action: PayloadAction<Cinema>) => {
        state.creatingCinema = false;
        state.cinemas.push(action.payload);
        state.selectedCinemaId = action.payload.id;
      }
    );
    builder.addCase(createCinema.rejected, (state, action) => {
      state.creatingCinema = false;
      state.error = action.payload?.message || action.error.message || 'Failed to create cinema';
      state.errorCode = action.payload?.code || 'CREATE_CINEMA_ERROR';
    });

    // getBookingQuote
    builder.addCase(getBookingQuote.pending, (state) => {
      state.loadingQuote = true;
      state.error = null;
      state.errorCode = null;
    });
    builder.addCase(
      getBookingQuote.fulfilled,
      (state, action: PayloadAction<BookingQuote>) => {
        state.loadingQuote = false;
        state.quote = action.payload;
      }
    );
    builder.addCase(getBookingQuote.rejected, (state, action) => {
      state.loadingQuote = false;
      state.error = action.payload?.message || action.error.message || 'Failed to calculate quote';
      state.errorCode = action.payload?.code || 'QUOTE_ERROR';
    });
  },
});

export const {
  setSelectedCinemaId,
  setGroupSize,
  clearBookingError,
  clearQuote,
} = bookingSlice.actions;

export default bookingSlice.reducer;
