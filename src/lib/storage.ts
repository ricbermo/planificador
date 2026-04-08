import type { DayState } from './types';

const KEY = 'companion-app:day';

export function loadDay(): DayState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DayState;
  } catch {
    return null;
  }
}

export function saveDay(day: DayState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(day));
  } catch {
    /* ignore quota errors */
  }
}

export function clearDay(): void {
  localStorage.removeItem(KEY);
}
