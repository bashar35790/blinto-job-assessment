'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Ticket,
  Plus,
  Sparkles,
  Users,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Building2,
  Layers,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearBookingError,
  clearQuote,
  createCinema,
  fetchCinemas,
  getBookingQuote,
  setGroupSize,
  setSelectedCinemaId,
} from '@/store/slices/bookingSlice';
import type { CreateCinemaPayload } from '@/api/client';
import { Navbar } from '@/components/Navbar';
import { ErrorAlert } from '@/components/ErrorAlert';

// Code splitting: dynamically import modal only when user opens "+ Create Cinema"
const CinemaModal = dynamic(
  () => import('@/components/CinemaModal').then((mod) => mod.CinemaModal),
  { ssr: false, loading: () => null }
);

const PRESET_GROUP_SIZES = [6, 11, 44, 100, 500, 1000];

export default function BookingPage() {
  const dispatch = useAppDispatch();
  const {
    cinemas,
    selectedCinemaId,
    groupSize,
    quote,
    loadingCinemas,
    loadingQuote,
    creatingCinema,
    error,
    errorCode,
  } = useAppSelector((state) => state.booking);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customGroupSize, setCustomGroupSize] = useState<string>(
    groupSize.toString()
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (cinemas.length === 0) {
      dispatch(fetchCinemas());
    }
  }, [dispatch, cinemas.length]);

  const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId);

  // Trigger quote calculation
  const handleCalculate = (targetCinemaId?: number, targetSize?: number) => {
    setValidationError(null);
    dispatch(clearBookingError());

    const cid = targetCinemaId ?? selectedCinemaId;
    const gSize = targetSize ?? parseInt(customGroupSize, 10);

    if (!cid) {
      setValidationError('Please select a cinema first.');
      return;
    }
    if (isNaN(gSize) || gSize < 1 || gSize > 10000) {
      setValidationError('Group size must be an integer between 1 and 10,000.');
      return;
    }

    dispatch(setGroupSize(gSize));
    dispatch(getBookingQuote({ cinemaId: cid, groupSize: gSize }));
  };

  const handleSelectCinema = (cinemaId: number) => {
    dispatch(setSelectedCinemaId(cinemaId));
    handleCalculate(cinemaId, parseInt(customGroupSize, 10));
  };

  const handlePresetSelect = (presetSize: number) => {
    setCustomGroupSize(presetSize.toString());
    handleCalculate(selectedCinemaId ?? undefined, presetSize);
  };

  const handleCreateCinema = async (payload: CreateCinemaPayload) => {
    try {
      const newCinema = await dispatch(createCinema(payload)).unwrap();
      setIsModalOpen(false);
      handleCalculate(newCinema.id, parseInt(customGroupSize, 10));
    } catch {
      // Error handled by Redux error state
    }
  };

  return (
    <div className="min-h-screen bg-mcu-dark text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Ticket className="h-6 w-6 text-stark-cyan" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Watch-Party Bundle Optimizer
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Unbounded coin-change dynamic programming algorithm minimizing cinema bundle tickets.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 rounded-xl bg-stark-cyan px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-stark-cyan/20 hover:bg-stark-dark transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Create Cinema</span>
          </button>
        </div>

        {/* Global Errors */}
        <div className="space-y-3">
          {validationError && (
            <ErrorAlert
              error={validationError}
              onDismiss={() => setValidationError(null)}
            />
          )}
          {error && (
            <ErrorAlert
              error={error}
              errorCode={errorCode}
              onDismiss={() => dispatch(clearBookingError())}
            />
          )}
        </div>

        {/* Main Controls Card */}
        <div className="rounded-2xl border border-slate-800 bg-mcu-card p-6 shadow-xl space-y-6">
          {/* Cinema Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
              <Building2 className="h-4 w-4 text-stark-cyan" />
              <span>1. Select Cinema &amp; Bundle Configuration</span>
            </label>

            {loadingCinemas && cinemas.length === 0 ? (
              <div className="flex items-center space-x-2 p-3 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-stark-cyan" />
                <span>Loading available cinemas...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {cinemas.map((cinema) => {
                  const isSelected = cinema.id === selectedCinemaId;
                  return (
                    <div
                      key={cinema.id}
                      onClick={() => handleSelectCinema(cinema.id)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                        isSelected
                          ? 'border-stark-cyan bg-stark-cyan/10 shadow-lg shadow-stark-cyan/5 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">
                          {cinema.name}
                        </span>
                        {isSelected && (
                          <span className="rounded-full bg-stark-cyan px-2 py-0.5 text-[10px] font-bold text-slate-950">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {cinema.bundleSizes.map((size) => (
                          <span
                            key={size}
                            className={`rounded-md px-2 py-0.5 text-xs font-mono font-medium border ${
                              isSelected
                                ? 'bg-stark-cyan/20 text-stark-cyan border-stark-cyan/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {size} seats
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Group Size Input & Presets */}
          <div className="pt-4 border-t border-slate-800/80">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
              <Users className="h-4 w-4 text-stark-cyan" />
              <span>2. Enter Party Group Size</span>
            </label>

            {/* Quick Presets */}
            <div className="mb-3">
              <span className="text-xs text-slate-400 block mb-1.5">
                Quick test benchmarks:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_GROUP_SIZES.map((preset) => {
                  const isActive = customGroupSize === preset.toString();
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-stark-cyan text-slate-950 shadow-md shadow-stark-cyan/20'
                          : 'border border-slate-700 bg-slate-900 text-slate-300 hover:border-stark-cyan hover:text-stark-cyan'
                      }`}
                    >
                      {preset} people
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input & Calculate Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCalculate();
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={customGroupSize}
                  onChange={(e) => setCustomGroupSize(e.target.value)}
                  placeholder="Enter exact group size (1 to 10,000)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white focus:border-stark-cyan focus:outline-none focus:ring-1 focus:ring-stark-cyan"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  guests
                </span>
              </div>

              <button
                type="submit"
                disabled={loadingQuote}
                className="inline-flex items-center justify-center space-x-2 rounded-xl bg-stark-cyan px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-stark-cyan/20 hover:bg-stark-dark transition-all duration-200 disabled:opacity-50"
              >
                {loadingQuote ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Calculating DP...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4" />
                    <span>Calculate Best Quote</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* DP Quote Result Section */}
        {quote && (
          <div className="rounded-2xl border border-slate-800 bg-mcu-card p-6 shadow-xl animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-stark-cyan" />
                <h3 className="text-lg font-bold text-white">
                  Optimization Result for {quote.cinema.name}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Target: <strong className="text-white font-bold">{quote.groupSize}</strong> guests
              </span>
            </div>

            {quote.possible ? (
              <div className="mt-5 space-y-6">
                {/* Total Bundles Badge Card */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-gradient-to-r from-stark-cyan/15 via-slate-900 to-slate-900 border border-stark-cyan/40">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-stark-cyan font-bold block mb-1">
                      Minimum Total Bundles Required
                    </span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl sm:text-4xl font-black text-white">
                        {quote.totalBundles}
                      </span>
                      <span className="text-sm font-semibold text-slate-300">
                        {quote.totalBundles === 1 ? 'bundle' : 'bundles'} total
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-0 flex items-center space-x-2 text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Zero Wasted Seats (Exact Fit)</span>
                  </div>
                </div>

                {/* Bundle Breakdown Pills (Descending) */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                    <Layers className="h-4 w-4 text-stark-cyan" />
                    <span>Bundle Breakdown (Sorted Largest to Smallest)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {quote.breakdown &&
                      quote.breakdown.map((item) => (
                        <div
                          key={item.size}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-700/80 bg-slate-900"
                        >
                          <div>
                            <span className="text-xs text-slate-400 block">
                              Bundle Size
                            </span>
                            <span className="text-base font-bold text-white">
                              {item.size} seats
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-slate-400 block">
                              Quantity
                            </span>
                            <span className="inline-flex items-center rounded-lg bg-stark-cyan/20 border border-stark-cyan/40 px-2.5 py-0.5 text-sm font-mono font-black text-stark-cyan">
                              &times; {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Algorithm Note */}
                <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-800 text-xs text-slate-400">
                  <strong className="text-slate-200">DP Tie-Breaking Guarantee:</strong>{' '}
                  Calculated using hand-written unbounded coin-change DP ($O(N \cdot B)$).
                  Strict tie-breaking prefers fewer total tickets and prioritizes larger bundle units for maximum party cohesion.
                </div>
              </div>
            ) : (
              /* Impossible Combination Alert */
              <div className="mt-5 rounded-xl border border-amber-500/40 bg-amber-950/20 p-5 text-amber-200 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  <h4 className="font-bold text-base">No Exact Combination Possible</h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {quote.message || 'No exact combination'}. It is impossible to seat exactly{' '}
                  <strong className="text-white font-bold">{quote.groupSize}</strong> guests using the available bundle sizes{' '}
                  <strong className="text-amber-300 font-mono">
                    [{quote.cinema.bundleSizes.join(', ')}]
                  </strong>{' '}
                  without leaving empty seats.
                </p>
                <div className="pt-2 text-xs text-slate-400">
                  Tip: Try adjusting your party size or click &quot;Create Cinema&quot; to define a cinema with single-seat or custom bundle sizes.
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Cinema Modal */}
      <CinemaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCinema}
        isLoading={creatingCinema}
        serverError={error}
        serverErrorCode={errorCode}
        onClearError={() => dispatch(clearBookingError())}
      />
    </div>
  );
}
