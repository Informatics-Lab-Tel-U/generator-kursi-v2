import type { SeatData } from './types';

export function formatTimeWithMs(remainMs: number): string {
  if (remainMs < 0) remainMs = 0;
  const totalSeconds = Math.floor(remainMs / 1000);
  const centi = Math.floor((remainMs % 1000) / 10);

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const centiStr = String(centi).padStart(2, '0');

  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${centiStr}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${centiStr}`;
}

export function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function formatClockTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function makeEmptySeats(totalSeats: number = 50): SeatData[] {
  return Array.from({ length: totalSeats }, (_, i) => ({
    seatNo: i + 1,
    student: null,
  }));
}
