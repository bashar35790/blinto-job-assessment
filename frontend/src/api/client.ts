export interface MovieSummary {
  id: number;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
}

export interface Movie extends MovieSummary {
  prerequisites: MovieSummary[];
}

export interface CreateMoviePayload {
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  prerequisites?: number[];
}

export interface UpdateMoviePayload {
  title?: string;
  releaseYear?: number;
  runtimeMinutes?: number;
  watched?: boolean;
  prerequisites?: number[];
}

export interface RewatchOrderItem {
  id: number;
  title: string;
  runtimeMinutes: number;
  watched: boolean;
}

export interface RewatchPlan {
  target: Movie;
  order: RewatchOrderItem[];
  watchedCount: number;
  totalCount: number;
  remainingRuntimeMinutes: number;
}

export interface Cinema {
  id: number;
  name: string;
  bundleSizes: number[];
}

export interface CreateCinemaPayload {
  name: string;
  bundleSizes: number[];
}

export interface BundleBreakdownItem {
  size: number;
  count: number;
}

export interface BookingQuote {
  cinema: Cinema;
  groupSize: number;
  possible: boolean;
  totalBundles?: number;
  breakdown?: BundleBreakdownItem[];
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = `HTTP error ${response.status}`;

    try {
      const data = (await response.json()) as ApiErrorResponse;
      if (data.error) {
        errorCode = data.error;
      }
      if (data.message) {
        errorMessage = data.message;
      }
    } catch {
      // Non-JSON response body fallback
    }

    throw new ApiError(response.status, errorCode, errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Movie endpoints
  getMovies(): Promise<Movie[]> {
    return request<Movie[]>('/api/movies');
  },

  createMovie(payload: CreateMoviePayload): Promise<Movie> {
    return request<Movie>('/api/movies', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateMovie(id: number, payload: UpdateMoviePayload): Promise<Movie> {
    return request<Movie>(`/api/movies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  getRewatchOrder(id: number): Promise<RewatchPlan> {
    return request<RewatchPlan>(`/api/movies/${id}/rewatch-order`);
  },

  // Cinema endpoints
  getCinemas(): Promise<Cinema[]> {
    return request<Cinema[]>('/api/cinemas');
  },

  createCinema(payload: CreateCinemaPayload): Promise<Cinema> {
    return request<Cinema>('/api/cinemas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getBookingQuote(cinemaId: number, groupSize: number): Promise<BookingQuote> {
    return request<BookingQuote>(`/api/cinemas/${cinemaId}/booking?groupSize=${groupSize}`);
  },
};
