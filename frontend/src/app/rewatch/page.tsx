'use client';

import React, { Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckSquare,
  Film,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  Ticket,
  Loader2,
  Calendar,
  AlertCircle,
  ListOrdered,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMovies } from '@/store/slices/moviesSlice';
import {
  clearRewatchError,
  fetchRewatchPlan,
  setTargetMovieId,
  toggleWatchedFromPlan,
} from '@/store/slices/rewatchSlice';
import { Navbar } from '@/components/Navbar';
import { ProgressBar } from '@/components/ProgressBar';
import { ErrorAlert } from '@/components/ErrorAlert';

function RewatchContent() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const { items: allMovies, loading: loadingMovies } = useAppSelector(
    (state) => state.movies
  );
  const {
    targetMovieId,
    plan,
    loading: loadingPlan,
    togglingId,
    error,
    errorCode,
  } = useAppSelector((state) => state.rewatch);

  // 1. Initial Load: Fetch all movies to populate dropdown
  useEffect(() => {
    if (allMovies.length === 0) {
      dispatch(fetchMovies());
    }
  }, [dispatch, allMovies.length]);

  // 2. Select initial target movie (URL query param > "Avengers: Doomsday" > first movie)
  useEffect(() => {
    if (allMovies.length === 0) return;

    const queryTargetId = searchParams.get('target');
    let resolvedTargetId: number | null = null;

    if (queryTargetId) {
      const parsedId = parseInt(queryTargetId, 10);
      if (allMovies.some((m) => m.id === parsedId)) {
        resolvedTargetId = parsedId;
      }
    }

    if (!resolvedTargetId) {
      const doomsdayMovie = allMovies.find((m) =>
        m.title.toLowerCase().includes('doomsday')
      );
      resolvedTargetId = doomsdayMovie ? doomsdayMovie.id : allMovies[0].id;
    }

    if (resolvedTargetId !== targetMovieId) {
      dispatch(setTargetMovieId(resolvedTargetId));
      dispatch(fetchRewatchPlan(resolvedTargetId));
    }
  }, [allMovies, searchParams, targetMovieId, dispatch]);

  const handleSelectTarget = (newTargetId: number) => {
    dispatch(setTargetMovieId(newTargetId));
    dispatch(fetchRewatchPlan(newTargetId));
  };

  const handleToggleWatched = (movieId: number, currentWatched: boolean) => {
    if (!plan) return;
    dispatch(
      toggleWatchedFromPlan({
        movieId,
        watched: !currentWatched,
        targetId: plan.target.id,
      })
    );
  };

  const selectedTargetMovie = useMemo(() => {
    return allMovies.find((m) => m.id === targetMovieId) || plan?.target;
  }, [allMovies, targetMovieId, plan?.target]);

  // Find the index of the first unwatched movie in the sequence
  const nextUpIndex = useMemo(() => {
    if (!plan || !plan.order) return -1;
    return plan.order.findIndex((item) => !item.watched);
  }, [plan]);

  return (
    <div className="min-h-screen bg-mcu-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-6 w-6 text-stark-cyan" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Interactive Rewatch Plan
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Topological prerequisite sequence computed from directed acyclic graph traversal.
            </p>
          </div>

          {/* Quick link to Booking */}
          {plan && (
            <Link
              href={`/booking`}
              className="inline-flex items-center justify-center space-x-2 rounded-xl border border-stark-cyan/40 bg-stark-cyan/10 px-4 py-2.5 text-sm font-bold text-stark-cyan hover:bg-stark-cyan hover:text-slate-950 transition-all duration-200"
            >
              <Ticket className="h-4 w-4" />
              <span>Book Watch Party</span>
            </Link>
          )}
        </div>

        {/* Global Error Alert */}
        {error && (
          <ErrorAlert
            error={error}
            errorCode={errorCode}
            onDismiss={() => dispatch(clearRewatchError())}
          />
        )}

        {/* Target Movie Selector Card */}
        <div className="rounded-xl border border-slate-800 bg-mcu-card p-5 shadow-lg">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Target Finale Movie
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={targetMovieId || ''}
              onChange={(e) => handleSelectTarget(Number(e.target.value))}
              disabled={loadingPlan || allMovies.length === 0}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white focus:border-stark-cyan focus:outline-none focus:ring-1 focus:ring-stark-cyan"
            >
              {allMovies.map((movie) => (
                <option key={movie.id} value={movie.id}>
                  {movie.title} ({movie.releaseYear}) &bull; {movie.runtimeMinutes}m
                </option>
              ))}
            </select>

            <Link
              href="/movies"
              className="inline-flex items-center justify-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <Film className="h-3.5 w-3.5" />
              <span>Edit Graph</span>
            </Link>
          </div>
        </div>

        {/* Target Movie Header Card */}
        {selectedTargetMovie && (
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-mcu-card to-slate-900 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center space-x-1 rounded-full bg-marvel-red/20 px-2.5 py-0.5 text-xs font-bold text-marvel-red border border-marvel-red/30">
                  Target Destination
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {selectedTargetMovie.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{selectedTargetMovie.releaseYear}</span>
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{selectedTargetMovie.runtimeMinutes} minutes</span>
                  </span>
                  <span>&bull;</span>
                  <span
                    className={
                      selectedTargetMovie.watched
                        ? 'text-stark-cyan font-semibold'
                        : 'text-slate-400'
                    }
                  >
                    {selectedTargetMovie.watched ? 'Watched' : 'Not Watched'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loadingPlan && !plan && (
          <div className="flex flex-col items-center justify-center p-12 space-y-3 rounded-2xl border border-slate-800 bg-mcu-card">
            <Loader2 className="h-8 w-8 animate-spin text-stark-cyan" />
            <p className="text-sm text-slate-300">
              Calculating topological rewatch order...
            </p>
          </div>
        )}

        {/* Plan Output */}
        {plan && (
          <>
            {/* Dynamic Progress Tracker */}
            <ProgressBar
              watchedCount={plan.watchedCount}
              totalCount={plan.totalCount}
              remainingRuntimeMinutes={plan.remainingRuntimeMinutes}
              label={`Rewatch Progression for ${plan.target.title}`}
            />

            {/* Checklist Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ListOrdered className="h-5 w-5 text-stark-cyan" />
                  <h3 className="text-lg font-bold text-white">
                    Sequenced Prerequisite Checklist
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {plan.totalCount} {plan.totalCount === 1 ? 'movie' : 'movies'} required
                </span>
              </div>

              {/* Zero Prerequisites State */}
              {plan.totalCount === 0 ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    Ready to watch directly!
                  </h4>
                  <p className="text-sm text-slate-300 max-w-md mx-auto">
                    <strong className="text-emerald-400 font-semibold">{plan.target.title}</strong>{' '}
                    has no prerequisites in the graph. You can jump straight in without prior movies.
                  </p>
                </div>
              ) : (
                /* Sequenced Prerequisite Cards */
                <div className="space-y-2.5">
                  {plan.order.map((item, index) => {
                    const isNextUp = index === nextUpIndex;
                    const isTogglingThis = togglingId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 rounded-xl border p-3.5 sm:p-4 transition-all duration-200 ${
                          item.watched
                            ? 'border-slate-800/80 bg-slate-900/40 text-slate-400'
                            : isNextUp
                            ? 'border-stark-cyan/60 bg-stark-cyan/5 shadow-md shadow-stark-cyan/5 text-white'
                            : 'border-slate-800 bg-mcu-card text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {/* Step and Checkbox */}
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleWatched(item.id, item.watched)}
                            disabled={isTogglingThis}
                            aria-label={`Toggle ${item.title}`}
                            className="flex-shrink-0 text-slate-400 hover:text-stark-cyan transition-colors disabled:opacity-50 touch-manipulation p-0.5"
                          >
                            {isTogglingThis ? (
                              <Loader2 className="h-5 w-5 animate-spin text-stark-cyan" />
                            ) : item.watched ? (
                              <CheckCircle2 className="h-5 w-5 text-stark-cyan fill-stark-cyan/20" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>

                          {/* Step Badge */}
                          <span
                            className={`flex-shrink-0 rounded-md px-2 py-0.5 text-xs font-mono font-bold border ${
                              item.watched
                                ? 'bg-slate-800 text-slate-400 border-slate-700'
                                : isNextUp
                                ? 'bg-stark-cyan text-slate-950 border-stark-cyan'
                                : 'bg-slate-800 text-stark-cyan border-slate-700'
                            }`}
                          >
                            Step {index + 1}
                          </span>

                          {/* Title */}
                          <div className="min-w-0 flex-1 truncate">
                            <span
                              className={`text-sm sm:text-base font-semibold truncate ${
                                item.watched ? 'line-through text-slate-400' : 'text-white'
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center justify-between sm:justify-end space-x-2 pl-8 sm:pl-0 flex-shrink-0">
                          <span className="inline-flex items-center space-x-1 rounded-md bg-slate-900 border border-slate-800 px-2 py-0.5 text-xs text-slate-400 font-mono">
                            <Clock className="h-3 w-3" />
                            <span>{item.runtimeMinutes}m</span>
                          </span>

                          {item.watched ? (
                            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                              Watched
                            </span>
                          ) : isNextUp ? (
                            <span className="rounded-full bg-stark-cyan/20 border border-stark-cyan/50 px-2.5 py-0.5 text-xs font-bold text-stark-cyan animate-pulse">
                              Up Next
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                              Queued
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function RewatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-mcu-dark flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-stark-cyan" />
        </div>
      }
    >
      <RewatchContent />
    </Suspense>
  );
}
