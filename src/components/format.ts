import { NAMES } from '@/content/names';
import { getPlace, type GameEvent, type World } from '@/game';

export function formatMoney(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${NAMES.currency}${Math.round(Math.abs(amount))}`;
}

export function formatLiters(liters: number): string {
  return `${Math.round(liters)} L`;
}

export function formatKm(km: number): string {
  return `${Math.round(km)} km`;
}

/** "1h 05m", "12m 30s", "45s". */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export function formatSigned(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function describeEvent(event: GameEvent, world: World): string {
  switch (event.type) {
    case 'arrived': {
      const place = getPlace(world, event.placeId).name;
      if (event.unitsLoaded === 0) return `Arrived at ${place}. Nothing to load.`;
      return `Arrived at ${place}. Loaded ${event.unitsLoaded} units, paid ${formatMoney(event.payout)}.`;
    }
    case 'local-job-done':
      return `Local run done. Paid ${formatMoney(event.pay)}.`;
    case 'likes-settled':
      return `Your rebroadcast settled: ${formatSigned(event.delta)} ${NAMES.likes}.`;
  }
}
