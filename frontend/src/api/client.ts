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

// In-memory cache & request deduplication for production performance
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL_MS = 15_000; // 15 seconds freshness window
const responseCache = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

export function invalidateCache(pattern?: string | RegExp): void {
  if (!pattern) {
    responseCache.clear();
    return;
  }
  const keysToDelete: string[] = [];
  responseCache.forEach((_, key) => {
    if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => responseCache.delete(key));
}

interface RequestOptions extends RequestInit {
  bypassCache?: boolean;
  ttlMs?: number;
}

async function request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const isGet = !options?.method || options.method.toUpperCase() === 'GET';
  const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;

  // 1. Check in-memory cache for GET requests
  if (isGet && !options?.bypassCache) {
    const cached = responseCache.get(endpoint) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // 2. In-flight request deduplication (prevent identical concurrent network queries)
    const inFlight = pendingRequests.get(endpoint) as Promise<T> | undefined;
    if (inFlight) {
      return inFlight;
    }
  }

  const execute = async (): Promise<T> => {
    try {
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

      const result = (await response.json()) as T;

      // Cache successful GET responses
      if (isGet && !options?.bypassCache) {
        responseCache.set(endpoint, { data: result, timestamp: Date.now() });
      }

      return result;
    } finally {
      if (isGet) {
        pendingRequests.delete(endpoint);
      }
    }
  };

  if (isGet && !options?.bypassCache) {
    const promise = execute();
    pendingRequests.set(endpoint, promise);
    return promise;
  }

  return execute();
}

export const api = {
  // Cache invalidation utility
  clearCache: invalidateCache,

  // Movie endpoints
  getMovies(options?: { bypassCache?: boolean }): Promise<Movie[]> {
    return request<Movie[]>('/api/movies', { bypassCache: options?.bypassCache });
  },

  async createMovie(payload: CreateMoviePayload): Promise<Movie> {
    const result = await request<Movie>('/api/movies', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    invalidateCache('/api/movies');
    return result;
  },

  async updateMovie(id: number, payload: UpdateMoviePayload): Promise<Movie> {
    const result = await request<Movie>(`/api/movies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    invalidateCache('/api/movies');
    return result;
  },

  getRewatchOrder(id: number, options?: { bypassCache?: boolean }): Promise<RewatchPlan> {
    return request<RewatchPlan>(`/api/movies/${id}/rewatch-order`, {
      bypassCache: options?.bypassCache,
    });
  },

  // Cinema endpoints
  getCinemas(options?: { bypassCache?: boolean }): Promise<Cinema[]> {
    return request<Cinema[]>('/api/cinemas', { bypassCache: options?.bypassCache });
  },

  async createCinema(payload: CreateCinemaPayload): Promise<Cinema> {
    const result = await request<Cinema>('/api/cinemas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    invalidateCache('/api/cinemas');
    return result;
  },

  getBookingQuote(cinemaId: number, groupSize: number): Promise<BookingQuote> {
    return request<BookingQuote>(
      `/api/cinemas/${cinemaId}/booking?groupSize=${groupSize}`,
      { ttlMs: 60_000 } // DP quote results are pure and idempotent; cache for 60s
    );
  },
};
