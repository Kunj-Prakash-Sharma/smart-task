export function formatMinutes(minutes: number | null): string {
  if (!minutes || minutes <= 0) {
    return '—';
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) {
    return `${remainder}m`;
  }

  if (remainder === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(0)}%`;
}

export function getInitials(name: string | null, fallback = '?'): string {
  if (!name) {
    return fallback;
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}
