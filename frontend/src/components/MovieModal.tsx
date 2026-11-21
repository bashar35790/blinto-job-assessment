'use client';

import React, { useEffect, useState } from 'react';
import { X, Film, Check, Plus, Loader2 } from 'lucide-react';
import type {
  CreateMoviePayload,
  Movie,
  UpdateMoviePayload,
} from '@/api/client';
import { ErrorAlert } from './ErrorAlert';

export interface MovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieToEdit?: Movie | null;
  allMovies: Movie[];
  onSubmit: (
    payload: CreateMoviePayload | { id: number; data: UpdateMoviePayload }
  ) => Promise<void> | void;
  isLoading?: boolean;
  serverError?: string | null;
  serverErrorCode?: string | null;
  onClearError?: () => void;
}

export function MovieModal({
  isOpen,
  onClose,
  movieToEdit,
  allMovies,
  onSubmit,
  isLoading = false,
  serverError = null,
  serverErrorCode = null,
  onClearError,
}: MovieModalProps) {
  const isEditing = Boolean(movieToEdit);

  const [title, setTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState<number>(2024);
  const [runtimeMinutes, setRuntimeMinutes] = useState<number>(120);
  const [watched, setWatched] = useState<boolean>(false);
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<number[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (movieToEdit) {
      setTitle(movieToEdit.title);
      setReleaseYear(movieToEdit.releaseYear);
      setRuntimeMinutes(movieToEdit.runtimeMinutes);
      setWatched(movieToEdit.watched);
      setSelectedPrereqIds(movieToEdit.prerequisites.map((p) => p.id));
    } else {
      setTitle('');
      setReleaseYear(new Date().getFullYear());
      setRuntimeMinutes(120);
      setWatched(false);
      setSelectedPrereqIds([]);
    }
    setValidationError(null);
  }, [movieToEdit, isOpen]);

  if (!isOpen) return null;

  const togglePrereq = (id: number) => {
    setSelectedPrereqIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Movie title is required');
      return;
    }
    if (releaseYear < 1888 || releaseYear > 2100) {
      setValidationError('Release year must be between 1888 and 2100');
      return;
    }
    if (runtimeMinutes < 1 || runtimeMinutes > 300) {
      setValidationError('Runtime must be between 1 and 300 minutes');
      return;
    }

    if (isEditing && movieToEdit) {
      await onSubmit({
        id: movieToEdit.id,
        data: {
          title: trimmedTitle,
          releaseYear,
          runtimeMinutes,
          watched,
          prerequisites: selectedPrereqIds,
        },
      });
    } else {
      await onSubmit({
        title: trimmedTitle,
        releaseYear,
        runtimeMinutes,
        prerequisites: selectedPrereqIds,
      });
    }
  };

  // Filter out the movie being edited to prevent direct self-selection
  const availablePrereqMovies = allMovies.filter(
    (m) => !movieToEdit || m.id !== movieToEdit.id
  );

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
            <Film className="h-5 w-5 text-stark-cyan" />
            <h3 className="text-lg font-bold text-white">
              {isEditing ? 'Edit Movie & Prerequisites' : 'Add New MCU Movie'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Server or Validation Errors */}
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
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Captain America: Civil War"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-stark-cyan focus:outline-none focus:ring-1 focus:ring-stark-cyan"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Release Year
              </label>
              <input
                type="number"
                min={1888}
                max={2100}
                value={releaseYear}
                onChange={(e) => setReleaseYear(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white focus:border-stark-cyan focus:outline-none focus:ring-1 focus:ring-stark-cyan"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Runtime (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={runtimeMinutes}
                onChange={(e) => setRuntimeMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white focus:border-stark-cyan focus:outline-none focus:ring-1 focus:ring-stark-cyan"
                required
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="watched-check"
                checked={watched}
                onChange={(e) => setWatched(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-stark-cyan focus:ring-stark-cyan focus:ring-offset-slate-900"
              />
              <label
                htmlFor="watched-check"
                className="text-sm font-medium text-slate-300 cursor-pointer"
              >
                Mark as watched
              </label>
            </div>
          )}

          {/* Prerequisite Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Prerequisites ({selectedPrereqIds.length} selected)
              </label>
              {selectedPrereqIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPrereqIds([])}
                  className="text-xs text-slate-400 hover:text-stark-cyan transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-700/80 bg-slate-900/90 p-2 space-y-1.5 scrollbar-thin">
              {availablePrereqMovies.length === 0 ? (
                <p className="text-xs text-slate-500 p-2 text-center">
                  No other movies available to select as prerequisites.
                </p>
              ) : (
                availablePrereqMovies.map((movie) => {
                  const isSelected = selectedPrereqIds.includes(movie.id);
                  return (
                    <div
                      key={movie.id}
                      onClick={() => togglePrereq(movie.id)}
                      className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-stark-cyan/15 text-stark-cyan border border-stark-cyan/40'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate mr-2">
                        {movie.title} ({movie.releaseYear})
                      </span>
                      <div
                        className={`h-4 w-4 rounded flex items-center justify-center border ${
                          isSelected
                            ? 'border-stark-cyan bg-stark-cyan text-slate-950'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Select movies that must be watched before this one.
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
              disabled={isLoading}
              className="flex items-center space-x-2 rounded-lg bg-stark-cyan px-4 py-2 text-sm font-bold text-slate-950 hover:bg-stark-dark transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>{isEditing ? 'Save Changes' : 'Create Movie'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default MovieModal;
