import { TIP_TRUTH, type Broadcaster, type CargoKind, type Phrase, type Place, type World } from '@/game/types';

/** Stylized fictional map (GDD §11: setting is open). Coordinates in km. */
export const PLACES: Place[] = [
  { id: 'truck-stop', name: 'Central Truck Stop', x: 0, y: 0 },
  { id: 'mill-town', name: 'Mill Town', x: 40, y: 15 },
  { id: 'river-port', name: 'River Port', x: -70, y: 30 },
  { id: 'orchard-valley', name: 'Orchard Valley', x: 25, y: -90 },
  { id: 'quarry', name: 'Old Quarry', x: 120, y: 60 },
  { id: 'border-depot', name: 'Border Depot', x: -150, y: -110 },
];

export const CARGO_KINDS: CargoKind[] = [
  { id: 'general', name: 'General freight', basePayPerUnit: 8 },
  { id: 'produce', name: 'Produce', basePayPerUnit: 10 },
  { id: 'lumber', name: 'Lumber', basePayPerUnit: 12 },
];

/** Character names are placeholders (GDD §7, §11). */
export const BROADCASTERS: Broadcaster[] = [
  {
    id: 'dispatcher',
    name: 'The Dispatcher',
    perceivedReliability: 0.9,
    truthWeights: { [TIP_TRUTH.Good]: 9, [TIP_TRUTH.Outdated]: 1, [TIP_TRUTH.Exaggerated]: 0, [TIP_TRUTH.Scam]: 0 },
    payMultiplier: 0.8,
  },
  {
    id: 'waitress',
    name: 'The Truck Stop Waitress',
    perceivedReliability: 0.75,
    truthWeights: { [TIP_TRUTH.Good]: 6, [TIP_TRUTH.Outdated]: 3, [TIP_TRUTH.Exaggerated]: 1, [TIP_TRUTH.Scam]: 0 },
    payMultiplier: 1,
  },
  {
    id: 'rival',
    name: 'The Rival Driver',
    perceivedReliability: 0.5,
    truthWeights: { [TIP_TRUTH.Good]: 4, [TIP_TRUTH.Outdated]: 2, [TIP_TRUTH.Exaggerated]: 4, [TIP_TRUTH.Scam]: 0 },
    payMultiplier: 1.1,
  },
  {
    id: 'scammer',
    name: 'The Scammer',
    perceivedReliability: 0.3,
    truthWeights: { [TIP_TRUTH.Good]: 1, [TIP_TRUTH.Outdated]: 0, [TIP_TRUTH.Exaggerated]: 2, [TIP_TRUTH.Scam]: 7 },
    payMultiplier: 1,
  },
];

export const PHRASES: Phrase[] = [
  { id: 'loading-now', text: 'Loading dock is open now.', hintsAt: null },
  { id: 'come-on-down', text: 'Come on down, driver.', hintsAt: null },
  { id: 'steady-work', text: 'Steady work, honest pay.', hintsAt: null },
  { id: 'heard-earlier', text: 'Heard this one earlier tonight...', hintsAt: TIP_TRUTH.Outdated },
  { id: 'last-week', text: 'Was still there last week, anyway.', hintsAt: TIP_TRUTH.Outdated },
  { id: 'biggest-load', text: 'Biggest load you ever saw!', hintsAt: TIP_TRUTH.Exaggerated },
  { id: 'trust-me', text: 'Trust me on this one.', hintsAt: TIP_TRUTH.Exaggerated },
  { id: 'cash-up-front', text: 'Cash up front, no questions.', hintsAt: TIP_TRUTH.Scam },
  { id: 'too-good', text: 'Easiest money of your life!', hintsAt: TIP_TRUTH.Scam },
];

export const WORLD: World = {
  places: PLACES,
  cargoKinds: CARGO_KINDS,
  broadcasters: BROADCASTERS,
  phrases: PHRASES,
  homePlaceId: 'truck-stop',
};
