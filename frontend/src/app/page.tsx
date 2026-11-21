'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  Film,
  CheckSquare,
  Ticket,
  Shield,
  ArrowRight,
  Sparkles,
  Cpu,
  Layers,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMovies } from '@/store/slices/moviesSlice';
import { fetchCinemas } from '@/store/slices/bookingSlice';
import { Navbar } from '@/components/Navbar';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { items: movies } = useAppSelector((state) => state.movies);
  const { cinemas } = useAppSelector((state) => state.booking);

  useEffect(() => {
    if (movies.length === 0) dispatch(fetchMovies());
    if (cinemas.length === 0) dispatch(fetchCinemas());
  }, [dispatch, movies.length, cinemas.length]);

  const watchedCount = movies.filter((m) => m.watched).length;
  const totalRuntimeMinutes = movies.reduce(
    (sum, m) => sum + m.runtimeMinutes,
    0
  );
  const totalHours = Math.floor(totalRuntimeMinutes / 60);

  return (
    <div className="min-h-screen bg-mcu-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-mcu-card to-mcu-dark p-8 sm:p-12 shadow-2xl text-center">
          <div className="inline-flex items-center space-x-2 rounded-full bg-marvel-red/20 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-marvel-red border border-marvel-red/40 mb-6">
            <Shield className="h-3.5 w-3.5" />
            <span>MCU Phase 6 Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            BE PREPARED FOR <br />
            <span className="text-marvel-red">AVENGERS:</span>{' '}
            <span className="text-stark-cyan">DOOMSDAY</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The ultimate full-stack platform for Marvel fans. Compute pure
            topological prerequisite chains, track your rewatch progress, and
            optimize watch-party cinema bundles using dynamic programming.
          </p>

          {/* Quick CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/rewatch"
              className="inline-flex items-center space-x-2 rounded-xl bg-stark-cyan px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-stark-cyan/20 hover:bg-stark-dark transition-all duration-200"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Start Rewatch Plan</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/booking"
              className="inline-flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3 text-sm font-bold text-slate-200 hover:border-stark-cyan hover:text-white transition-all duration-200"
            >
              <Ticket className="h-4 w-4 text-stark-cyan" />
              <span>Optimize Cinema Bundle</span>
            </Link>

            <Link
              href="/movies"
              className="inline-flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/40 px-5 py-3 text-sm font-semibold text-slate-400 hover:text-white transition-all duration-200"
            >
              <Film className="h-4 w-4" />
              <span>Manage Catalog</span>
            </Link>
          </div>
        </div>

        {/* Live Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-mcu-card p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Seeded Movies</span>
              <Film className="h-4 w-4 text-stark-cyan" />
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              {movies.length || 8}
            </div>
            <div className="mt-1 text-xs text-slate-400">Canonical MCU titles</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-mcu-card p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Watched Status</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-3xl font-black text-stark-cyan">
              {watchedCount}{' '}
              <span className="text-base font-normal text-slate-400">
                / {movies.length || 8}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {movies.length > 0
                ? Math.round((watchedCount / movies.length) * 100)
                : 0}
              % completed
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-mcu-card p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Cinema Venues</span>
              <Ticket className="h-4 w-4 text-stark-cyan" />
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              {cinemas.length || 4}
            </div>
            <div className="mt-1 text-xs text-slate-400">With custom bundles</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-mcu-card p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Total Runtime</span>
              <Clock className="h-4 w-4 text-marvel-red" />
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              {totalHours || 19}h+
            </div>
            <div className="mt-1 text-xs text-slate-400">Across multiverse saga</div>
          </div>
        </div>

        {/* 3 Core Platform Views */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-6 flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-stark-cyan" />
            <span>Core Platform Capabilities</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* View 1: Movies */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-mcu-card p-6 hover:border-slate-700 transition-all group">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 text-stark-cyan mb-4 group-hover:scale-105 transition-transform">
                  <Film className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  1. Movie Catalog &amp; Graph
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Manage the MCU movie library, toggle watched states with
                  optimistic rollbacks, and edit prerequisite relationships
                  protected against circular dependencies.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <Link
                  href="/movies"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-stark-cyan hover:text-white transition-colors"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* View 2: Rewatch */}
            <div className="flex flex-col justify-between rounded-2xl border border-stark-cyan/30 bg-gradient-to-b from-stark-cyan/5 to-mcu-card p-6 hover:border-stark-cyan/50 transition-all group shadow-lg shadow-stark-cyan/5">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stark-cyan/20 border border-stark-cyan/40 text-stark-cyan mb-4 group-hover:scale-105 transition-transform">
                  <CheckSquare className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  2. Topological Rewatch Plan
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Pure DFS topological sorting with diamond dependency
                  deduplication. Select any target finale to get an ordered step-by-step
                  checklist with live remaining runtime sync.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <Link
                  href="/rewatch"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-stark-cyan hover:text-white transition-colors"
                >
                  <span>View Rewatch Checklist</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* View 3: Booking */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-mcu-card p-6 hover:border-slate-700 transition-all group">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 text-marvel-red mb-4 group-hover:scale-105 transition-transform">
                  <Ticket className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  3. Watch-Party DP Optimizer
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Unbounded coin-change dynamic programming algorithm minimizing
                  ticket bundles for group sizes 1 to 10,000 with exact seating
                  and zero empty seats.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <Link
                  href="/booking"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-stark-cyan hover:text-white transition-colors"
                >
                  <span>Calculate Quotes</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Engineering Highlights */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-stark-cyan mb-3">
            <Cpu className="h-4 w-4" />
            <span>Interview-Ready Engineering Architecture</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-400">
            <div>
              <strong className="text-slate-200 block text-sm mb-1">
                Zero Algorithm Libraries
              </strong>
              Both Feature 1 (3-color DFS cycle check &amp; post-order DAG traversal)
              and Feature 2 (unbounded coin-change DP) are 100% hand-written pure
              functions with zero external graph or math dependencies.
            </div>

            <div>
              <strong className="text-slate-200 block text-sm mb-1">
                Serializable Concurrency
              </strong>
              Prerequisite updates execute in PostgreSQL `Serializable`
              isolation with automated `P2034` transaction retry loops to
              guarantee zero phantom dependencies and zero partial writes.
            </div>

            <div>
              <strong className="text-slate-200 block text-sm mb-1">
                Enterprise Next.js 14 + Redux
              </strong>
              Next.js 14.2 App Router with standalone Docker output, Redux Toolkit
              slices with optimistic updates and rollbacks, and dark MCU Tailwind theme.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
