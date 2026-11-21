import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

export interface ProgressBarProps {
  watchedCount: number;
  totalCount: number;
  remainingRuntimeMinutes?: number;
  label?: string;
  className?: string;
}

export function ProgressBar({
  watchedCount,
  totalCount,
  remainingRuntimeMinutes,
  label = 'Rewatch Progress',
  className = '',
}: ProgressBarProps) {
  const percentage =
    totalCount > 0 ? Math.min(100, Math.round((watchedCount / totalCount) * 100)) : 0;

  const formatRuntime = (minutes: number) => {
    if (minutes <= 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div
      className={`rounded-xl border border-slate-800 bg-mcu-card p-4 sm:p-5 shadow-lg ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-5 w-5 text-stark-cyan" />
          <h3 className="font-semibold text-white text-base">{label}</h3>
        </div>
        <div className="flex items-center justify-between sm:justify-start space-x-3 text-xs sm:text-sm">
          <span className="font-medium text-slate-300">
            <strong className="text-stark-cyan font-bold">{watchedCount}</strong> of{' '}
            <strong className="text-white font-bold">{totalCount}</strong> watched
          </span>
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-stark-cyan border border-stark-cyan/30">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-700/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-stark-dark via-stark-cyan to-marvel-red transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Remaining Runtime Badge */}
      {remainingRuntimeMinutes !== undefined && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {remainingRuntimeMinutes > 0 ? (
                <>
                  Remaining time:{' '}
                  <strong className="text-slate-200 font-semibold">
                    {formatRuntime(remainingRuntimeMinutes)}
                  </strong>
                </>
              ) : (
                <span className="text-emerald-400 font-medium">
                  All prerequisite movies watched! Ready for Doomsday.
                </span>
              )}
            </span>
          </div>
          {totalCount === 0 && (
            <span className="text-slate-400 italic">No prerequisites required</span>
          )}
        </div>
      )}
    </div>
  );
}
export default ProgressBar;
