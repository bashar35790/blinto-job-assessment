'use client';

import React, { useState } from 'react';
import { X, Ticket, Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import type { CreateCinemaPayload } from '@/api/client';
import { ErrorAlert } from './ErrorAlert';

export interface CinemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCinemaPayload) => Promise<void> | void;
  isLoading?: boolean;
  serverError?: string | null;
  serverErrorCode?: string | null;
  onClearError?: () => void;
}

const PRESET_BUNDLES = [
  { label: 'Standard {1, 3, 4}', sizes: [1, 3, 4] },
  { label: 'Duo-Quintuple {2, 5}', sizes: [2, 5] },
  { label: 'Large Group {6, 9, 20}', sizes: [6, 9, 20] },
  { label: 'Even Bundles {4, 6}', sizes: [4, 6] },
];

export function CinemaModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  serverError = null,
  serverErrorCode = null,
  onClearError,
}: CinemaModalProps) {
  const [name, setName] = useState('');
  const [bundleSizes, setBundleSizes] = useState<number[]>([1, 3, 4]);
  const [sizeInput, setSizeInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSize = () => {
    setValidationError(null);
    const size = parseInt(sizeInput, 10);
    if (isNaN(size) || size < 1 || size > 500) {
      setValidationError('Bundle size must be an integer between 1 and 500');
      return;
    }
    if (bundleSizes.includes(size)) {
      setValidationError(`Bundle size ${size} is already added`);
      return;
    }
    if (bundleSizes.length >= 10) {
      setValidationError('A cinema cannot have more than 10 bundle sizes');
      return;
    }

    setBundleSizes([...bundleSizes, size].sort((a, b) => a - b));
    setSizeInput('');
  };

  const handleRemoveSize = (sizeToRemove: number) => {
    setValidationError(null);
    setBundleSizes(bundleSizes.filter((s) => s !== sizeToRemove));
  };

  const applyPreset = (sizes: number[]) => {
    setValidationError(null);
    setBundleSizes([...sizes]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Cinema name is required');
      return;
    }
    if (bundleSizes.length === 0) {
      setValidationError('Please configure at least 1 bundle size (max 10)');
      return;
    }
    if (bundleSizes.length > 10) {
      setValidationError('Maximum 10 bundle sizes allowed');
      return;
    }

    await onSubmit({
      name: trimmedName,
      bundleSizes,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-mcu-card p-6 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Ticket className="h-5 w-5 text-stark-cyan" />
            <h3 className="text-lg font-bold text-white">Create New Cinema</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Errors */}
        <div className="mt-4 space-y-3">
          {validationError && (
            <ErrorAlert
              error={validationError}
              onDismiss={() => setValidationError(null)}
            />
          )}
          {serverError && (
            <ErrorAlert
              error={serverError}
              errorCode={serverErrorCode}
              onDismiss={onClearError}
            />
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Cinema Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sanctum Sanctorum Cinema"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-stark-cyan focus:outline-none focus:ring-1 focus:ring-stark-cyan"
              required
            />
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
              <Sparkles className="h-3 w-3 text-stark-cyan" />
              <span>Quick Test Presets</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_BUNDLES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.sizes)}
                  className="rounded-md border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300 hover:border-stark-cyan hover:text-stark-cyan transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bundle Sizes Configuration */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Bundle Sizes ({bundleSizes.length}/10 configured)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min={1}
                max={500}
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSize();
                  }
                }}
                placeholder="Bundle size (1–500)"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-stark-cyan focus:outline-none focus:ring-1 focus:ring-stark-cyan"
              />
              <button
                type="button"
                onClick={handleAddSize}
                className="flex items-center space-x-1 rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs font-bold text-stark-cyan hover:bg-slate-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Current Bundles Chips */}
            <div className="mt-2.5 flex flex-wrap gap-2 min-h-9 p-2 rounded-lg bg-slate-900/90 border border-slate-800">
              {bundleSizes.length === 0 ? (
                <span className="text-xs text-slate-500 italic p-0.5">
                  No bundle sizes added yet. Add at least 1 size.
                </span>
              ) : (
                bundleSizes.map((size) => (
                  <span
                    key={size}
                    className="inline-flex items-center space-x-1 rounded-full bg-stark-cyan/15 border border-stark-cyan/40 px-3 py-1 text-xs font-semibold text-stark-cyan"
                  >
                    <span>{size} seats</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(size)}
                      className="ml-1 rounded-full p-0.5 text-slate-400 hover:text-marvel-red transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              The DP optimizer will find the minimum combination of these bundle sizes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || bundleSizes.length === 0}
              className="flex items-center space-x-2 rounded-lg bg-stark-cyan px-4 py-2 text-sm font-bold text-slate-950 hover:bg-stark-dark transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Cinema</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default CinemaModal;
