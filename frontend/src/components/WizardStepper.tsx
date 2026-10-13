"use client";

import React from "react";
import { Check } from "lucide-react";

export interface WizardStepDef {
  label: string;
  hint?: string;
}

interface WizardStepperProps {
  steps: WizardStepDef[];
  /** 0-based index of the current step */
  current: number;
  /** Highest step index the user has reached (visited steps are clickable) */
  maxReached: number;
  onGo?: (index: number) => void;
}

/**
 * Stepper điều hướng dạng 1 › 2 › 3 › 4 dùng chung cho mọi wizard tạo mới
 * (tạo giải, đăng ký đội, thêm cầu thủ).
 */
export default function WizardStepper({ steps, current, maxReached, onGo }: WizardStepperProps) {
  const progress = steps.length > 1 ? Math.round((current / (steps.length - 1)) * 100) : 100;

  return (
    <nav aria-label="Tiến trình các bước" className="w-full">
      {/* Progress bar */}
      <div
        className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={current + 1}
      >
        <div
          className="h-full rounded-full bg-emerald-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="mt-3 flex items-stretch gap-1 sm:gap-2">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const reachable = i <= maxReached;
          const clickable = !!onGo && reachable && !active;

          return (
            <li key={step.label} className="flex min-w-0 flex-1 items-stretch last:flex-none">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onGo?.(i)}
                aria-current={active ? "step" : undefined}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-2 py-2 text-left transition-all sm:px-3 ${
                  active
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 shadow-xs"
                    : done
                    ? "border-emerald-200 dark:border-emerald-900 bg-white dark:bg-slate-900 hover:border-emerald-400"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-70"
                } ${clickable ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    active
                      ? "bg-emerald-600 text-white"
                      : done
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <span className="font-mono">{i + 1}</span>}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block truncate text-[11px] font-black sm:text-xs ${
                      active
                        ? "text-emerald-800 dark:text-emerald-300"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.hint && (
                    <span className="hidden truncate text-[10px] text-slate-500 dark:text-slate-400 sm:block">
                      {step.hint}
                    </span>
                  )}
                </span>
              </button>

              {/* Dấu › ngăn cách các bước */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="flex items-center px-0.5 text-lg font-black text-slate-300 dark:text-slate-600 sm:px-1"
                >
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
