'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, X, ShieldAlert } from 'lucide-react';

export interface ErrorAlertProps {
  error: string | null;
  errorCode?: string | null;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({
  error,
  errorCode,
  onDismiss,
  className = '',
}: ErrorAlertProps) {
  if (!error) return null;

  const isCircular = errorCode === 'CIRCULAR_DEPENDENCY';
  const isDuplicate =
    errorCode === 'DUPLICATE_TITLE' || errorCode === 'DUPLICATE_NAME';

  return (
    <div
      role="alert"
      className={`relative rounded-xl border p-4 transition-all duration-200 ${
        isCircular
          ? 'border-marvel-red/60 bg-marvel-red/10 text-red-200 shadow-lg shadow-marvel-red/10'
          : isDuplicate
          ? 'border-amber-500/60 bg-amber-500/10 text-amber-200'
          : 'border-rose-500/50 bg-rose-500/10 text-rose-200'
      } ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-0.5">
          {isCircular ? (
            <ShieldAlert className="h-5 w-5 text-marvel-red" />
          ) : isDuplicate ? (
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400" />
          )}
        </div>

        <div className="flex-1 pr-6">
          <h4 className="font-semibold text-sm leading-tight text-white mb-1">
            {isCircular
              ? 'Circular Dependency Conflict (HTTP 409)'
              : isDuplicate
              ? 'Duplicate Entity Conflict (HTTP 409)'
              : 'Action Failed'}
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {error}
          </p>

          {isCircular && (
            <div className="mt-2.5 rounded-lg bg-slate-900/80 p-2.5 text-xs text-slate-400 border border-slate-800">
              <strong className="text-stark-cyan block mb-0.5">
                Directed Acyclic Graph (DAG) Rule:
              </strong>
              MCU watch prerequisites cannot form cycles. A movie cannot depend on
              itself directly or through transitive chains (e.g. Endgame → Iron Man
              when Iron Man is already an ancestor of Endgame).
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="absolute top-3 right-3 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
export default ErrorAlert;
