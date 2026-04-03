'use client';

import { LucideIcon, ArrowLeft } from 'lucide-react';

interface EventEditorAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  icon?: LucideIcon;
}

interface EventEditorHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  backLabel: string;
  onBack: () => void;
  actions?: EventEditorAction[];
}

export function EventEditorHeader({
  title,
  description,
  icon: Icon,
  backLabel,
  onBack,
  actions = [],
}: EventEditorHeaderProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          {backLabel}
        </button>

        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Icon size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            const variant = action.variant ?? 'secondary';

            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={
                  variant === 'primary'
                    ? 'inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                    : 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }
              >
                {ActionIcon && <ActionIcon size={16} />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
