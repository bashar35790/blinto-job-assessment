'use client';

import React, { useEffect, useMemo, useState, useDeferredValue } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Film,
  Plus,
  Edit2,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Search,
  Layers,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addMovie,
  clearMovieError,
  fetchMovies,
  updateMovie,
} from '@/store/slices/moviesSlice';
import type {
  CreateMoviePayload,
  Movie,
  UpdateMoviePayload,
} from '@/api/client';
import { Navbar } from '@/components/Navbar';
import { ErrorAlert } from '@/components/ErrorAlert';

// Code splitting: dynamically import the heavy modal only when requested by the user
const MovieModal = dynamic(
  () => import('@/components/MovieModal').then((mod) => mod.MovieModal),
  { ssr: false, loading: () => null }
);

export default function MoviesPage() {
  const dispatch = useAppDispatch();
  const { items: movies, loading, submitting, error, errorCode } = useAppSelector(
    (state) => state.movies
  );

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [filterWatched, setFilterWatched] = useState<'all' | 'watched' | 'unwatched'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovieForEdit, setSelectedMovieForEdit] = useState<Movie | null>(null);

  useEffect(() => {
    // If movies are already in store, skip network trip; otherwise fetch
    if (movies.length === 0) {
      dispatch(fetchMovies());
    }
  }, [dispatch, movies.length]);

  const handleOpenAddModal = () => {
    setSelectedMovieForEdit(null);
    dispatch(clearMovieError());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (movie: Movie) => {
    setSelectedMovieForEdit(movie);
    dispatch(clearMovieError());
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMovieForEdit(null);
    dispatch(clearMovieError());
  };

  const handleToggleWatched = (movie: Movie) => {
    // Optimistic toggle dispatch
    dispatch(
      updateMovie({
        id: movie.id,
        data: { watched: !movie.watched },
      })
    );
  };

  const handleModalSubmit = async (
    payload: CreateMoviePayload | { id: number; data: UpdateMoviePayload }
  ) => {
    try {
      if ('id' in payload) {
        await dispatch(
          updateMovie({ id: payload.id, data: payload.data })
        ).unwrap();
      } else {
        await dispatch(addMovie(payload)).unwrap();
      }
      setIsModalOpen(false);
      setSelectedMovieForEdit(null);
    } catch {
      // Error handled in Redux state and rendered in Modal / Page
    }
  };

  // Filtered movies with deferred search to keep 60fps input responsiveness
  const filteredMovies = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    return movies.filter((movie) => {
      const matchesSearch =
        !q ||
        movie.title.toLowerCase().includes(q) ||
        movie.releaseYear.toString().includes(q);

      if (!matchesSearch) return false;

      if (filterWatched === 'watched') return movie.watched;
      if (filterWatched === 'unwatched') return !movie.watched;
      return true;
    });
  }, [movies, deferredSearchQuery, filterWatched]);

  // Catalog stats
  const watchedCount = movies.filter((m) => m.watched).length;
  const totalRuntime = movies.reduce((sum, m) => sum + m.runtimeMinutes, 0);
  const totalHours = Math.floor(totalRuntime / 60);
  const totalMins = totalRuntime % 60;

  return (
    <div className="min-h-screen bg-mcu-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Film className="h-6 w-6 text-stark-cyan" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                MCU Movie Catalog
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Manage movies, prerequisites graph, and watch progression ahead of Doomsday.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center space-x-2 rounded-xl bg-stark-cyan px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-stark-cyan/20 hover:bg-stark-dark transition-all duration-200 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Movie</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <ErrorAlert
            error={error}
            errorCode={errorCode}
            onDismiss={() => dispatch(clearMovieError())}
          />
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-mcu-card p-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Total Movies
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{movies.length}</span>
              <Layers className="h-5 w-5 text-slate-500" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-mcu-card p-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Watched Progress
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-stark-cyan">
                {watchedCount} <span className="text-sm font-normal text-slate-400">/ {movies.length}</span>
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stark-cyan/15 text-stark-cyan border border-stark-cyan/30">
                {movies.length > 0 ? Math.round((watchedCount / movies.length) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-mcu-card p-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Total MCU Runtime
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">
                {totalHours}h {totalMins}m
              </span>
              <Clock className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-mcu-card">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search movie title or release year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3.5 py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-stark-cyan focus:outline-none focus:ring-1 focus:ring-stark-cyan"
            />
          </div>

          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterWatched('all')}
              className={`flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterWatched === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({movies.length})
            </button>
            <button
              onClick={() => setFilterWatched('watched')}
              className={`flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterWatched === 'watched'
                  ? 'bg-stark-cyan/20 text-stark-cyan border border-stark-cyan/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Watched ({watchedCount})
            </button>
            <button
              onClick={() => setFilterWatched('unwatched')}
              className={`flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterWatched === 'unwatched'
                  ? 'bg-marvel-red/20 text-marvel-red border border-marvel-red/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unwatched ({movies.length - watchedCount})
            </button>
          </div>
        </div>

        {/* Movie Catalog Table */}
        <div className="rounded-xl border border-slate-800 bg-mcu-card overflow-hidden shadow-xl">
          {loading && movies.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-stark-cyan" />
              <p className="text-sm text-slate-400">Loading MCU catalog...</p>
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Film className="h-10 w-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-white">No Movies Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No movies match "${searchQuery}". Try a different search.`
                  : 'No movies are registered yet. Click "+ Add Movie" to create one.'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card List (< md screens) */}
              <div className="md:hidden divide-y divide-slate-800/80">
                {filteredMovies.map((movie) => (
                  <div key={movie.id} className="p-4 space-y-3">
                    {/* Header: Checkbox + Title + Year + Runtime */}
                    <div className="flex items-start justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleWatched(movie)}
                        aria-label={`Mark ${movie.title} as ${
                          movie.watched ? 'unwatched' : 'watched'
                        }`}
                        className="pt-0.5 text-slate-400 hover:text-stark-cyan transition-colors flex-shrink-0 touch-manipulation"
                      >
                        {movie.watched ? (
                          <CheckCircle2 className="h-6 w-6 text-stark-cyan fill-stark-cyan/20" />
                        ) : (
                          <Circle className="h-6 w-6 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span
                            className={`font-bold text-sm sm:text-base leading-snug break-words ${
                              movie.watched
                                ? 'text-slate-400 line-through decoration-slate-500'
                                : 'text-white'
                            }`}
                          >
                            {movie.title}
                          </span>
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            ({movie.releaseYear})
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center space-x-1 rounded-md bg-slate-900 border border-slate-700/80 px-2 py-0.5 text-xs text-slate-300 font-mono flex-shrink-0">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{movie.runtimeMinutes}m</span>
                      </span>
                    </div>

                    {/* Prerequisites */}
                    <div className="pl-8">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                        Prerequisites:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {movie.prerequisites && movie.prerequisites.length > 0 ? (
                          movie.prerequisites.map((prereq) => (
                            <span
                              key={prereq.id}
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${
                                prereq.watched
                                  ? 'bg-slate-900/90 text-slate-500 border-slate-800 line-through'
                                  : 'bg-marvel-red/10 text-red-300 border-marvel-red/30'
                              }`}
                            >
                              {prereq.title}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            Direct watch (No prerequisites)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-1 pl-8">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(movie)}
                        className="flex-1 inline-flex items-center justify-center space-x-1 rounded-lg border border-slate-700 bg-slate-900/80 py-2 text-xs font-medium text-slate-300 hover:border-stark-cyan hover:text-stark-cyan transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                      <Link
                        href={`/rewatch?target=${movie.id}`}
                        className="flex-1 inline-flex items-center justify-center space-x-1 rounded-lg border border-stark-cyan/30 bg-stark-cyan/10 py-2 text-xs font-semibold text-stark-cyan hover:bg-stark-cyan hover:text-slate-950 transition-colors"
                      >
                        <span>Rewatch Plan</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= md screens) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      <th className="py-3.5 pl-4 pr-3 sm:pl-6 w-12 text-center">Watched</th>
                      <th className="py-3.5 px-3">Title &amp; Year</th>
                      <th className="py-3.5 px-3">Runtime</th>
                      <th className="py-3.5 px-3">Prerequisites Graph</th>
                      <th className="py-3.5 pr-4 pl-3 sm:pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm">
                    {filteredMovies.map((movie) => (
                      <tr
                        key={movie.id}
                        className="hover:bg-slate-800/30 transition-colors group"
                      >
                        {/* Watched Toggle (Optimistic) */}
                        <td className="py-4 pl-4 pr-3 sm:pl-6 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleWatched(movie)}
                            aria-label={`Mark ${movie.title} as ${
                              movie.watched ? 'unwatched' : 'watched'
                            }`}
                            className="inline-flex items-center justify-center rounded-lg p-1 text-slate-400 hover:text-stark-cyan transition-colors"
                          >
                            {movie.watched ? (
                              <CheckCircle2 className="h-5 w-5 text-stark-cyan fill-stark-cyan/20" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>
                        </td>

                        {/* Title & Year */}
                        <td className="py-4 px-3">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-semibold ${
                                movie.watched ? 'text-slate-200 line-through decoration-slate-500' : 'text-white'
                              }`}
                            >
                              {movie.title}
                            </span>
                            <span className="text-xs text-slate-400">
                              ({movie.releaseYear})
                            </span>
                          </div>
                        </td>

                        {/* Runtime Badge */}
                        <td className="py-4 px-3">
                          <span className="inline-flex items-center space-x-1 rounded-md bg-slate-900 border border-slate-700/80 px-2 py-0.5 text-xs text-slate-300 font-mono">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{movie.runtimeMinutes}m</span>
                          </span>
                        </td>

                        {/* Prerequisites Graph Badges */}
                        <td className="py-4 px-3">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {movie.prerequisites && movie.prerequisites.length > 0 ? (
                              movie.prerequisites.map((prereq) => (
                                <span
                                  key={prereq.id}
                                  className={`inline-flex items-center space-x-1 rounded-md px-2 py-0.5 text-xs font-medium border ${
                                    prereq.watched
                                      ? 'bg-slate-900/90 text-slate-400 border-slate-700 line-through'
                                      : 'bg-marvel-red/10 text-red-300 border-marvel-red/30'
                                  }`}
                                >
                                  <span>{prereq.title}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Direct watch (No prerequisites)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 pr-4 pl-3 sm:pr-6 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(movie)}
                            className="inline-flex items-center space-x-1 rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-stark-cyan hover:text-stark-cyan transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>

                          <Link
                            href={`/rewatch?target=${movie.id}`}
                            className="inline-flex items-center space-x-1 rounded-lg border border-stark-cyan/30 bg-stark-cyan/10 px-2.5 py-1 text-xs font-semibold text-stark-cyan hover:bg-stark-cyan hover:text-slate-950 transition-colors"
                          >
                            <span>Rewatch Plan</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Add / Edit Movie Modal */}
      <MovieModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        movieToEdit={selectedMovieForEdit}
        allMovies={movies}
        onSubmit={handleModalSubmit}
        isLoading={submitting}
        serverError={error}
        serverErrorCode={errorCode}
        onClearError={() => dispatch(clearMovieError())}
      />
    </div>
  );
}
