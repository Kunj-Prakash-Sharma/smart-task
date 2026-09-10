'use client';

import { cn } from '@/lib/utils';
import { describeRecurrence } from '@/lib/utils/dates';

export interface RecurrenceDayPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
  className?: string;
}

const DAY_CHIPS: Array<{ day: number; label: string }> = [
  { day: 0, label: 'S' },
  { day: 1, label: 'M' },
  { day: 2, label: 'T' },
  { day: 3, label: 'W' },
  { day: 4, label: 'T' },
  { day: 5, label: 'F' },
  { day: 6, label: 'S' },
];

const PRESETS: Array<{ label: string; days: number[] }> = [
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Weekends', days: [0, 6] },
  { label: 'Daily', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'None', days: [] },
];

function samePattern(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((day) => setB.has(day));
}

export function RecurrenceDayPicker({ value, onChange, className }: RecurrenceDayPickerProps) {
  function toggleDay(day: number) {
    const next = value.includes(day) ? value.filter((d) => d !== day) : [...value, day];
    onChange(next);
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-1.5">
        {DAY_CHIPS.map(({ day, label }) => {
          const active = value.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              aria-pressed={active}
              aria-label={`Repeat on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]}`}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.days)}
            className={cn(
              'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
              samePattern(value, preset.days)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{describeRecurrence(value)}</p>
    </div>
  );
}
